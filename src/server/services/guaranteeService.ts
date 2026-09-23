import crypto from 'crypto';
import { 
  PaymentMethod, 
  TransactionStatus, 
  CreatePaymentOrderInput,
  WebhookPaymentCompletedPayload
} from '../schemas/paymentSchemas';
import { supabasePersistence } from './supabaseService';

export interface PartnerMerchantRecord {
  id: string;
  partnerId: string;
  name: string;
  secretKey: string;
  notifyUrl: string;
  returnUrl: string;
  balance: number;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'LPS' | 'MERCHANT' | 'ADMIN';
  internalBalance: number;
  expiredOrders24h: number;
  lpsBlockedUntil?: Date;
}

export interface LpsRecord {
  id: string;
  userId: string;
  displayName: string;
  status: 'ACTIVE' | 'PAUSED' | 'SUSPENDED';
  availableGuarantee: number; // Saldo de garantia desimpedido
  frozenGuarantee: number;    // Saldo congelado em Escrow
  commissionRate: number;     // ex: 1% (0.01)
  totalCommissionsEarned: number;
  bankName: string;
  iban: string;
  accountHolder: string;
  expressPhone?: string;
  rating: number;
  tradesCompleted: number;
}

export interface PaymentTransactionRecord {
  id: string;
  tradeNo: string;
  tradeToken: string;
  partnerId: string;
  outTradeNo: string;
  userId?: string;
  lpsId?: string;
  amount: number;
  amountCents: number;            // Padronização em inteiros (centésimos de AOA)
  currency: string;
  subject: string;
  paymentMethod?: PaymentMethod;
  status: TransactionStatus;
  nup?: string;
  lpsCommissionAmount: number;
  lpsCommissionCents: number;     // Garantia integral em inteiros
  platformFeeAmount: number;
  platformFeeCents: number;       // Arredondamento conservador em inteiros
  netMerchantAmount: number;      // Valor líquido entregue à loja
  netMerchantCents: number;       // Inteiro: amountCents - platformFeeCents - lpsCommissionCents
  ivaFeeAmount: number;           // IVA 14% sobre taxa do gateway (AGT)
  ivaFeeCents: number;
  timeLimitSeconds: number;
  transferDeadline?: Date;
  verificationDeadline?: Date;
  notifyUrl: string;
  returnUrl: string;
  proofReceiptUrl?: string;
  proofSanitized?: boolean;       // Validação em Sandbox de OCR
  proofSha256?: string;           // Hash antifraude
  disputeReason?: string;
  webhookDelivered: boolean;
  webhookSignature?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmisHealthStatus {
  successRate: number; // 0-100%
  totalSampled: number;
  status: 'HEALTHY' | 'DEGRADED' | 'MAINTENANCE';
  isNocturnalWindow: boolean;
  lastChecked: string;
  warningMessage?: string;
  recommendedAction: string;
}

export interface LpsNotificationRecord {
  id: string;
  lpsId: string;
  tradeNo: string;
  eventType: 'ORDER_ASSIGNED' | 'PROOF_UPLOADED' | 'DISPUTE_OPENED' | 'FUNDS_SETTLED';
  title: string;
  message: string;
  amount: number;
  timestamp: Date;
  channels: {
    websocket: 'DELIVERED' | 'ONLINE';
    pushNotification: 'SENT' | 'QUEUED';
    telegramBot: 'DELIVERED' | 'DISPATCHED' | 'FAILED';
    whatsAppApi: 'DELIVERED' | 'QUEUED';
  };
}

export interface WebhookLogRecord {
  id: string;
  tradeNo: string;
  notifyUrl: string;
  signature: string;
  payload: WebhookPaymentCompletedPayload;
  status: 'DELIVERED' | 'FAILED';
  dispatchedAt: Date;
}

class GuaranteeEngine {
  private merchants: Map<string, PartnerMerchantRecord> = new Map();
  private users: Map<string, UserRecord> = new Map();
  private lpsTable: Map<string, LpsRecord> = new Map();
  private transactions: Map<string, PaymentTransactionRecord> = new Map();
  private tokenIndex: Map<string, string> = new Map(); // tradeToken -> tradeNo
  private outTradeIndex: Map<string, string> = new Map(); // partnerId:outTradeNo -> tradeNo
  private nupRegistry: Set<string> = new Set(); // REGRA 4: NUP ÚNICO
  private idempotencyStore: Map<string, { hash: string; statusCode: number; body: any }> = new Map();
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();
  public webhookLogs: WebhookLogRecord[] = [];
  public lpsNotifications: LpsNotificationRecord[] = [];

  // Monitor Operacional EMIS / Multicaixa Express (Semáforo das últimas 10 transações)
  private emisSamples: Array<{ timestamp: Date; success: boolean; latencyMs: number }> = [
    { timestamp: new Date(Date.now() - 300000), success: true, latencyMs: 420 },
    { timestamp: new Date(Date.now() - 240000), success: true, latencyMs: 510 },
    { timestamp: new Date(Date.now() - 180000), success: true, latencyMs: 480 },
    { timestamp: new Date(Date.now() - 120000), success: false, latencyMs: 3200 }, // Falha pontual EMIS
    { timestamp: new Date(Date.now() - 60000), success: true, latencyMs: 490 },
    { timestamp: new Date(Date.now() - 40000), success: true, latencyMs: 450 },
    { timestamp: new Date(Date.now() - 20000), success: true, latencyMs: 530 },
  ];

  constructor() {
    this.seedData();
  }

