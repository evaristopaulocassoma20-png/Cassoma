-- PostgreSQL DDL Migration: KwanzaPay Core Architecture & Anti-Fraud Security
-- Blueprint de Engenharia Consolidado

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE role_type AS ENUM ('USER', 'LPS', 'MERCHANT', 'ADMIN');
CREATE TYPE payment_method_type AS ENUM (
    'MULTICAIXA_EXPRESS',
    'TRANSFERENCIA_BANCARIA',
    'REFERENCIA',
    'UNITEL_MONEY',
    'USDT_TRC20',
    'INTERNAL_BALANCE'
);
CREATE TYPE transaction_status_type AS ENUM (
    'PENDING_AUTH',
    'PENDING_USER_TRANSFER',
    'GUARANTEE_LOCKED',
    'PENDING_LPS_VERIFICATION',
    'COMPLETED',
    'EXPIRED',
    'DISPUTED',
    'CANCELLED'
);
CREATE TYPE deposit_status_type AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');
CREATE TYPE lps_status_type AS ENUM ('ACTIVE', 'PAUSED', 'SUSPENDED');

-- 1. Lojas Parceiras (Merchants)
CREATE TABLE partner_merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    secret_key VARCHAR(128) NOT NULL, -- Chave HMAC-SHA256
    notify_url TEXT NOT NULL,
    return_url TEXT NOT NULL,
    balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Usuários / Clientes
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    role role_type NOT NULL DEFAULT 'USER',
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    internal_balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (internal_balance >= 0),
    expired_orders_24h INT NOT NULL DEFAULT 0,
    lps_blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Provedores de Liquidez (LPS)
CREATE TABLE lps_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    status lps_status_type NOT NULL DEFAULT 'ACTIVE',
    
    -- Garantia e Custódia Escrow
    available_guarantee NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (available_guarantee >= 0),
    frozen_guarantee NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (frozen_guarantee >= 0),
    
    commission_rate NUMERIC(4, 2) NOT NULL DEFAULT 1.00, -- 1% de comissão
    total_commissions_earned NUMERIC(18, 2) NOT NULL DEFAULT 0.00,

    bank_name VARCHAR(100) NOT NULL,
    iban VARCHAR(34) NOT NULL,
    account_holder VARCHAR(255) NOT NULL,
    express_phone VARCHAR(20),
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    total_trades_completed INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lps_available ON lps_profiles (status, available_guarantee);

-- 4. Transações Financeiras (com NUP ÚNICO e Chave Composta Idempotente)
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_no VARCHAR(60) UNIQUE NOT NULL,
    trade_token VARCHAR(100) UNIQUE NOT NULL,
    partner_id VARCHAR(50) NOT NULL REFERENCES partner_merchants(partner_id),
    out_trade_no VARCHAR(100) NOT NULL,
    
    user_id UUID REFERENCES users(id),
    lps_id UUID REFERENCES lps_profiles(id),
    
    amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'AOA',
    subject TEXT NOT NULL,
    payment_method payment_method_type,
    status transaction_status_type NOT NULL DEFAULT 'PENDING_AUTH',
    
    -- REGRA 4: NUP ÚNICO ABSOLUTO (Anti-Fraude de reciclagem de comprovativos)
    nup VARCHAR(50) UNIQUE,
    
    lps_commission_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    platform_fee_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    
    time_limit_seconds INT NOT NULL DEFAULT 300,
    transfer_deadline TIMESTAMP WITH TIME ZONE,
    verification_deadline TIMESTAMP WITH TIME ZONE,
    
    notify_url TEXT NOT NULL,
    return_url TEXT NOT NULL,
    proof_receipt_url TEXT,
    dispute_reason TEXT,
    
    webhook_delivered BOOLEAN NOT NULL DEFAULT FALSE,
    webhook_signature VARCHAR(128),
    
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- REGRA 1: Idempotência da loja
    CONSTRAINT uq_partner_out_trade UNIQUE (partner_id, out_trade_no)
);

CREATE INDEX idx_tx_user_status ON payment_transactions (user_id, status);
CREATE INDEX idx_tx_lps_status ON payment_transactions (lps_id, status);

-- 5. Registro de Idempotência (Idempotency-Key Header)
CREATE TABLE idempotency_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    response_body JSONB NOT NULL,
    status_code INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Depósitos de Garantia pelo LPS
CREATE TABLE guarantee_deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lps_id UUID NOT NULL REFERENCES lps_profiles(id) ON DELETE CASCADE,
    amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
    payment_method payment_method_type NOT NULL,
    status deposit_status_type NOT NULL DEFAULT 'PENDING',
    institutional_iban VARCHAR(34) NOT NULL,
    institutional_entity VARCHAR(10),
    institutional_ref VARCHAR(30),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PROCEDIMENTO CONCORRENTE: Bloqueio Pessimista de Garantia do LPS
CREATE OR REPLACE FUNCTION allocate_lps_guarantee_concurrency(
    p_trade_no VARCHAR,
    p_amount NUMERIC,
    p_payment_method payment_method_type
) RETURNS TABLE (
    success BOOLEAN,
    allocated_lps_id UUID,
    bank_name VARCHAR,
    iban VARCHAR,
    account_holder VARCHAR,
    express_phone VARCHAR
) LANGUAGE plpgsql AS $$
DECLARE
    v_lps RECORD;
BEGIN
    -- Seleciona com bloqueio de linha (FOR UPDATE)
    SELECT * INTO v_lps
    FROM lps_profiles
    WHERE status = 'ACTIVE'
      AND available_guarantee >= p_amount
    ORDER BY rating DESC, available_guarantee DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR;
        RETURN;
    END IF;

    -- Executa atualização atómica
    UPDATE lps_profiles
    SET available_guarantee = available_guarantee - p_amount,
        frozen_guarantee = frozen_guarantee + p_amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_lps.id;

    -- Atualiza transação
    UPDATE payment_transactions
    SET lps_id = v_lps.id,
        payment_method = p_payment_method,
        status = 'PENDING_USER_TRANSFER',
        transfer_deadline = CURRENT_TIMESTAMP + INTERVAL '300 seconds',
        updated_at = CURRENT_TIMESTAMP
    WHERE trade_no = p_trade_no;

    RETURN QUERY SELECT 
        TRUE, 
        v_lps.id, 
        v_lps.bank_name, 
        v_lps.iban, 
        v_lps.account_holder, 
        v_lps.express_phone;
END;
$$;
