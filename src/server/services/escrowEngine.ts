import crypto from 'crypto';

/**
 * ============================================================================
 * KWANZAPAY CORE ESCROW ENGINE (TYPESCRIPT / POSTGRESQL TRANSACTION ARCHITECTURE)
 * ============================================================================
 * 
 * Implementação de Produção contra Race Conditions, Injeção de Comprovantes
 * e Descongelamento Indevido de Saldos.
 */

export interface DbClient {
  query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }>;
}

export interface WebhookPayload {
  trade_no: string;
  out_trade_no: string;
  partner_id: string;
  amount: number;
  currency: string;
  status: 'TRADE_SUCCESS' | 'DISPUTED' | 'EXPIRED';
  nup?: string;
  paid_at?: string;
  timestamp: number;
  [key: string]: any;
}

export class EscrowEngineService {
  /**
   * 1. MATCHING + ESCROW LOCK COM BLOQUEIO PESSIMISTA (SELECT ... FOR UPDATE)
   * 
   * Previne condições de corrida quando múltiplos clientes tentam alocar a
   * liquidez do mesmo LP no mesmo milissegundo.
   */
  public async matchLpAndLockEscrow(
    client: DbClient,
    tradeToken: string,
    userId: string,
    paymentMethod: string
  ): Promise<{ transaction: any; lp: any }> {
    // Inicia controle de transação (deve ser chamado dentro de BEGIN ... COMMIT)
    
    // 1.1 Localiza e valida a transação
    const txRes = await client.query(
      `SELECT * FROM transactions WHERE trade_token = $1 FOR UPDATE`,
      [tradeToken]
    );

    if (txRes.rowCount === 0) {
      throw new Error('TRADE_NOT_FOUND: Transação inexistente ou token inválido.');
    }

    const tx = txRes.rows[0];

    if (tx.status !== 'PENDING_AUTH') {
      throw new Error(`INVALID_STATE: Transação no estado '${tx.status}'. Não permite matching.`);
    }

    // 1.2 Busca o melhor LP com lock de linha (SELECT ... FOR UPDATE)
    // O lock impede que outra transação simultânea leia ou debite este saldo antes do commit
    const lpRes = await client.query(
      `SELECT * FROM lps 
       WHERE status = 'ACTIVE' 
         AND available_balance >= $1
       ORDER BY rating DESC, available_balance DESC
       LIMIT 1
       FOR UPDATE`,
      [tx.amount]
    );

    if (lpRes.rowCount === 0) {
      throw new Error('NO_LIQUIDITY_AVAILABLE: Nenhum LP com saldo de garantia suficiente no momento.');
    }

    const selectedLp = lpRes.rows[0];

    // 1.3 Movimentação Atómica de Saldo: available -> locked_escrow
    // O banco possui CHECK (available_balance >= 0) garantindo impossibilidade de saldo negativo
    await client.query(
      `UPDATE lps 
       SET available_balance = available_balance - $1,
           locked_escrow_balance = locked_escrow_balance + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [tx.amount, selectedLp.id]
    );

    // 1.4 Atualiza a Transação com Timers Separados:
    // payment_window_timer = 15 minutos (900s) para o cliente transferir
    // lp_confirmation_timer = 30 minutos (1800s) para o LP verificar extrato bancário
    const now = new Date();
    const transferDeadline = new Date(now.getTime() + 900 * 1000); // 15 min

    const updatedTxRes = await client.query(
      `UPDATE transactions 
       SET user_id = $1,
           lp_id = $2,
           payment_method = $3,
           status = 'PENDING_USER_TRANSFER',
           payment_window_timer = 900,
           transfer_deadline = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [userId, selectedLp.id, paymentMethod, transferDeadline, tx.id]
    );

    return {
      transaction: updatedTxRes.rows[0],
      lp: {
        id: selectedLp.id,
        displayName: selectedLp.display_name,
        bankName: selectedLp.bank_name,
        iban: selectedLp.iban,
        accountHolder: selectedLp.account_holder,
        expressPhone: selectedLp.express_phone,
      }
    };
  }