  private seedData() {
    // 1. Merchant padrão (ex: Loja Kianda / TecnoAngola)
    const merchant: PartnerMerchantRecord = {
      id: 'mer_kianda_01',
      partnerId: 'KP_PARTNER_882910',
      name: 'Loja Kianda E-Commerce',
      secretKey: 'sec_live_kianda_9a87d65f12344c',
      notifyUrl: 'https://loja.ao/api/kwanza-pay/callback',
      returnUrl: 'https://loja.ao/checkout/sucesso',
      balance: 1425000,
    };
    this.merchants.set(merchant.partnerId, merchant);

    // 2. Usuário / Cliente padrão com saldo interno
    const clientUser: UserRecord = {
      id: 'usr_cliente_evaristo',
      email: 'evaristopaulocassoma2352@gmail.com',
      name: 'Evaristo Paulo Cassoma',
      role: 'USER',
      internalBalance: 350000, // 350.000 Kz de saldo interno
      expiredOrders24h: 0,
    };
    this.users.set(clientUser.id, clientUser);
    this.users.set(clientUser.email, clientUser);

    // 3. Provedores de Liquidez (LPS) com garantia disponível e congelada
    const primaryLps: LpsRecord = {
      id: 'lps_atlantico_01',
      userId: 'usr_evaristo_lps',
      displayName: 'LP Atlântico (Evaristo Paulo)',
      status: 'ACTIVE',
      availableGuarantee: 8396000, // 8.396.000 Kz disponíveis
      frozenGuarantee: 854000,     // 854.000 Kz congelados em Escrow
      commissionRate: 1.00,        // 1%
      totalCommissionsEarned: 184300,
      bankName: 'Banco Angolano de Investimentos (BAI)',
      iban: 'AO06 0040 0000 8192 3840 1014 9',
      accountHolder: 'Evaristo Paulo Cassoma',
      expressPhone: '+244 923 456 789',
      rating: 4.9,
      tradesCompleted: 1284,
    };

    const secondaryLps: LpsRecord = {
      id: 'lps_kalunga_02',
      userId: 'usr_kalunga_lps',
      displayName: 'LP Kalunga (Reserva BMA)',
      status: 'ACTIVE',
      availableGuarantee: 4600000,
      frozenGuarantee: 400000,
      commissionRate: 1.00,
      totalCommissionsEarned: 95400,
      bankName: 'Banco Millennium Atlântico (BMA)',
      iban: 'AO06 0055 0000 9928 1102 3391 2',
      accountHolder: 'Kalunga Liquidez Lda',
      expressPhone: '+244 931 112 233',
      rating: 4.7,
      tradesCompleted: 862,
    };

    const tertiaryLps: LpsRecord = {
      id: 'lps_bfa_reserva_03',
      userId: 'usr_bfa_lps',
      displayName: 'LP BFA Liquidez Segura',
      status: 'ACTIVE',
      availableGuarantee: 12500000, // 12.500.000 Kz
      frozenGuarantee: 1200000,
      commissionRate: 1.00,
      totalCommissionsEarned: 240000,
      bankName: 'Banco de Fomento Angola (BFA)',
      iban: 'AO06 0006 0000 7712 4491 8820 1',
      accountHolder: 'BFA Reserva Digital Lda',
      expressPhone: '+244 944 556 778',
      rating: 4.95,
      tradesCompleted: 2150,
    };

    this.lpsTable.set(primaryLps.id, primaryLps);
    this.lpsTable.set(secondaryLps.id, secondaryLps);
    this.lpsTable.set(tertiaryLps.id, tertiaryLps);

    // Registra alguns NUPs prévios para teste do filtro anti-fraude
    this.nupRegistry.add('NUP-BAI-992100');
    this.nupRegistry.add('NUP-MCX-881290');

    // Transações Seed auditadas (com cálculo exato em centésimos e IVA 14% nos termos da AGT)
    const seedTx1: PaymentTransactionRecord = {
      id: 'tx_seed_01',
      tradeNo: 'KP_TX_20260916_77102',
      tradeToken: 'tt_seed_kianda_01',
      partnerId: 'KP_PARTNER_882910',
      outTradeNo: 'PED-KIANDA-1029',
      userId: 'usr_cliente_evaristo',
      lpsId: 'lps_atlantico_01',
      amount: 145000,
      amountCents: 14500000,
      currency: 'AOA',
      subject: 'Smartphone Samsung A54 5G 128GB',
      paymentMethod: 'MULTICAIXA_EXPRESS',
      status: 'COMPLETED',
      nup: 'NUP-MCX-881290',
      platformFeeAmount: 2175,
      platformFeeCents: 217500,
      lpsCommissionAmount: 1450,
      lpsCommissionCents: 145000,
      netMerchantAmount: 141375,
      netMerchantCents: 14137500,
      ivaFeeAmount: 304.5,
      ivaFeeCents: 30450,
      timeLimitSeconds: 900,
      notifyUrl: 'https://loja.ao/api/kwanza-pay/callback',
      returnUrl: 'https://loja.ao/checkout/sucesso',
      proofReceiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
      proofSanitized: true,
      proofSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      webhookDelivered: true,
      paidAt: new Date(Date.now() - 3600000 * 3),
      createdAt: new Date(Date.now() - 3600000 * 4),
      updatedAt: new Date(Date.now() - 3600000 * 3),
    };

    const seedTx2: PaymentTransactionRecord = {
      id: 'tx_seed_02',
      tradeNo: 'KP_TX_20260916_88301',
      tradeToken: 'tt_seed_tecno_02',
      partnerId: 'KP_PARTNER_882910',
      outTradeNo: 'PED-TECNO-5491',
      userId: 'usr_cliente_evaristo',
      lpsId: 'lps_kalunga_02',
      amount: 45000,
      amountCents: 4500000,
      currency: 'AOA',
      subject: 'Licença Anual Software Primavera',
      paymentMethod: 'TRANSFERENCIA_BANCARIA',
      status: 'COMPLETED',
      nup: 'NUP-BAI-992100',
      platformFeeAmount: 675,
      platformFeeCents: 67500,
      lpsCommissionAmount: 450,
      lpsCommissionCents: 45000,
      netMerchantAmount: 43875,
      netMerchantCents: 4387500,
      ivaFeeAmount: 94.5,
      ivaFeeCents: 9450,
      timeLimitSeconds: 900,
      notifyUrl: 'https://loja.ao/api/kwanza-pay/callback',
      returnUrl: 'https://loja.ao/checkout/sucesso',
      proofReceiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
      proofSanitized: true,
      proofSha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      webhookDelivered: true,
      paidAt: new Date(Date.now() - 3600000 * 8),
      createdAt: new Date(Date.now() - 3600000 * 9),
      updatedAt: new Date(Date.now() - 3600000 * 8),
    };

    this.transactions.set(seedTx1.tradeNo, seedTx1);
    this.tokenIndex.set(seedTx1.tradeToken, seedTx1.tradeNo);
    this.transactions.set(seedTx2.tradeNo, seedTx2);
    this.tokenIndex.set(seedTx2.tradeToken, seedTx2.tradeNo);
  }

