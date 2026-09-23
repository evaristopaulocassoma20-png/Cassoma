import { Request, Response } from 'express';
import crypto from 'crypto';
import { 
  CreatePaymentOrderSchema, 
  PayInternalBalanceSchema, 
  SelectLpsPaymentSchema, 
  ConfirmUserPaidSchema, 
  LpsConfirmReceiptSchema,
  LpsOpenDisputeSchema,
  LpsGuaranteeDepositSchema,
  CheckoutRequestSchema,
  ConfirmUserPaidParamsSchema,
  ConfirmUserPaidBodySchema,
} from '../schemas/paymentSchemas';
import { guaranteeEngine } from '../services/guaranteeService';
import { supabasePersistence } from '../services/supabaseService';

/**
 * 1. FLUXO DA LOJA: CRIAR PEDIDO DE PAGAMENTO
 * POST /v1/payments/create (ou /api/v1/payments/create)
 * Suporta Idempotência Obrigatória (Idempotency-Key ou out_trade_no)
 */
export async function createPaymentOrderController(req: Request, res: Response): Promise<void> {
  const idempotencyKey = (req.headers['idempotency-key'] as string) || (req.headers['x-idempotency-key'] as string) || req.body?.out_trade_no;
  const requestHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');

  // REGRA 1: Verificação de Idempotência (Idempotency-Key)
  // Se a mesma chave for enviada com o mesmo payload, retorna a mesma resposta sem duplicar cobrança
  if (idempotencyKey) {
    const cached = guaranteeEngine.getIdempotentResponse(idempotencyKey, requestHash);
    if (cached) {
      res.setHeader('X-Cache-Lookup', 'HIT-IDEMPOTENT');
      res.status(cached.statusCode).json(cached.body);
      return;
    }
  }

  const validation = CreatePaymentOrderSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      code: 400,
      error: 'VALIDATION_ERROR',
      details: validation.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const tx = await guaranteeEngine.createPaymentOrder(validation.data);

    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const checkoutUrl = `${protocol}://${host}/#checkout?token=${tx.tradeToken}`;

    const responsePayload = {
      code: 200,
      message: 'success',
      data: {
        trade_no: tx.tradeNo,
        out_trade_no: tx.outTradeNo,
        trade_token: tx.tradeToken,
        checkout_url: checkoutUrl,
        status: tx.status,
        amount: tx.amount,
        currency: tx.currency,
        created_at: tx.createdAt.toISOString(),
      },
    };

    if (idempotencyKey) {
      guaranteeEngine.saveIdempotentResponse(idempotencyKey, requestHash, 201, responsePayload);
    }

    res.status(201).json(responsePayload);
  } catch (error: any) {
    res.status(500).json({
      code: 500,
      error: 'CREATE_PAYMENT_FAILED',
      message: error.message || 'Erro ao gerar pedido de pagamento.',
    });
  }
}

/**
 * Consulta de detalhes do pedido pelo token do checkout
 * GET /api/v1/payments/token/:trade_token
 */
export async function getPaymentByTokenController(req: Request, res: Response): Promise<void> {
  const { trade_token } = req.params;
  const tx = guaranteeEngine.getTransactionByToken(trade_token);

  if (!tx) {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Pedido de pagamento não encontrado para o token fornecido.',
    });
    return;
  }

  const merchant = guaranteeEngine.getMerchant(tx.partnerId);
  const lps = tx.lpsId ? guaranteeEngine.getLps(tx.lpsId) : null;

  res.status(200).json({
    trade_no: tx.tradeNo,
    trade_token: tx.tradeToken,
    partner_id: tx.partnerId,
    merchant_name: merchant ? merchant.name : 'Loja Parceira',
    out_trade_no: tx.outTradeNo,
    amount: tx.amount,
    currency: tx.currency,
    subject: tx.subject,
    status: tx.status,
    payment_method: tx.paymentMethod,
    time_limit_seconds: tx.timeLimitSeconds,
    transfer_deadline: tx.transferDeadline?.toISOString(),
    verification_deadline: tx.verificationDeadline?.toISOString(),
    return_url: tx.returnUrl,
    nup: tx.nup,
    lps: lps ? {
      name: lps.displayName,
      bank_name: lps.bankName,
      iban: lps.iban,
      account_holder: lps.accountHolder,
      express_phone: lps.expressPhone,
      rating: lps.rating,
    } : null,
  });
}