  /**
   * 2. CONFIRMAÇÃO DE ENVIO PELO CLIENTE (COM NUP ÚNICO OBRIGATÓRIO)
   */
  public async submitProofAndNup(
    client: DbClient,
    tradeNo: string,
    userId: string,
    nup: string,
    proofUrl?: string
  ): Promise<any> {
    const cleanNup = nup.trim().toUpperCase();

    // 2.1 Verifica duplicidade de NUP (Proteção contra reciclagem de comprovativos)
    const nupCheck = await client.query(
      `SELECT id FROM transactions WHERE nup_code = $1 LIMIT 1`,
      [cleanNup]
    );

    if (nupCheck.rowCount > 0) {
      throw new Error(
        `DUPLICATE_NUP_ERROR: O NUP (${cleanNup}) já foi registrado numa transação anterior. Operação bloqueada.`
      );
    }

    // 2.2 Atualiza transação para PENDING_LP_VERIFICATION
    // O timer do LP é setado para 30 minutos (1800s) para compensar eventuais atrasos da rede bancária
    const now = new Date();
    const verificationDeadline = new Date(now.getTime() + 1800 * 1000); // 30 min

    const res = await client.query(
      `UPDATE transactions 
       SET nup_code = $1,
           proof_receipt_url = $2,
           status = 'PROOF_UPLOADED',
           lp_confirmation_timer = 1800,
           verification_deadline = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE trade_no = $4 
         AND status = 'PENDING_USER_TRANSFER'
       RETURNING *`,
      [cleanNup, proofUrl || null, verificationDeadline, tradeNo]
    );

    if (res.rowCount === 0) {
      throw new Error('INVALID_STATE: A transação não está no estado aguardando transferência.');
    }

    return res.rows[0];
  }