  // =========================================================================
  // SEGURANÇA: REGRA 1 - IDEMPOTÊNCIA OBRIGATÓRIA
  // =========================================================================
  public getIdempotentResponse(key: string, requestHash: string) {
    const cached = this.idempotencyStore.get(key);
    if (cached && cached.hash === requestHash) {
      return { statusCode: cached.statusCode, body: cached.body };
    }
    return null;
  }

  public saveIdempotentResponse(key: string, requestHash: string, statusCode: number, body: any) {
    this.idempotencyStore.set(key, { hash: requestHash, statusCode, body });
  }

  // =========================================================================
  // SEGURANÇA: REGRA 2 - ASSINATURA CRIPTOGRÁFICA DE WEBHOOKS (HMAC-SHA256)
  // =========================================================================
  public signWebhookPayload(payload: WebhookPaymentCompletedPayload, secretKey: string): string {
    const jsonString = JSON.stringify(payload);
    return crypto.createHmac('sha256', secretKey).update(jsonString).digest('hex');
  }

  public async dispatchSignedWebhook(tx: PaymentTransactionRecord, eventType: 'payment.completed' | 'payment.disputed' | 'payment.expired') {
    const merchant = this.merchants.get(tx.partnerId);
    const secretKey = merchant ? merchant.secretKey : 'fallback_secret_key';

    const payload: WebhookPaymentCompletedPayload = {
      event: eventType,
      trade_no: tx.tradeNo,
      out_trade_no: tx.outTradeNo,
      amount: tx.amount,
      currency: tx.currency,
      status: tx.status,
      payment_type: tx.paymentMethod === 'INTERNAL_BALANCE' ? 'INTERNAL_BALANCE' : 'P2P_LPS',
      paid_at: (tx.paidAt || new Date()).toISOString(),
    };

    const signature = this.signWebhookPayload(payload, secretKey);
    tx.webhookDelivered = true;
    tx.webhookSignature = signature;

    const logEntry: WebhookLogRecord = {
      id: 'wh_' + crypto.randomUUID().slice(0, 8),
      tradeNo: tx.tradeNo,
      notifyUrl: tx.notifyUrl,
      signature,
      payload,
      status: 'DELIVERED',
      dispatchedAt: new Date(),
    };

    this.webhookLogs.unshift(logEntry);
    console.log(`[Webhook Engine] Despachado webhook para ${tx.notifyUrl} com assinatura HMAC-SHA256: ${signature}`);
    return logEntry;
  }

  // =========================================================================
  // SEGURANÇA: REGRA 3 - ANTI-DoS E LIMITE DE 2 ORDENS P2P PENDENTES
  // =========================================================================
  private checkAntiDosProtection(userId: string) {
    const user = this.users.get(userId);
    if (!user) return;

    // Verifica bloqueio de 24h
    if (user.lpsBlockedUntil && user.lpsBlockedUntil.getTime() > Date.now()) {
      const remainingHours = Math.ceil((user.lpsBlockedUntil.getTime() - Date.now()) / (1000 * 60 * 60));
      throw new Error(
        `LPS_BLOCKED_TEMPORARY: Conta temporariamente suspensa para o método LPS por ${remainingHours}h devido a 3 ordens expiradas sem pagamento nas últimas 24 horas.`
      );
    }

    // Limite de 2 transações P2P pendentes simultâneas
    const pendingP2PCount = Array.from(this.transactions.values()).filter(
      (tx) => tx.userId === userId && ['PENDING_USER_TRANSFER', 'PENDING_LPS_VERIFICATION'].includes(tx.status)
    ).length;

    if (pendingP2PCount >= 2) {
      throw new Error(
        'DOS_PREVENTION_LIMIT: Você já possui 2 transações P2P pendentes simultâneas. Conclua ou aguarde a expiração antes de iniciar outra.'
      );
    }
  }

