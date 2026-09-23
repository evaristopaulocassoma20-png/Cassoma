/**
 * KwanzaPay - Script SQL Completo de Migração para Supabase PostgreSQL
 * Inclui: Tabelas, Restrições CHECK, Enums, Índices, RLS e Seed Data
 */
export const SUPABASE_COMPLETE_SQL = `-- ============================================================================
-- KWANZAPAY ARCHITECTURE - SUPABASE PRODUCTION DDL MIGRATION & RLS
-- Copie e cole no SQL Editor do seu projeto Supabase (https://supabase.com)
-- ============================================================================

-- 1. EXTENSÕES OBRIGATÓRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS DE DOMÍNIO
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('USER', 'LP', 'MERCHANT', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lps_status AS ENUM ('ACTIVE', 'PAUSED', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM (
        'MULTICAIXA_EXPRESS',
        'TRANSFERENCIA_BANCARIA',
        'REFERENCIA',
        'KWIK',
        'UNITEL_MONEY',
        'AFRIMONEY',
        'INTERNAL_BALANCE',
        'PAY_ONLINE',
        'PAY_PARCELA'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_state AS ENUM (
        'PENDING_AUTH',
        'PENDING_USER_TRANSFER',
        'PROOF_UPLOADED',
        'PENDING_LP_VERIFICATION',
        'TRADE_SUCCESS',
        'EXPIRED',
        'DISPUTED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dispute_state AS ENUM ('OPEN', 'UNDER_AUDIT', 'RESOLVED_REFUND_LP', 'RESOLVED_FORCE_RELEASE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABELA USERS
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    role user_role NOT NULL DEFAULT 'USER',
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    internal_balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (internal_balance >= 0.00),
    expired_orders_count INT NOT NULL DEFAULT 0,
    lp_blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 4. TABELA MERCHANTS
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    secret_key VARCHAR(128) NOT NULL,
    notify_url TEXT NOT NULL,
    return_url TEXT NOT NULL,
    balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0.00),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_merchants_partner_id ON public.merchants(partner_id);

-- 5. TABELA LPS
CREATE TABLE IF NOT EXISTS public.lps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    status lps_status NOT NULL DEFAULT 'ACTIVE',
    available_balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (available_balance >= 0.00),
    locked_escrow_balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (locked_escrow_balance >= 0.00),
    commission_rate NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
    total_commissions_earned NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    bank_name VARCHAR(100) NOT NULL,
    iban VARCHAR(34) NOT NULL,
    account_holder VARCHAR(255) NOT NULL,
    express_phone VARCHAR(20),
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    total_trades_completed INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lps_matching ON public.lps(status, available_balance DESC, rating DESC);

-- 6. TABELA TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_no VARCHAR(60) UNIQUE NOT NULL,
    trade_token VARCHAR(128) UNIQUE NOT NULL,
    merchant_id UUID NOT NULL REFERENCES public.merchants(id),
    partner_id VARCHAR(64) NOT NULL,
    out_trade_no VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES public.users(id),
    lp_id UUID REFERENCES public.lps(id),
    amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0.00),
    currency VARCHAR(10) NOT NULL DEFAULT 'AOA',
    subject TEXT NOT NULL,
    payment_method payment_method_enum,
    status transaction_state NOT NULL DEFAULT 'PENDING_AUTH',
    nup_code VARCHAR(50) UNIQUE,
    proof_receipt_url TEXT,
    lp_commission_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    platform_fee_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    payment_window_timer INT NOT NULL DEFAULT 900,
    lp_confirmation_timer INT NOT NULL DEFAULT 1800,
    transfer_deadline TIMESTAMP WITH TIME ZONE,
    verification_deadline TIMESTAMP WITH TIME ZONE,
    notify_url TEXT NOT NULL,
    return_url TEXT NOT NULL,
    webhook_delivered BOOLEAN NOT NULL DEFAULT FALSE,
    webhook_signature VARCHAR(128),
    webhook_attempts INT NOT NULL DEFAULT 0,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_merchant_out_trade UNIQUE (merchant_id, out_trade_no)
);

CREATE INDEX IF NOT EXISTS idx_tx_trade_token ON public.transactions(trade_token);
CREATE INDEX IF NOT EXISTS idx_tx_status_deadlines ON public.transactions(status, transfer_deadline, verification_deadline);
CREATE INDEX IF NOT EXISTS idx_tx_lp_status ON public.transactions(lp_id, status);

-- 7. TABELA DISPUTES
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID UNIQUE NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    opened_by_user_id UUID NOT NULL REFERENCES public.users(id),
    reason TEXT NOT NULL,
    evidence_url TEXT,
    status dispute_state NOT NULL DEFAULT 'OPEN',
    auditor_notes TEXT,
    resolved_by_admin_id UUID REFERENCES public.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);

-- 8. TABELA AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. TABELA WEBHOOK_DELIVERIES
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_no VARCHAR(60) NOT NULL REFERENCES public.transactions(trade_no),
    notify_url TEXT NOT NULL,
    signature VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    http_code INT,
    error_message TEXT,
    attempts INT NOT NULL DEFAULT 1,
    dispatched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. SEGURANÇA E ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Administrativo (Service Role / Backend)
CREATE POLICY "Service Role Full Users" ON public.users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Merchants" ON public.merchants FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full LPs" ON public.lps FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Transactions" ON public.transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Disputes" ON public.disputes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Audit" ON public.audit_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Webhooks" ON public.webhook_deliveries FOR ALL USING (auth.role() = 'service_role');

-- Políticas Públicas de Leitura
CREATE POLICY "Public Read Token" ON public.transactions FOR SELECT USING (trade_token IS NOT NULL);
CREATE POLICY "Public Read Active LPs" ON public.lps FOR SELECT USING (status = 'ACTIVE');

-- 11. DADOS INICIAIS (SEED DATA)
INSERT INTO public.users (id, email, name, role, internal_balance)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'evaristopaulocassoma2352@gmail.com', 'Evaristo Paulo Cassoma', 'ADMIN', 350000.00),
    ('c0000000-0000-0000-0000-000000000002', 'lp.atlantico@kwanzapay.ao', 'LP Atlântico (Evaristo Paulo)', 'LP', 0.00),
    ('c0000000-0000-0000-0000-000000000003', 'loja.kianda@kianda.ao', 'Loja Kianda E-Commerce', 'MERCHANT', 0.00)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.merchants (id, partner_id, name, secret_key, notify_url, return_url, balance)
VALUES 
    ('m0000000-0000-0000-0000-000000000001', 'KP_PARTNER_882910', 'Loja Kianda E-Commerce', 'sec_live_kianda_9a87d65f12344c', 'https://loja.ao/api/kwanza-pay/callback', 'https://loja.ao/checkout/sucesso', 1425000.00),
    ('m0000000-0000-0000-0000-000000000002', 'KP_PARTNER_449012', 'TecnoAngola Distribuição', 'sec_live_tecno_3b11874acb9901', 'https://tecnoangola.ao/api/kp-webhook', 'https://tecnoangola.ao/confirmado', 890000.00)
ON CONFLICT (partner_id) DO NOTHING;

INSERT INTO public.lps (
    id, user_id, display_name, status, 
    available_balance, locked_escrow_balance, commission_rate, 
    bank_name, iban, account_holder, express_phone, rating, total_trades_completed
)
VALUES 
    (
        'l0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000002',
        'LP Atlântico (Evaristo Paulo)',
        'ACTIVE',
        8396000.00,
        854000.00,
        1.00,
        'Banco Angolano de Investimentos (BAI)',
        'AO06 0040 0000 8192 3840 1014 9',
        'Evaristo Paulo Cassoma',
        '+244 923 456 789',
        4.95,
        1284
    ),
    (
        'l0000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000001',
        'LP Kalunga Liquidez Lda',
        'ACTIVE',
        4600000.00,
        400000.00,
        1.00,
        'Banco Millennium Atlântico (BMA)',
        'AO06 0055 0000 9928 1102 3391 2',
        'Kalunga Liquidez Lda',
        '+244 931 112 233',
        4.80,
        862
    )
ON CONFLICT (user_id) DO NOTHING;
`;