  /**
   * 3. LIQUIDAÇÃO ATÓMICA DE ESCROW (`releaseEscrow`)
   * 
   * Executa a divisão correta:
   * - Deduz de `locked_escrow_balance` do LP
   * - Paga a comissão de ganho ao LP (ex: 1%)
   * - Retém a taxa da plataforma (ex: 0.5%)
   * - Credita o saldo líquido na conta da Loja (Merchant)
   * - Gera payload e assinatura HMAC-SHA256 para o Webhook
   */
  public async releaseEscrow(
    client: DbClient,
    tradeNo: string,
    lpId: string
  ): Promise<{ transaction: any; webhookPayload: WebhookPayload; signature: string }> {
    // 3.1 Lock pessimista na transação
    const txRes = await client.query(
      `SELECT t.*, m.secret_key, m.partner_id as m_partner_id 
       FROM transactions t
       JOIN merchants m ON t.merchant_id = m.id
       WHERE t.trade_no = $1 AND t.lp_id = $2
       FOR UPDATE`,
      [tradeNo, lpId]
    );

    if (txRes.rowCount === 0) {
      throw new Error('TRADE_NOT_FOUND: Transação não encontrada para este Provedor de Liquidez.');
    }

    const tx = txRes.rows[0];

    // Permite libertação apenas se o comprovativo foi enviado ou está em verificação
    if (tx.status !== 'PROOF_UPLOADED' && tx.status !== 'PENDING_LP_VERIFICATION') {
      throw new Error(`INVALID_STATE: Impossível liquidar transação com status '${tx.status}'.`);
    }

    // 3.2 Lock pessimista no LP
    const lpRes = await client.query(
      `SELECT * FROM lps WHERE id = $1 FOR UPDATE`,
      [lpId]
    );

    const lp = lpRes.rows[0];
    const amount = Number(tx.amount);
    const lpCommissionRate = Number(lp.commission_rate || 1.0); // 1.0%

    const lpCommission = (amount * lpCommissionRate) / 100;
    const platformFee = (amount * 0.5) / 100; // 0.5% taxa de gateway KwanzaPay
    const merchantNetCredit = amount; // A loja recebe o valor integral (taxa subsidiada ou negociada)

    // 3.3 Liberta a caução de Escrow e adiciona a comissão ganha ao saldo disponível do LP
    await client.query(
      `UPDATE lps 
       SET locked_escrow_balance = locked_escrow_balance - $1,
           available_balance = available_balance + $2,
           total_commissions_earned = total_commissions_earned + $2,
           total_trades_completed = total_trades_completed + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [amount, lpCommission, lpId]
    );

    // 3.4 Credita o Saldo do Merchant
    await client.query(
      `UPDATE merchants 
       SET balance = balance + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [merchantNetCredit, tx.merchant_id]
    );

    // 3.5 Marca a transação como TRADE_SUCCESS
    const now = new Date();
    const updatedTxRes = await client.query(
      `UPDATE transactions 
       SET status = 'TRADE_SUCCESS',
           lp_commission_amount = $1,
           platform_fee_amount = $2,
           paid_at = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [lpCommission, platformFee, now, tx.id]
    );

    const completedTx = updatedTxRes.rows[0];

    // 3.6 Constrói Payload e Assinatura HMAC-SHA256 do Webhook
    const webhookPayload: WebhookPayload = {
      trade_no: completedTx.trade_no,
      out_trade_no: completedTx.out_trade_no,
      partner_id: tx.m_partner_id,
      amount: Number(completedTx.amount),
      currency: completedTx.currency,
      status: 'TRADE_SUCCESS',
      nup: completedTx.nup_code,
      paid_at: now.toISOString(),
      timestamp: Math.floor(Date.now() / 1000),
    };

    const signature = this.generateWebhookSignature(webhookPayload, tx.secret_key);

    return {
      transaction: completedTx,
      webhookPayload,
      signature
    };
  }

  /**
   * 4. ABERTURA DE DISPUTA E TRAVA DE SEGURANÇA (ISOLAMENTO DE ESTADO)
   * 
   * Se a transação entrar em disputa, a caução NÃO PODE ser libertada por jobs de timeout
   */
  public async openDispute(
    client: DbClient,
    tradeNo: string,
    openedByUserId: string,
    reason: string,
    evidenceUrl?: string
  ): Promise<any> {
    const txRes = await client.query(
      `SELECT * FROM transactions WHERE trade_no = $1 FOR UPDATE`,
      [tradeNo]
    );

    if (txRes.rowCount === 0) {
      throw new Error('TRADE_NOT_FOUND: Transação não encontrada.');
    }

    const tx = txRes.rows[0];

    if (tx.status === 'TRADE_SUCCESS' || tx.status === 'CANCELLED') {
      throw new Error(`INVALID_STATE: Não é possível abrir disputa para transações '${tx.status}'.`);
    }

    // 4.1 Marca transação como DISPUTED (Trava os fundos de Escrow indefinidamente até auditor)
    await client.query(
      `UPDATE transactions 
       SET status = 'DISPUTED',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [tx.id]
    );

    // 4.2 Cria o registro de disputa na tabela dedicada
    const disputeRes = await client.query(
      `INSERT INTO disputes (transaction_id, opened_by_user_id, reason, evidence_url, status)
       VALUES ($1, $2, $3, $4, 'OPEN')
       ON CONFLICT (transaction_id) DO UPDATE 
       SET reason = EXCLUDED.reason,
           evidence_url = EXCLUDED.evidence_url,
           updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [tx.id, openedByUserId, reason, evidenceUrl || null]
    );

    return disputeRes.rows[0];
  }

  /**
   * 5. GERAÇÃO E VALIDAÇÃO DE ASSINATURA HMAC-SHA256 PARA WEBHOOKS
   * 
   * Ordena alfabeticamente as chaves (excluindo 'signature'), gera query string canônica
   * e calcula o hash HMAC-SHA256 com a secretKey da loja.
   */
  public generateWebhookSignature(payload: Record<string, any>, secretKey: string): string {
    const filteredKeys = Object.keys(payload)
      .filter((k) => k !== 'signature' && payload[k] !== undefined && payload[k] !== null && payload[k] !== '')
      .sort();

    const canonicalString = filteredKeys
      .map((k) => `${k}=${typeof payload[k] === 'object' ? JSON.stringify(payload[k]) : payload[k]}`)
      .join('&');

    return crypto
      .createHmac('sha256', secretKey)
      .update(canonicalString)
      .digest('hex');
  }

  /**
   * Validação de Webhook do lado do Comerciante (Merchant SDK)
   */
  public verifyWebhookSignature(
    receivedPayload: Record<string, any>,
    receivedSignature: string,
    secretKey: string,
    maxToleranceSeconds: number = 300
  ): boolean {
    if (!receivedSignature) return false;

    // Proteção contra Replay Attack via Timestamp
    if (receivedPayload.timestamp) {
      const currentTime = Math.floor(Date.now() / 1000);
      if (Math.abs(currentTime - Number(receivedPayload.timestamp)) > maxToleranceSeconds) {
        return false; // Pacote expirado
      }
    }

    const expectedSignature = this.generateWebhookSignature(receivedPayload, secretKey);

    // Comparação em tempo constante para evitar Timing Attacks
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(receivedSignature, 'utf8');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  }
}

export const escrowEngine = new EscrowEngineService();