/**
 * FLUXO DO CLIENTE - OPÇÃO 1: PAGAR COM SALDO INTERNO
 * POST /api/v1/payments/checkout/internal-balance
 */
export async function payWithInternalBalanceController(req: Request, res: Response): Promise<void> {
  const validation = PayInternalBalanceSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      details: validation.error.flatten().fieldErrors,
    });
    return;
  }

  const user = req.user!;
  try {
    const tx = await guaranteeEngine.payWithInternalBalance(validation.data.trade_token, user.id);

    res.status(200).json({
      code: 200,
      message: 'Pagamento efetuado com sucesso via Saldo Interno KwanzaPay!',
      data: {
        trade_no: tx.tradeNo,
        out_trade_no: tx.outTradeNo,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        paid_at: tx.paidAt?.toISOString(),
        return_url: tx.returnUrl,
      },
    });
  } catch (error: any) {
    const isInsufficient = error.message?.includes('INSUFFICIENT_INTERNAL_BALANCE');
    res.status(isInsufficient ? 422 : 400).json({
      error: isInsufficient ? 'INSUFFICIENT_FUNDS' : 'PAYMENT_FAILED',
      message: error.message,
    });
  }
}

/**
 * FLUXO DO CLIENTE - OPÇÃO 2: SELECIONAR PROVEDOR DE LIQUIDEZ (LPS)
 * POST /api/v1/payments/checkout/select-lps
 */
export async function selectLpsPaymentController(req: Request, res: Response): Promise<void> {
  const validation = SelectLpsPaymentSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      details: validation.error.flatten().fieldErrors,
    });
    return;
  }

  const user = req.user!;
  try {
    const { transaction, lps } = await guaranteeEngine.selectLpsPayment(
      validation.data.trade_token,
      user.id,
      validation.data.payment_method
    );

    res.status(200).json({
      code: 200,
      message: 'Provedor de Liquidez associado e garantia bloqueada em Escrow.',
      data: {
        trade_no: transaction.tradeNo,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        time_limit_seconds: 300,
        expires_at: transaction.transferDeadline?.toISOString(),
        lps_bank_details: {
          lps_name: lps.displayName,
          bank_name: lps.bankName,
          iban: lps.iban,
          account_holder: lps.accountHolder,
          express_phone: lps.expressPhone || null,
          reference_code: 'MCX-' + transaction.tradeNo.slice(-6),
        },
      },
    });
  } catch (error: any) {
    const isDos = error.message?.includes('DOS_PREVENTION') || error.message?.includes('LPS_BLOCKED');
    const isLiquidity = error.message?.includes('NO_LIQUIDITY_AVAILABLE');
    const statusCode = isDos ? 429 : isLiquidity ? 422 : 400;

    res.status(statusCode).json({
      error: isDos ? 'ANTI_DOS_BLOCKED' : isLiquidity ? 'INSUFFICIENT_LIQUIDITY' : 'ERROR',
      message: error.message,
    });
  }
}

/**
 * FLUXO DO CLIENTE: CONFIRMAÇÃO DE ENVIO COM NUP ÚNICO OBRIGATÓRIO
 * POST /api/v1/payments/checkout/confirm-paid
 */
