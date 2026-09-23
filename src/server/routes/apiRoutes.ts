import { Router } from 'express';
import { requireGoogleAuth } from '../middleware/authMiddleware';
import {
  createPaymentOrderController,
  getPaymentByTokenController,
  payWithInternalBalanceController,
  selectLpsPaymentController,
  confirmUserPaidWithNupController,
  lpsConfirmReceiptController,
  lpsOpenDisputeController,
  checkoutController,
  confirmUserPaidLegacyController,
  lpsGuaranteeDepositController,
  getLpsStatusController,
  getSupabaseStatusController,
  getEmisHealthController,
  recordEmisSampleController,
  getLpsNotificationsController,
  getAgtTaxReportController,
  sanitizeReceiptController,
} from '../controllers/paymentController';

export const apiRouter = Router();

// Health Check
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'KwanzaPay Core API & Escrow Engine',
    version: '2.0.0-blueprint',
    timestamp: new Date().toISOString(),
  });
});

// Verificação de Conexão com o Banco de Dados (Supabase PostgreSQL / Local)
apiRouter.get('/v1/system/database-status', getSupabaseStatusController);
apiRouter.get('/v1/system/supabase-status', getSupabaseStatusController);

// ==========================================
// MONITOR OPERACIONAL & REDE EMIS
// ==========================================
apiRouter.get('/v1/network/emis-health', getEmisHealthController);
apiRouter.post('/v1/network/emis-health/sample', recordEmisSampleController);

// ==========================================
// NOTIFICAÇÕES HÍBRIDAS MULTICANAL (LPS)
// ==========================================
apiRouter.get('/v1/lps/notifications', getLpsNotificationsController);

// ==========================================
// CONFORMIDADE FISCAL & AGT (IVA 14%)
// ==========================================
apiRouter.get('/v1/compliance/agt-report', getAgtTaxReportController);
apiRouter.post('/v1/compliance/sanitize-receipt', sanitizeReceiptController);

// ==========================================
// 1. FLUXO DA LOJA (COMERCIANTE)
// ==========================================
// Criação de pedido de pagamento com Idempotência obrigatória (POST /v1/payments/create e POST /v1/charges)
apiRouter.post('/v1/payments/create', createPaymentOrderController);
apiRouter.post('/v1/charges', createPaymentOrderController);
apiRouter.post('/charges', createPaymentOrderController);

// ==========================================
// 2. FLUXO DO CLIENTE (CHECKOUT)
// ==========================================
// Obter dados da ordem via trade_token
apiRouter.get('/v1/payments/token/:trade_token', getPaymentByTokenController);

// Opção 1: Pagar com Saldo Interno
apiRouter.post('/v1/payments/checkout/internal-balance', requireGoogleAuth, payWithInternalBalanceController);

// Opção 2: Pagar via LPS (aloca LPS e bloqueia garantia em Escrow com 300s TTL)
apiRouter.post('/v1/payments/checkout/select-lps', requireGoogleAuth, selectLpsPaymentController);

// Confirmação de Envio com NUP ÚNICO obrigatório (Anti-Fraude)
apiRouter.post('/v1/payments/checkout/confirm-paid', requireGoogleAuth, confirmUserPaidWithNupController);

// ==========================================
// 3. FLUXO DO PROVEDOR DE LIQUIDEZ (LPS)
// ==========================================
// LPS confirma recebimento bancário (descongela garantia, liquida para loja e credita 1% comissão)
apiRouter.post('/v1/lps/orders/:trade_no/confirm-receipt', lpsConfirmReceiptController);

// LPS abre disputa (garantia permanece congelada em Escrow)
apiRouter.post('/v1/lps/orders/:trade_no/dispute', lpsOpenDisputeController);

// Aporte de garantia institucional
apiRouter.post('/v1/lps/guarantee/deposit', requireGoogleAuth, lpsGuaranteeDepositController);

// Consulta de status operacional, garantias e transações recentes
apiRouter.get('/v1/lps/status', getLpsStatusController);

// ==========================================
// ROTAS DE COMPATIBILIDADE (LEGADAS)
// ==========================================
apiRouter.post('/v1/payments/checkout', requireGoogleAuth, checkoutController);
apiRouter.post('/v1/payments/:transaction_id/confirm-user-paid', requireGoogleAuth, confirmUserPaidLegacyController);
