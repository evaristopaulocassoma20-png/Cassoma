import { z } from 'zod';

export const PaymentMethodEnum = z.enum([
  'MULTICAIXA_EXPRESS',
  'TRANSFERENCIA_BANCARIA',
  'REFERENCIA',
  'UNITEL_MONEY',
  'USDT_TRC20',
  'INTERNAL_BALANCE', // Saldo Interno KwanzaPay
]);

export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export const TransactionStatusEnum = z.enum([
  'PENDING_AUTH',            // Ordem criada pelo merchant, aguardando autenticação do cliente
  'PENDING_USER_TRANSFER',   // Cliente escolheu LPS, aguardando transferência (TTL: 300s)
  'GUARANTEE_LOCKED',        // Garantia do LPS alocada no Escrow
  'PENDING_LPS_VERIFICATION',// Cliente informou NUP e transferiu; LPS tem 300s para verificar
  'COMPLETED',               // Pagamento validado e liquidado
  'EXPIRED',                 // Expirou por inação do cliente (desbloqueia garantia)
  'DISPUTED',                // Em disputa (garantia congelada em Escrow)
  'CANCELLED',               // Cancelado pelo cliente/loja
]);

export type TransactionStatus = z.infer<typeof TransactionStatusEnum>;

// ==========================================
// 1. FLUXO DA LOJA (COMERCIANTE)
// POST /v1/payments/create
// ==========================================
export const CreatePaymentOrderSchema = z.object({
  partner_id: z.string().min(1, 'partner_id é obrigatório'),
  out_trade_no: z.string().min(1, 'out_trade_no é obrigatório'),
  amount: z.coerce.number().positive('amount deve ser maior que zero').min(100, 'Montante mínimo é de 100 Kz'),
  currency: z.string().default('AOA'),
  subject: z.string().min(3, 'subject é obrigatório'),
  notify_url: z.string().url('notify_url deve ser uma URL válida'),
  return_url: z.string().url('return_url deve ser uma URL válida'),
});

export type CreatePaymentOrderInput = z.infer<typeof CreatePaymentOrderSchema>;

// Resposta do POST /v1/payments/create
export interface CreatePaymentOrderResponse {
  code: number;
  message: string;
  data: {
    trade_no: string;
    out_trade_no: string;
    trade_token: string;
    checkout_url: string;
    status: 'PENDING_AUTH';
    amount: number;
    currency: string;
    created_at: string;
  };
}

// ==========================================
// 2. CHECKOUT & CLIENTE
// ==========================================

// Seleção de Pagamento via Saldo Interno
export const PayInternalBalanceSchema = z.object({
  trade_token: z.string().min(1, 'trade_token é obrigatório'),
});

// Seleção de Pagamento via LPS (P2P Escrow)
export const SelectLpsPaymentSchema = z.object({
  trade_token: z.string().min(1, 'trade_token é obrigatório'),
  payment_method: PaymentMethodEnum.exclude(['INTERNAL_BALANCE']),
});

// Confirmação de Envio pelo Usuário (com NUP Único Obrigatório)
export const ConfirmUserPaidSchema = z.object({
  trade_no: z.string().min(1, 'trade_no é obrigatório'),
  nup: z.string()
    .min(6, 'NUP (Número Único de Processamento) deve ter no mínimo 6 caracteres')
    .max(30, 'NUP inválido')
    .regex(/^[A-Za-z0-9\-_]+$/, 'NUP deve conter apenas caracteres alfanuméricos'),
  proof_receipt_url: z.string().url('URL do comprovativo inválida').optional(),
  notes: z.string().max(300).optional(),
});

export type ConfirmUserPaidInput = z.infer<typeof ConfirmUserPaidSchema>;

// ==========================================
// 3. FLUXO DO LPS (PROVEDOR DE LIQUIDEZ)
// ==========================================

// Confirmação de Recebimento pelo LPS (Liquidação + Comissão de 1%)
export const LpsConfirmReceiptSchema = z.object({
  trade_no: z.string().min(1, 'trade_no é obrigatório'),
  lps_notes: z.string().max(200).optional(),
});

// Abertura de Disputa pelo LPS
export const LpsOpenDisputeSchema = z.object({
  trade_no: z.string().min(1, 'trade_no é obrigatório'),
  reason: z.string().min(5, 'Motivo da disputa é obrigatório'),
});

// Depósito de Garantia Institucional pelo LPS
export const LpsGuaranteeDepositSchema = z.object({
  amount: z.coerce.number().positive().min(50000, 'Depósito mínimo de garantia é de 50 000 Kz'),
  payment_method: PaymentMethodEnum,
});

export type LpsGuaranteeDeposit = z.infer<typeof LpsGuaranteeDepositSchema>;

// ==========================================
// 4. WEBHOOK PAYLOAD (HMAC-SHA256)
// ==========================================
export interface WebhookPaymentCompletedPayload {
  event: 'payment.completed' | 'payment.disputed' | 'payment.expired';
  trade_no: string;
  out_trade_no: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  payment_type: 'INTERNAL_BALANCE' | 'P2P_LPS';
  paid_at: string;
}

// Schemas retrocompatíveis para o endpoint antigo /checkout
export const CheckoutRequestSchema = z.object({
  order_id: z.string().min(1, 'order_id é obrigatório'),
  amount: z.coerce.number().positive().min(500, 'Montante mínimo é de 500 Kz'),
  currency: z.string().default('AOA'),
  return_url: z.string().url().optional(),
  payment_method: PaymentMethodEnum,
});

export const ConfirmUserPaidParamsSchema = z.object({
  transaction_id: z.string().min(1, 'transaction_id é obrigatório'),
});

export const ConfirmUserPaidBodySchema = z.object({
  nup: z.string().optional(),
  proof_receipt_url: z.string().url().optional(),
  notes: z.string().max(300).optional(),
});

export const SettleGuaranteeDepositSchema = z.object({
  deposit_id: z.string().min(1, 'deposit_id é obrigatório'),
  action: z.enum(['CONFIRM', 'REJECT']),
});