export async function confirmUserPaidWithNupController(req: Request, res: Response): Promise<void> {
  const validation = ConfirmUserPaidSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      details: validation.error.flatten().fieldErrors,
    });
    return;
  }

  const user = req.user!;
  const { trade_no, nup, proof_receipt_url, notes } = validation.data;

  try {
    const tx = await guaranteeEngine.confirmUserPaid(trade_no, user.id, nup, proof_receipt_url, notes);

    res.status(200).json({
      code: 200,
      message: 'Comprovativo e NUP registados com sucesso. O Provedor de Liquidez tem 5 minutos para validar o crédito bancário.',
      data: {
        trade_no: tx.tradeNo,
        status: tx.status,
        nup: tx.nup,
        time_limit_seconds: 300,
        verification_deadline: tx.verificationDeadline?.toISOString(),
      },
    });
  } catch (error: any) {
    const isNupDuplicate = error.message?.includes('DUPLICATE_NUP');
    res.status(isNupDuplicate ? 409 : 400).json({
      error: isNupDuplicate ? 'DUPLICATE_NUP' : 'CONFIRM_FAILED',
      message: error.message,
    });
  }
}

/**
 * FLUXO DO LPS: CONFIRMAR RECEBIMENTO (LIQUIDAÇÃO + COMISSÃO DE 1%)
 * POST /api/v1/lps/orders/:trade_no/confirm-receipt
 */
export async function lpsConfirmReceiptController(req: Request, res: Response): Promise<void> {
  const { trade_no } = req.params;
  const lpsId = (req.headers['x-lps-id'] as string) || 'lps_atlantico_01';

  try {
    const tx = await guaranteeEngine.lpsConfirmReceipt(trade_no, lpsId);
    const lps = guaranteeEngine.getLps(tx.lpsId || lpsId);

    res.status(200).json({
      code: 200,
      message: 'Recebimento confirmado! Garantia descongelada, valor liquidado à loja e comissão creditada.',
      data: {
        trade_no: tx.tradeNo,
        status: tx.status,
        amount: tx.amount,
        lps_commission_earned: tx.lpsCommissionAmount,
        lps_updated_balances: lps ? {
          available_guarantee: lps.availableGuarantee,
          frozen_guarantee: lps.frozenGuarantee,
          total_commissions_earned: lps.totalCommissionsEarned,
        } : null,
        paid_at: tx.paidAt?.toISOString(),
      },
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'LPS_CONFIRMATION_FAILED',
      message: error.message,
    });
  }
}

/**
 * FLUXO DO LPS: ABRIR DISPUTA (GARANTIA FICA CONGELADA EM ESCROW)
 * POST /api/v1/lps/orders/:trade_no/dispute
 */
export async function lpsOpenDisputeController(req: Request, res: Response): Promise<void> {
  const { trade_no } = req.params;
  const { reason } = req.body;
  const lpsId = (req.headers['x-lps-id'] as string) || 'lps_atlantico_01';

  if (!reason || reason.trim().length < 5) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'O motivo da disputa é obrigatório (mínimo 5 caracteres).',
    });
    return;
  }

  try {
    const tx = await guaranteeEngine.lpsOpenDispute(trade_no, lpsId, reason);

    res.status(200).json({
      code: 200,
      message: 'Disputa registada. O saldo de garantia do LPS permanece congelado em Escrow até decisão do suporte.',
      data: {
        trade_no: tx.tradeNo,
        status: tx.status,
        dispute_reason: tx.disputeReason,
        frozen_in_escrow: true,
      },
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'DISPUTE_FAILED',
      message: error.message,
    });
  }
}

/**
 * Endpoints Legados / Compatibilidade
 */
