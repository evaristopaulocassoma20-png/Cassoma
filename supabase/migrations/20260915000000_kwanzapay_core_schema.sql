-- ============================================================================
-- KWANZAPAY ARCHITECTURE - SUPABASE CLI MIGRATION
-- Migration: 20260915000000_kwanzapay_core_schema.sql
-- ============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
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
    internal_balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_user_internal_balance_positive CHECK (internal_balance >= 0.00),
    expired_orders_count INT NOT NULL DEFAULT 0,
    lp_blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABELA MERCHANTS
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    secret_key VARCHAR(128) NOT NULL,
    notify_url TEXT NOT NULL,
    return_url TEXT NOT NULL,
    balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_merchant_balance_positive CHECK (balance >= 0.00),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABELA LPS
CREATE TABLE IF NOT EXISTS public.lps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    status lps_status NOT NULL DEFAULT 'ACTIVE',
    available_balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_lp_available_positive CHECK (available_balance >= 0.00),
    locked_escrow_balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_lp_escrow_positive CHECK (locked_escrow_balance >= 0.00),
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
    amount NUMERIC(18, 2) NOT NULL,
    CONSTRAINT chk_tx_amount_positive CHECK (amount > 0.00),
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
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_merchant_out_trade UNIQUE (merchant_id, out_trade_no)
);

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

-- 8. AUDIT & WEBHOOKS
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

-- 9. RLS POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service Role Full Access Users" ON public.users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Merchants" ON public.merchants FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access LPs" ON public.lps FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Transactions" ON public.transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Disputes" ON public.disputes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Audit" ON public.audit_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Webhooks" ON public.webhook_deliveries FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Public Read Transaction by Token" ON public.transactions FOR SELECT USING (trade_token IS NOT NULL);
CREATE POLICY "Public Read Active LPs" ON public.lps FOR SELECT USING (status = 'ACTIVE');