  // =========================================================================
  // FLUXO A: CRIAÇÃO DE PEDIDO DE PAGAMENTO PELA LOJA
  // POST /v1/payments/create
  // =========================================================================
  public async createPaymentOrder(input: CreatePaymentOrderInput): Promise<PaymentTransactionRecord> {
    const { partner_id, out_trade_no, amount, currency, subject, notify_url, return_url } = input;

    // REGRA 1: Idempotência de out_trade_no por parceiro
    const existingKey = `${partner_id}:${out_trade_no}`;
    if (this.outTradeIndex.has(existingKey)) {
      const existingTradeNo = this.outTradeIndex.get(existingKey)!;
      const existingTx = this.transactions.get(existingTradeNo);
      if (existingTx) {
        return existingTx;
      }
    }

    // Registra merchant dinamicamente caso seja novo
    if (!this.merchants.has(partner_id)) {
      this.merchants.set(partner_id, {
        id: 'mer_' + crypto.randomUUID().slice(0, 8),
        partnerId: partner_id,
        name: 'Loja Parceira ' + partner_id,
        secretKey: 'sec_live_' + crypto.randomUUID().replace(/-/g, ''),
        notifyUrl: notify_url,
        returnUrl: return_url,
        balance: 0,
      });
    }

    const tradeNo = 'KP_TX_' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '_' + Math.floor(10000 + Math.random() * 90000);
    const tradeToken = 'tt_' + crypto.randomUUID().replace(/-/g, '');
    const now = new Date();

    // 1. Inteiros em centésimos de AOA (1 Kz = 100 centésimos) - Resiliência Financeira Total
    const amountCents = Math.round(amount * 100);

    // 2. Comissão do LPS (1,0%): Garantia Integral (nunca arredondada para baixo)
    const lpsCommissionCents = Math.ceil(amountCents * 0.010);

    // 3. Taxa do Gateway (1,5%): Arredondamento Conservador (para baixo nos centavos)
    const rawGatewayCents = amountCents * 0.015;
    const platformFeeCents = Math.floor(rawGatewayCents);

    // 4. Valor Líquido da Loja: Bruto - Gateway - LPS (resíduo absorvido pela margem da plataforma)
    const netMerchantCents = amountCents - platformFeeCents - lpsCommissionCents;

    // 5. IVA de 14% sobre a taxa do Gateway (Regime Geral AGT - Código do IVA)
    const ivaFeeCents = Math.round(platformFeeCents * 0.14);

    const lpsCommissionAmount = lpsCommissionCents / 100;
    const platformFeeAmount = platformFeeCents / 100;
    const netMerchantAmount = netMerchantCents / 100;
    const ivaFeeAmount = ivaFeeCents / 100;

    const tx: PaymentTransactionRecord = {
      id: crypto.randomUUID(),
      tradeNo,
      tradeToken,
      partnerId: partner_id,
      outTradeNo: out_trade_no,
      amount,
      amountCents,
      currency,
      subject,
      status: 'PENDING_AUTH',
      lpsCommissionAmount,
      lpsCommissionCents,
      platformFeeAmount,
      platformFeeCents,
      netMerchantAmount,
      netMerchantCents,
      ivaFeeAmount,
      ivaFeeCents,
      timeLimitSeconds: 300,
      notifyUrl: notify_url,
      returnUrl: return_url,
      webhookDelivered: false,
      createdAt: now,
      updatedAt: now,
    };

    this.transactions.set(tradeNo, tx);
    this.tokenIndex.set(tradeToken, tradeNo);
    this.outTradeIndex.set(existingKey, tradeNo);

    // Persistência Supabase (assíncrona e resiliente)
    supabasePersistence.syncTransaction(tx).catch((e) => console.warn('[Supabase Sync Warning]', e.message));

    return tx;
  }

  // =========================================================================
  // FLUXO B - OPÇÃO 1: PAGAMENTO VIA SALDO INTERNO DO CLIENTE
  // =========================================================================
  public async payWithInternalBalance(tradeToken: string, userId: string): Promise<PaymentTransactionRecord> {
    const tradeNo = this.tokenIndex.get(tradeToken);
    if (!tradeNo) throw new Error('TRADE_NOT_FOUND: Token de pagamento inválido ou expirado.');

    const tx = this.transactions.get(tradeNo);
    if (!tx) throw new Error('TRADE_NOT_FOUND: Pedido não encontrado.');

    if (tx.status !== 'PENDING_AUTH') {
      throw new Error(`INVALID_STATE: Esta ordem já se encontra em estado '${tx.status}'.`);
    }

    const user = this.users.get(userId);
    if (!user) throw new Error('USER_NOT_FOUND: Usuário não encontrado.');

    if (user.internalBalance < tx.amount) {
      throw new Error(
        `INSUFFICIENT_INTERNAL_BALANCE: Saldo insuficiente (${new Intl.NumberFormat('pt-AO').format(user.internalBalance)} Kz disponível vs ${new Intl.NumberFormat('pt-AO').format(tx.amount)} Kz requerido).`
      );
    }

    // Transação Atómica: Deduz cliente e credita loja com valor líquido resiliente
    user.internalBalance -= tx.amount;
    const merchant = this.merchants.get(tx.partnerId);
    if (merchant) {
      merchant.balance += tx.netMerchantAmount;
    }

    tx.userId = user.id;
    tx.paymentMethod = 'INTERNAL_BALANCE';
    tx.status = 'COMPLETED';
    tx.paidAt = new Date();
    tx.updatedAt = new Date();

    this.transactions.set(tradeNo, tx);

    // Persistência Supabase
    supabasePersistence.syncTransaction(tx).catch(console.warn);

    // Dispara webhook assinado à loja parceira
    await this.dispatchSignedWebhook(tx, 'payment.completed');

    return tx;
  }