export async function checkoutController(req: Request, res: Response): Promise<void> {
  const validationResult = CheckoutRequestSchema.safeParse(req.body);
  if (!validationResult.success) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      details: validationResult.error.flatten().fieldErrors,
    });
    return;
  }

  const { order_id, amount, currency, return_url, payment_method } = validationResult.data;
  const user = req.user!;

  try {
    const txOrder = await guaranteeEngine.createPaymentOrder({
      partner_id: 'KP_PARTNER_882910',
      out_trade_no: order_id,
      amount,
      currency,
      subject: 'Pagamento via Checkout P2P KwanzaPay',
      notify_url: 'https://loja.ao/api/kwanza-pay/callback',
      return_url: return_url || 'https://loja.ao/checkout/sucesso',
    });

    const { transaction, lps } = await guaranteeEngine.selectLpsPayment(
      txOrder.tradeToken,
      user.id,
      payment_method
    );

    res.status(201).json({
      transaction_id: transaction.tradeNo,
      order_id: transaction.outTradeNo,
      status: 'PENDING_USER_TRANSFER',
      amount: transaction.amount,
      currency: transaction.currency,
      time_limit_seconds: 300,
      expires_at: transaction.transferDeadline?.toISOString(),
      lps_bank_details: {
        lps_name: lps.displayName,
        bank_name: lps.bankName,
        iban: lps.iban,
        account_holder: lps.accountHolder,
        express_phone: lps.expressPhone || null,
        reference_code: 'MCX-' + transaction.tradeNo.slice(-6),
      },
      instructions: `Por favor realize o pagamento de ${new Intl.NumberFormat('pt-AO').format(amount)} ${currency} para a conta bancária do Provedor de Liquidez nos próximos 5 minutos.`,
    });
  } catch (error: any) {
    res.status(422).json({
      error: 'INSUFFICIENT_LIQUIDITY',
      message: error.message,
    });
  }
}

export async function confirmUserPaidLegacyController(req: Request, res: Response): Promise<void> {
  const { transaction_id } = req.params;
  const { nup, proof_receipt_url, notes } = req.body;
  const user = req.user!;

  try {
    const validNup = nup || 'NUP-' + Math.floor(100000 + Math.random() * 900000);
    const tx = await guaranteeEngine.confirmUserPaid(transaction_id, user.id, validNup, proof_receipt_url, notes);

    res.status(200).json({
      transaction_id: tx.tradeNo,
      status: tx.status,
      nup: tx.nup,
      time_limit_seconds: 300,
      verification_deadline: tx.verificationDeadline?.toISOString(),
      message: 'Comprovativo registado com sucesso.',
    });
  } catch (error: any) {
    res.status(400).json({
      error: 'ERROR',
      message: error.message,
    });
  }
}

export async function lpsGuaranteeDepositController(req: Request, res: Response): Promise<void> {
  const validation = LpsGuaranteeDepositSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', details: validation.error.flatten().fieldErrors });
    return;
  }

  const { amount, payment_method } = validation.data;
  const lpsId = (req.headers['x-lps-id'] as string) || 'lps_atlantico_01';

  res.status(201).json({
    deposit_id: 'dep_' + crypto.randomUUID().slice(0, 8),
    lps_id: lpsId,
    amount,
    currency: 'AOA',
    payment_method,
    status: 'PENDING',
    institutional_bank_details: {
      bank_name: 'Banco Angolano de Investimentos (BAI)',
      beneficiary: 'KwanzaPay Custódia e Liquidez Institucional Lda',
      iban: 'AO06 0040 0000 0019 2831 9999 1',
      entity: '00192',
      reference: 'KP' + Math.floor(100000 + Math.random() * 900000),
    },
    instructions: 'Efetue a transferência para a conta institucional indicada. O valor será creditado em available_guarantee após conciliação.',
  });
}

export async function getLpsStatusController(req: Request, res: Response): Promise<void> {
  const lpsList = guaranteeEngine.getAllLps().map((lps) => ({
    id: lps.id,
    display_name: lps.displayName,
    status: lps.status,
    available_guarantee: lps.availableGuarantee,
    frozen_guarantee: lps.frozenGuarantee,
    commission_rate: lps.commissionRate,
    total_commissions_earned: lps.totalCommissionsEarned,
    rating: lps.rating,
    trades_completed: lps.tradesCompleted,
    bank_name: lps.bankName,
    iban: lps.iban,
  }));

  res.status(200).json({
    total_lps_active: lpsList.filter((l) => l.status === 'ACTIVE').length,
    providers: lpsList,
    recent_transactions: guaranteeEngine.getAllTransactions().slice(0, 10),
    webhook_logs: guaranteeEngine.webhookLogs.slice(0, 10),
  });
}

