import { getSupabaseServerClient, isSupabaseServerConfigured } from '../db/supabaseClient';
import { PaymentTransactionRecord, LpsRecord, PartnerMerchantRecord } from './guaranteeService';

/**
 * ============================================================================
 * KWANZAPAY SUPABASE DATA ADAPTER & PERSISTENCE LAYER
 * ============================================================================
 * 
 * Fornece sincronização bidirecional e persistência em tempo real no Supabase.
 * Todas as operações possuem fallback seguro para o motor em memória caso o
 * projeto Supabase ainda esteja em fase de deploy ou com credenciais pendentes.
 */
export class SupabasePersistenceService {
  /**
   * Verifica a conectividade e saúde da base de dados Supabase
   */
  public async checkHealth(): Promise<{
    configured: boolean;
    connected: boolean;
    tablesCreated?: boolean;
    url?: string;
    message: string;
    latencyMs?: number;
    instruction?: string;
  }> {
    if (!isSupabaseServerConfigured()) {
      return {
        configured: false,
        connected: false,
        message: 'Variáveis SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configuradas. Operando em modo de garantia local.',
      };
    }

    const client = getSupabaseServerClient();
    if (!client) {
      return {
        configured: true,
        connected: false,
        message: 'Falha ao instanciar o cliente Supabase.',
      };
    }

    const start = Date.now();
    try {
      const { error } = await client.from('merchants').select('id').limit(1);
      const latencyMs = Date.now() - start;

      if (!error) {
        return {
          configured: true,
          connected: true,
          tablesCreated: true,
          url: process.env.SUPABASE_URL,
          message: 'Conexão ativa e tabelas prontas no Supabase PostgreSQL.',
          latencyMs,
        };
      }

      // Se o código for PGRST205, o Supabase autenticou com sucesso, mas a tabela ainda não foi criada
      if (error.code === 'PGRST205') {
        return {
          configured: true,
          connected: true,
          tablesCreated: false,
          url: process.env.SUPABASE_URL,
          message: 'Conectado ao Supabase com sucesso! As tabelas ainda não foram criadas no banco de dados.',
          latencyMs,
          instruction: 'Execute o script SQL no SQL Editor do Supabase (disponível na aba Banco de Dados) para criar as tabelas.',
        };
      }

      return {
        configured: true,
        connected: false,
        tablesCreated: false,
        url: process.env.SUPABASE_URL,
        message: `Erro ao consultar Supabase: ${error.message} (${error.code})`,
        latencyMs,
      };
    } catch (err: any) {
      return {
        configured: true,
        connected: false,
        tablesCreated: false,
        url: process.env.SUPABASE_URL,
        message: `Exceção de rede ao contactar o Supabase: ${err.message}`,
      };
    }
  }

  /**
   * Sincroniza a criação de uma transação no Supabase
   */
  public async syncTransaction(tx: PaymentTransactionRecord): Promise<void> {
    const client = getSupabaseServerClient();
    if (!client) return;

    try {
      // 1. Garante que o merchant existe na tabela pública
      const { data: merchantData } = await client
        .from('merchants')
        .select('id')
        .eq('partner_id', tx.partnerId)
        .single();

      let merchantId = merchantData?.id;

      if (!merchantId) {
        const { data: newMerchant, error: mError } = await client
          .from('merchants')
          .insert({
            partner_id: tx.partnerId,
            name: 'Loja Parceira ' + tx.partnerId,
            secret_key: 'sec_live_' + tx.partnerId,
            notify_url: tx.notifyUrl,
            return_url: tx.returnUrl,
            balance: 0,
          })
          .select('id')
          .single();

        if (!mError && newMerchant) {
          merchantId = newMerchant.id;
        }
      }

      if (!merchantId) return;

      // 2. Insere ou atualiza a transação
      await client.from('transactions').upsert(
        {
          trade_no: tx.tradeNo,
          trade_token: tx.tradeToken,
          merchant_id: merchantId,
          partner_id: tx.partnerId,
          out_trade_no: tx.outTradeNo,
          amount: tx.amount,
          currency: tx.currency,
          subject: tx.subject,
          status: tx.status,
          nup_code: tx.nup || null,
          proof_receipt_url: tx.proofReceiptUrl || null,
          payment_method: tx.paymentMethod || null,
          lp_commission_amount: tx.lpsCommissionAmount || 0,
          platform_fee_amount: tx.platformFeeAmount || 0,
          notify_url: tx.notifyUrl,
          return_url: tx.returnUrl,
          transfer_deadline: tx.transferDeadline?.toISOString() || null,
          verification_deadline: tx.verificationDeadline?.toISOString() || null,
          webhook_delivered: tx.webhookDelivered,
          webhook_signature: tx.webhookSignature || null,
          paid_at: tx.paidAt?.toISOString() || null,
          created_at: tx.createdAt.toISOString(),
          updated_at: tx.updatedAt.toISOString(),
        },
        { onConflict: 'trade_no' }
      );
    } catch (error) {
      console.warn('[Supabase Sync] Falha não impeditiva ao persistir transação:', error);
    }
  }

  /**
   * Sincroniza saldo e estado do Provedor de Liquidez (LP)
   */
  public async syncLps(lp: LpsRecord): Promise<void> {
    const client = getSupabaseServerClient();
    if (!client) return;

    try {
      await client.from('lps').upsert(
        {
          id: lp.id.length === 36 ? lp.id : undefined, // se for UUID válido
          display_name: lp.displayName,
          status: lp.status,
          available_balance: lp.availableGuarantee,
          locked_escrow_balance: lp.frozenGuarantee,
          commission_rate: lp.commissionRate,
          total_commissions_earned: lp.totalCommissionsEarned,
          bank_name: lp.bankName,
          iban: lp.iban,
          account_holder: lp.accountHolder,
          express_phone: lp.expressPhone || null,
          rating: lp.rating,
          total_trades_completed: lp.tradesCompleted,
        },
        { onConflict: 'display_name' }
      );
    } catch (error) {
      console.warn('[Supabase Sync] Falha ao persistir dados do LP:', error);
    }
  }

  /**
   * Registra abertura de disputa no Supabase
   */
  public async recordDispute(tradeNo: string, reason: string, evidenceUrl?: string): Promise<void> {
    const client = getSupabaseServerClient();
    if (!client) return;

    try {
      const { data: tx } = await client
        .from('transactions')
        .select('id, user_id')
        .eq('trade_no', tradeNo)
        .single();

      if (tx?.id) {
        await client.from('disputes').upsert(
          {
            transaction_id: tx.id,
            opened_by_user_id: tx.user_id || 'c0000000-0000-0000-0000-000000000001',
            reason,
            evidence_url: evidenceUrl || null,
            status: 'OPEN',
          },
          { onConflict: 'transaction_id' }
        );
      }
    } catch (error) {
      console.warn('[Supabase Sync] Falha ao registrar disputa:', error);
    }
  }

  /**
   * Registra entrega de Webhook para auditoria
   */
  public async recordWebhookDelivery(
    tradeNo: string,
    notifyUrl: string,
    signature: string,
    payload: any,
    status: string,
    httpCode?: number
  ): Promise<void> {
    const client = getSupabaseServerClient();
    if (!client) return;

    try {
      await client.from('webhook_deliveries').insert({
        trade_no: tradeNo,
        notify_url: notifyUrl,
        signature,
        payload,
        status,
        http_code: httpCode || null,
      });
    } catch (error) {
      console.warn('[Supabase Sync] Falha ao logar webhook:', error);
    }
  }
}

export const supabasePersistence = new SupabasePersistenceService();