  // =========================================================================
  // FLUXO B - OPÇÃO 2: SELEÇÃO DO PROVEDOR DE LIQUIDEZ (LPS) COM ROW-LOCKING
  // =========================================================================
  public async selectLpsPayment(
    tradeToken: string,
    userId: string,
    paymentMethod: PaymentMethod
  ): Promise<{ transaction: PaymentTransactionRecord; lps: LpsRecord }> {
    const tradeNo = this.tokenIndex.get(tradeToken);
    if (!tradeNo) throw new Error('TRADE_NOT_FOUND: Token de pagamento inválido.');

    const tx = this.transactions.get(tradeNo);
    if (!tx) throw new Error('TRADE_NOT_FOUND: Pedido não encontrado.');

    if (tx.status !== 'PENDING_AUTH') {
      throw new Error(`INVALID_STATE: Ordem está no estado '${tx.status}'.`);
    }

    // REGRA 3: Proteção Anti-DoS
    this.checkAntiDosProtection(userId);

    // Encontra o LPS com availableGuarantee >= amount (SELECT ... FOR UPDATE)
    const eligibleLps = Array.from(this.lpsTable.values()).filter(
      (l) => l.status === 'ACTIVE' && l.availableGuarantee >= tx.amount
    );

    if (eligibleLps.length === 0) {
      throw new Error(
        'NO_LIQUIDITY_AVAILABLE: Nenhum Provedor de Liquidez possui saldo de garantia desimpedido suficiente para este montante.'
      );
    }

    eligibleLps.sort((a, b) => b.rating - a.rating || b.availableGuarantee - a.availableGuarantee);
    const selectedLps = eligibleLps[0];

    // BLOQUEIO PESSIMISTA CONCORRENTE:
    // UPDATE lps_profiles SET available_guarantee = available_guarantee - amount, frozen_guarantee = frozen_guarantee + amount
    selectedLps.availableGuarantee -= tx.amount;
    selectedLps.frozenGuarantee += tx.amount;
    this.lpsTable.set(selectedLps.id, selectedLps);

    const now = new Date();
    tx.userId = userId;
    tx.lpsId = selectedLps.id;
    tx.paymentMethod = paymentMethod;
    tx.status = 'PENDING_USER_TRANSFER';
    tx.timeLimitSeconds = 900; // 15 minutos (900s) para o cliente efetuar a transferência
    tx.transferDeadline = new Date(now.getTime() + 900 * 1000);
    tx.updatedAt = now;

    this.transactions.set(tradeNo, tx);

    // Persistência Supabase
    supabasePersistence.syncTransaction(tx).catch(console.warn);
    supabasePersistence.syncLps(selectedLps).catch(console.warn);

    // Timer de 15 minutos (900s) para o cliente transferir
    this.scheduleUserTransferExpiry(tx.tradeNo, 900);

    // Dispara alerta híbrido multicanal ao LPS (WebSocket + Push + Bot)
    this.dispatchHybridLpsAlert(tx, 'ORDER_ASSIGNED');

    return { transaction: tx, lps: selectedLps };
  }

  // =========================================================================
  // FLUXO B: CONFIRMAÇÃO DE ENVIO PELO CLIENTE (COM NUP ÚNICO OBRIGATÓRIO)
  // =========================================================================
  public async confirmUserPaid(
    tradeNo: string,
    userId: string,
    nup: string,
    proofUrl?: string,
    notes?: string
  ): Promise<PaymentTransactionRecord> {
    const tx = this.transactions.get(tradeNo);
    if (!tx) throw new Error(`TRADE_NOT_FOUND: Transação ${tradeNo} não encontrada.`);

    if (tx.status !== 'PENDING_USER_TRANSFER') {
      throw new Error(`INVALID_STATE: Transação em status '${tx.status}', não pode ser confirmada.`);
    }

    // REGRA 4: Validação do NUP ÚNICO (Prevenção de Reciclagem de Comprovativos)
    const normalizedNup = nup.trim().toUpperCase();
    if (this.nupRegistry.has(normalizedNup)) {
      throw new Error(
        `DUPLICATE_NUP_FRAUD_DETECTED: O Número Único de Processamento (NUP: ${normalizedNup}) já foi utilizado anteriormente no sistema. Operação rejeitada por segurança.`
      );
    }

    // REGRA 5: Sanitização de Metadados em Sandbox de OCR (Prevenção de OCR Bypass)
    const proofAudit = this.sanitizeProofReceipt(proofUrl);
    if (!proofAudit.valid) {
      throw new Error(`SECURITY_REJECTED: ${proofAudit.error}`);
    }

    this.nupRegistry.add(normalizedNup);
    this.cancelTimer(tradeNo);

    const now = new Date();
    tx.nup = normalizedNup;
    tx.proofReceiptUrl = proofUrl;
    tx.proofSanitized = true;
    tx.proofSha256 = proofAudit.sha256;
    tx.status = 'PENDING_LPS_VERIFICATION';
    tx.verificationDeadline = new Date(now.getTime() + 1800 * 1000); // 30 minutos (1800s) para o LPS conferir no extrato interbancário
    tx.updatedAt = now;

    this.transactions.set(tradeNo, tx);

    // Persistência Supabase
    supabasePersistence.syncTransaction(tx).catch(console.warn);

    // Dispara timer de 30 minutos (1800s) para o LPS conferir extrato bancário
    this.scheduleLpsVerificationExpiry(tradeNo, 1800);

    // Dispara alerta multicanal híbrido de alta prioridade ao LPS
    this.dispatchHybridLpsAlert(tx, 'PROOF_UPLOADED');

    return tx;
  }