/**
 * CONSULTA DE STATUS DA CONEXÃO DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
 * GET /api/v1/system/supabase-status (e /api/v1/system/database-status)
 */
export async function getSupabaseStatusController(req: Request, res: Response): Promise<void> {
  const status = await supabasePersistence.checkHealth();
  res.status(200).json({
    ...status,
    database_provider: 'Supabase (PostgreSQL Cloud)',
    timestamp: new Date().toISOString(),
    fallback_engine: 'In-Memory Atomic Escrow Active',
  });
}

/**
 * 1. OPERACIONAL: HEALTH CHECK DA REDE MULTICAIXA EXPRESS (SEMÁFORO EMIS)
 * GET /api/v1/network/emis-health
 */
export async function getEmisHealthController(req: Request, res: Response): Promise<void> {
  const health = guaranteeEngine.getEmisMulticaixaHealth();
  res.status(200).json(health);
}

/**
 * OPERACIONAL: REGISTRAR AMOSTRA DE TESTE NA REDE EMIS
 * POST /api/v1/network/emis-health/sample
 */
export async function recordEmisSampleController(req: Request, res: Response): Promise<void> {
  const { success, latency_ms } = req.body;
  guaranteeEngine.recordEmisTransactionSample(Boolean(success), Number(latency_ms) || 500);
  const updatedHealth = guaranteeEngine.getEmisMulticaixaHealth();
  res.status(200).json({
    message: 'Amostra operacional registada com sucesso no Semáforo EMIS.',
    health: updatedHealth,
  });
}

/**
 * 2. NOTIFICAÇÕES: SISTEMA HÍBRIDO EM TEMPO REAL (WEBSOCKET + PUSH + BOT)
 * GET /api/v1/lps/notifications
 */
export async function getLpsNotificationsController(req: Request, res: Response): Promise<void> {
  const lpsId = req.query.lps_id as string | undefined;
  const notifications = guaranteeEngine.getLpsNotifications(lpsId);
  res.status(200).json({
    count: notifications.length,
    active_channels: ['WEBSOCKET', 'PUSH_NOTIFICATION', 'TELEGRAM_BOT', 'WHATSAPP_BUSINESS'],
    notifications,
  });
}

/**
 * 3. FISCAL / COMPLIANCE: RELATÓRIO AGT (REGIME GERAL DO IVA - 14%)
 * GET /api/v1/compliance/agt-report
 */
export async function getAgtTaxReportController(req: Request, res: Response): Promise<void> {
  const partnerId = req.query.partner_id as string | undefined;
  const period = req.query.period as string | undefined;
  const report = guaranteeEngine.getAgtTaxReport(partnerId, period);
  res.status(200).json(report);
}

/**
 * 4. SEGURANÇA: SANITIZAÇÃO DE COMPROVATIVO EM SANDBOX OCR
 * POST /api/v1/compliance/sanitize-receipt
 */
export async function sanitizeReceiptController(req: Request, res: Response): Promise<void> {
  const { proof_url } = req.body;
  const result = guaranteeEngine.sanitizeProofReceipt(proof_url);
  if (!result.valid) {
    res.status(422).json({
      status: 'REJECTED',
      code: 'OCR_SECURITY_VIOLATION',
      error: result.error,
    });
    return;
  }

  res.status(200).json({
    status: 'CLEAN',
    message: 'Comprovativo analisado na sandbox de OCR e verificado como autêntico e seguro.',
    sha256: result.sha256,
  });
}