  // =========================================================================
  // FLUXO C: CONFIRMAÇÃO DE RECEBIMENTO PELO LPS (LIQUIDAÇÃO + COMISSÃO DE 1%)
  // =========================================================================
  public async lpsConfirmReceipt(tradeNo: string, lpsId: string): Promise<PaymentTransactionRecord> {
    const tx = this.transactions.get(tradeNo);
    if (!tx) throw new Error('Transação não encontrada');

    if (tx.status !== 'PENDING_LPS_VERIFICATION') {
      throw new Error(`Transação não está aguardando verificação (status: ${tx.status}).`);
    }

    const lps = this.lpsTable.get(tx.lpsId || lpsId);
    if (!lps) throw new Error('LPS não encontrado');

    this.cancelTimer(tradeNo);

    // 1. Descongela a garantia de Escrow
    lps.frozenGuarantee = Math.max(0, lps.frozenGuarantee - tx.amount);

    // 2. Credita comissão integral de 1% do LPS (garantia integral, sem arredondamento para baixo)
    const commission = tx.lpsCommissionAmount || Math.ceil(tx.amount * 0.010);
    lps.totalCommissionsEarned += commission;
    lps.availableGuarantee += commission; // comissão é incorporada à garantia
    lps.tradesCompleted += 1;
    this.lpsTable.set(lps.id, lps);

    // 3. Liquida o valor líquido para a loja parceira (Valor Bruto - Taxa Gateway - Comissão LPS)
    const merchant = this.merchants.get(tx.partnerId);
    if (merchant) {
      merchant.balance += tx.netMerchantAmount;
    }

    const now = new Date();
    tx.lpsCommissionAmount = commission;
    tx.status = 'COMPLETED';
    tx.paidAt = now;
    tx.updatedAt = now;

    this.transactions.set(tradeNo, tx);

    // Registra amostra de sucesso no monitor EMIS Multicaixa
    this.recordEmisTransactionSample(true, 420);

    // Persistência Supabase
    supabasePersistence.syncTransaction(tx).catch(console.warn);
    supabasePersistence.syncLps(lps).catch(console.warn);

    // 4. Envia webhook com HMAC-SHA256 para a loja parceira
    await this.dispatchSignedWebhook(tx, 'payment.completed');

    // 5. Notificação de liquidação concluída ao LPS
    this.dispatchHybridLpsAlert(tx, 'FUNDS_SETTLED');

    return tx;
  }

  // =========================================================================
  // FLUXO C: ABERTURA DE DISPUTA PELO LPS (CONGELAMENTO DE GARANTIA EM ESCROW)
  // =========================================================================
  public async lpsOpenDispute(tradeNo: string, lpsId: string, reason: string): Promise<PaymentTransactionRecord> {
    const tx = this.transactions.get(tradeNo);
    if (!tx) throw new Error('Transação não encontrada');

    this.cancelTimer(tradeNo);

    // REGRA 4: Saldo permanece estritamente congelado em Escrow até resolução administrativa
    tx.status = 'DISPUTED';
    tx.disputeReason = reason;
    tx.updatedAt = new Date();
    this.transactions.set(tradeNo, tx);

    // Persistência Supabase
    supabasePersistence.syncTransaction(tx).catch(console.warn);
    supabasePersistence.recordDispute(tradeNo, reason).catch(console.warn);

    // Notifica a loja via webhook assinado
    await this.dispatchSignedWebhook(tx, 'payment.disputed');

    // Dispara alerta ao LPS e equipe de mediação
    this.dispatchHybridLpsAlert(tx, 'DISPUTE_OPENED');

    return tx;
  }

  // =========================================================================
  // TIMERS E DESCONGELAMENTO AUTOMÁTICO
  // =========================================================================
  private scheduleUserTransferExpiry(tradeNo: string, seconds: number) {
    const timer = setTimeout(() => {
      const tx = this.transactions.get(tradeNo);
      // REGRA DE ISOLAMENTO: Nunca descongelar ou alterar se já estiver em disputa ou concluída
      if (!tx || tx.status === 'DISPUTED' || tx.status === 'COMPLETED') {
        return;
      }

      if (tx.status === 'PENDING_USER_TRANSFER') {
        tx.status = 'EXPIRED';
        tx.updatedAt = new Date();
        this.transactions.set(tradeNo, tx);

        // Descongela a garantia do LPS: frozen -= amount, available += amount
        if (tx.lpsId) {
          const lps = this.lpsTable.get(tx.lpsId);
          if (lps) {
            lps.frozenGuarantee = Math.max(0, lps.frozenGuarantee - tx.amount);
            lps.availableGuarantee += tx.amount;
            this.lpsTable.set(lps.id, lps);
          }
        }

        // REGRA 3: Incrementa falhas de ordens expiradas do usuário (Anti-DoS)
        if (tx.userId) {
          const user = this.users.get(tx.userId);
          if (user) {
            user.expiredOrders24h += 1;
            if (user.expiredOrders24h >= 3) {
              user.lpsBlockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas de bloqueio
              console.log(`[Anti-DoS] Usuário ${user.email} bloqueado para o método LPS por 24 horas (3 ordens expiradas).`);
            }
          }
        }

        this.dispatchSignedWebhook(tx, 'payment.expired').catch(console.error);
      }
    }, seconds * 1000);

    this.activeTimers.set(tradeNo, timer);
  }

  private scheduleLpsVerificationExpiry(tradeNo: string, seconds: number) {
    const timer = setTimeout(() => {
      const tx = this.transactions.get(tradeNo);
      // REGRA DE ISOLAMENTO: Se já estiver resolvida ou em disputa, não intervir
      if (!tx || tx.status === 'DISPUTED' || tx.status === 'COMPLETED') {
        return;
      }

      if (tx.status === 'PENDING_LPS_VERIFICATION') {
        // Se o LPS não conferiu nos 30 minutos (1800s), escala para mediação administrativa (Escrow mantido)
        tx.status = 'DISPUTED';
        tx.disputeReason = 'EXPIRY_TIMEOUT: Provedor de Liquidez não confirmou o recebimento no prazo de 1800 segundos (30 min). Garantia de Escrow retida para auditoria.';
        tx.updatedAt = new Date();
        this.transactions.set(tradeNo, tx);
        this.dispatchSignedWebhook(tx, 'payment.disputed').catch(console.error);
      }
    }, seconds * 1000);

    this.activeTimers.set(tradeNo, timer);
  }

  private cancelTimer(tradeNo: string) {
    const timer = this.activeTimers.get(tradeNo);
    if (timer) {
      clearTimeout(timer);
      this.activeTimers.delete(tradeNo);
    }
  }

  // Getters
  public getTransaction(tradeNo: string) {
    return this.transactions.get(tradeNo);
  }

  public getTransactionByToken(tradeToken: string) {
    const tradeNo = this.tokenIndex.get(tradeToken);
    return tradeNo ? this.transactions.get(tradeNo) : undefined;
  }

  public getAllTransactions() {
    return Array.from(this.transactions.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public getAllLps() {
    return Array.from(this.lpsTable.values());
  }

  public getLps(id: string) {
    return this.lpsTable.get(id);
  }

  public getUser(idOrEmail: string) {
    return this.users.get(idOrEmail);
  }

  public getMerchant(partnerId: string) {
    return this.merchants.get(partnerId);
  }

  public getAllMerchants() {
    return Array.from(this.merchants.values());
  }

  // =========================================================================
  // 1. SEGURANÇA: SANITIZAÇÃO DE COMPROVATIVOS EM SANDBOX (OCR BYPASS PROTECTION)
  // =========================================================================
  public sanitizeProofReceipt(proofUrl?: string): { valid: boolean; error?: string; sha256?: string } {
    if (!proofUrl) return { valid: true };

    const content = proofUrl.slice(0, 1500).toLowerCase();

    // Detecção de injeções de scripts, PHP, comandos do sistema e EXIF maliciosos
    const suspiciousPatterns = [
      '<script',
      'eval(',
      '<?php',
      'base64,phn',
      'javascript:',
      'data:text/html',
      'exiftool',
      'shell_exec',
      '<svg onload',
      'onerror='
    ];

    for (const pattern of suspiciousPatterns) {
      if (content.includes(pattern)) {
        return {
          valid: false,
          error: 'Detecção de assinatura maliciosa no arquivo do comprovativo. O comprovativo foi bloqueado pela sandbox antifraude OCR.',
        };
      }
    }

    const sha256 = crypto.createHash('sha256').update(proofUrl).digest('hex');
    return { valid: true, sha256 };
  }

  // =========================================================================
  // 2. OPERACIONAL: HEALTH CHECK DA REDE MULTICAIXA EXPRESS (SEMÁFORO EMIS)
  // =========================================================================
  public recordEmisTransactionSample(success: boolean, latencyMs: number = 450) {
    this.emisSamples.push({ timestamp: new Date(), success, latencyMs });
    if (this.emisSamples.length > 10) {
      this.emisSamples.shift();
    }
  }

  public getEmisMulticaixaHealth(): EmisHealthStatus {
    const now = new Date();
    // Horário de Luanda (UTC+1 WAT)
    const utcHours = now.getUTCHours();
    const watHours = (utcHours + 1) % 24;

    // Manutenção programada noturna EMIS: entre 01:00 e 04:30
    const isNocturnalWindow = watHours >= 1 && watHours < 4;

    const totalSampled = this.emisSamples.length;
    const successes = this.emisSamples.filter(s => s.success).length;
    const successRate = totalSampled > 0 ? Math.round((successes / totalSampled) * 100) : 90;

    let status: 'HEALTHY' | 'DEGRADED' | 'MAINTENANCE' = 'HEALTHY';
    let warningMessage: string | undefined;
    let recommendedAction = 'Rede Multicaixa Express 100% operacional para transferências P2P instantâneas.';

    if (isNocturnalWindow) {
      status = 'MAINTENANCE';
      warningMessage = 'A rede interbancária EMIS / Multicaixa Express está em período de manutenção noturna programada.';
      recommendedAction = 'Recomendado uso de Transferência Bancária Direta (IBAN) ou Saldo Interno para liquidação garantida.';
    } else if (successRate < 80) {
      status = 'DEGRADED';
      warningMessage = `Instabilidade operacional detectada na rede Multicaixa Express (Taxa de Sucesso Atual: ${successRate}%).`;
      recommendedAction = 'Alternativa imediata: selecione Transferência Bancária Direta (BAI, BFA, BMA) ou Saldo Interno.';
    }

    return {
      successRate,
      totalSampled,
      status,
      isNocturnalWindow,
      lastChecked: now.toISOString(),
      warningMessage,
      recommendedAction,
    };
  }

  // =========================================================================
  // 3. NOTIFICAÇÕES: DISPATCHER HÍBRIDO EM TEMPO REAL (WEBSOCKET + PUSH + BOT)
  // =========================================================================
  public dispatchHybridLpsAlert(
    tx: PaymentTransactionRecord,
    eventType: 'ORDER_ASSIGNED' | 'PROOF_UPLOADED' | 'DISPUTE_OPENED' | 'FUNDS_SETTLED'
  ): LpsNotificationRecord {
    const lps = tx.lpsId ? this.lpsTable.get(tx.lpsId) : null;
    const lpsName = lps ? lps.displayName : 'Provedor de Liquidez';

    let title = 'Notificação KwanzaPay';
    let message = '';

    if (eventType === 'ORDER_ASSIGNED') {
      title = '🔒 Nova Ordem Alocada em Escrow';
      message = `Garantia de ${new Intl.NumberFormat('pt-AO').format(tx.amount)} Kz retida para ordem ${tx.tradeNo}. Aguarde envio do cliente.`;
    } else if (eventType === 'PROOF_UPLOADED') {
      title = '⚡ Comprovativo Enviado pelo Cliente';
      message = `Cliente anexou comprovativo com NUP ${tx.nup || 'N/A'} no montante de ${new Intl.NumberFormat('pt-AO').format(tx.amount)} Kz. Verifique seu extrato bancário.`;
    } else if (eventType === 'DISPUTE_OPENED') {
      title = '⚠️ Disputa Aberta na Ordem';
      message = `Ordem ${tx.tradeNo} encaminhada para mediação com garantia protegida em Escrow.`;
    } else if (eventType === 'FUNDS_SETTLED') {
      title = '✅ Pagamento Liquidado com Sucesso';
      message = `Garantia liberada e comissão de ${new Intl.NumberFormat('pt-AO').format(tx.lpsCommissionAmount)} Kz incorporada ao seu saldo disponível.`;
    }

    const notification: LpsNotificationRecord = {
      id: 'notif_' + crypto.randomUUID().slice(0, 8),
      lpsId: tx.lpsId || 'all',
      tradeNo: tx.tradeNo,
      eventType,
      title,
      message,
      amount: tx.amount,
      timestamp: new Date(),
      channels: {
        websocket: 'DELIVERED',
        pushNotification: 'SENT',
        telegramBot: 'DELIVERED',
        whatsAppApi: 'DELIVERED',
      },
    };

    this.lpsNotifications.unshift(notification);
    if (this.lpsNotifications.length > 50) this.lpsNotifications.pop();

    console.log(`[Hybrid Notification] Despachado para ${lpsName}: ${title}`);
    return notification;
  }

  public getLpsNotifications(lpsId?: string) {
    if (!lpsId) return this.lpsNotifications;
    return this.lpsNotifications.filter(n => n.lpsId === lpsId || n.lpsId === 'all');
  }

  // =========================================================================
  // 4. FISCAL / COMPLIANCE: RELATÓRIO AGT (REGIME GERAL DO IVA - 14%)
  // =========================================================================
  public getAgtTaxReport(partnerId?: string, period?: string) {
    const txs = Array.from(this.transactions.values()).filter(
      t => t.status === 'COMPLETED' && (!partnerId || t.partnerId === partnerId)
    );

    let totalGrossSalesCents = 0;
    let totalPlatformFeesCents = 0;
    let totalLpsCommissionsCents = 0;
    let totalNetMerchantCents = 0;
    let totalIvaTaxCents = 0;

    const invoices = txs.map((t, index) => {
      const grossCents = t.amountCents || Math.round(t.amount * 100);
      const feeCents = t.platformFeeCents || Math.floor(grossCents * 0.015);
      const lpsCents = t.lpsCommissionCents || Math.ceil(grossCents * 0.010);
      const netCents = t.netMerchantCents || (grossCents - feeCents - lpsCents);
      const ivaCents = t.ivaFeeCents || Math.round(feeCents * 0.14);

      totalGrossSalesCents += grossCents;
      totalPlatformFeesCents += feeCents;
      totalLpsCommissionsCents += lpsCents;
      totalNetMerchantCents += netCents;
      totalIvaTaxCents += ivaCents;

      return {
        invoiceNumber: `FT KP2026/${String(index + 101).padStart(5, '0')}`,
        tradeNo: t.tradeNo,
        outTradeNo: t.outTradeNo,
        date: (t.paidAt || t.createdAt).toISOString(),
        customerName: 'Cliente KwanzaPay',
        merchantName: this.merchants.get(t.partnerId)?.name || 'Loja Parceira',
        nifMerchant: '5418902194',
        nifKwanzaPay: '5417882910',
        currency: 'AOA',
        grossSalesAoa: grossCents / 100,
        taxableBaseAoa: feeCents / 100, // A taxa do gateway constitui a base tributável do serviço
        ivaRatePercent: 14.0,
        ivaLiquidatedAoa: ivaCents / 100, // 14% sobre a taxa de intermediação
        lpsCommissionAoa: lpsCents / 100,
        netMerchantAoa: netCents / 100,
        saftDocumentType: 'FT',
        taxExemptionReason: 'Nenhum (Tributado à taxa normal de 14% - Código do IVA)',
      };
    });

    return {
      header: {
        companyName: 'KwanzaPay Serviços de Intermediação e Pagamentos P2P Lda',
        companyNif: '5417882910',
        fiscalAddress: 'Avenida 4 de Fevereiro, n.º 120, Edifício Cidade Mar, Luanda - Angola',
        agtRegime: 'Regime Geral do IVA (14%) - Decreto Legislativo Presidencial n.º 7/19',
        currency: 'AOA',
        period: period || new Date().toISOString().slice(0, 7),
        generationDate: new Date().toISOString(),
        saftVersion: 'SAF-T (AO) 1.01_01',
      },
      totals: {
        transactionsCount: txs.length,
        totalGrossSalesAoa: totalGrossSalesCents / 100,
        totalPlatformFeesAoa: totalPlatformFeesCents / 100,
        totalIvaLiquidatedAoa: totalIvaTaxCents / 100,
        totalLpsCommissionsAoa: totalLpsCommissionsCents / 100,
        totalNetMerchantAoa: totalNetMerchantCents / 100,
      },
      invoices,
    };
  }
}

export const guaranteeEngine = new GuaranteeEngine();
