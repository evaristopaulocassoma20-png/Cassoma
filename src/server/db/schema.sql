-- ============================================================================
-- KWANZAPAY ARCHITECTURE - POSTGRESQL PRODUCTION DDL SCHEMA
-- Concurrency Safe, Anti-Fraud Escrow, Rigorous Constraints & Performance Indexes
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 1. TABELA: USERS (Clientes & Usuários do Ecossistema)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    role user_role NOT NULL DEFAULT 'USER',
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    
    -- Saldo Interno com restrição absoluta contra saldo negativo
    internal_balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_user_balance_positive CHECK (internal_balance >= 0.00),
    
    -- Controles Anti-DoS (bloqueio temporário por cancelamentos sucessivos)
    expired_orders_count INT NOT NULL DEFAULT 0,
    lp_blocked_until TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ----------------------------------------------------------------------------
-- 2. TABELA: MERCHANTS (Lojas Parceiras que integram a API)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id VARCHAR(64) UNIQUE NOT NULL,       -- ID público da loja (ex: 'loja_kianda_01')
    name VARCHAR(150) NOT NULL,
    secret_key VARCHAR(128) NOT NULL,              -- Chave secreta para assinatura HMAC-SHA256
    notify_url TEXT NOT NULL,                     -- Endpoint default de Webhook
    return_url TEXT NOT NULL,                     -- URL de retorno após checkout
    
    -- Saldo acumulado de vendas a liquidar para o banco
    balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_merchant_balance_positive CHECK (balance >= 0.00),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_merchants_partner_id ON merchants(partner_id);

-- ----------------------------------------------------------------------------
-- 3. TABELA: LPS (Provedores de Liquidez com Caução Escrow)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    status lps_status NOT NULL DEFAULT 'ACTIVE',
    
    -- Saldos com restrição estrita CHECK >= 0 (Garante impossibilidade de saldo negativo por concorrência)
    available_balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_lp_available_positive CHECK (available_balance >= 0.00),

    locked_escrow_balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_lp_escrow_positive CHECK (locked_escrow_balance >= 0.00),
    
    -- Parâmetros Financeiros & Comissões
    commission_rate NUMERIC(4, 2) NOT NULL DEFAULT 1.00, -- 1.00%
    total_commissions_earned NUMERIC(18, 2) NOT NULL DEFAULT 0.00,

    -- Dados Bancários para recepção dos fundos transferidos pelo cliente
    bank_name VARCHAR(100) NOT NULL,
    iban VARCHAR(34) NOT NULL,
    account_holder VARCHAR(255) NOT NULL,
    express_phone VARCHAR(20),

    -- Reputação e Métricas
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    total_trades_completed INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índice de alta performance para o motor de matching (SELECT ... FOR UPDATE)
CREATE INDEX IF NOT EXISTS idx_lps_matching ON lps(status, available_balance DESC, rating DESC);

-- ----------------------------------------------------------------------------
-- 4. TABELA: TRANSACTIONS (Ordens de Pagamento, Timers Independentes e NUP)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_no VARCHAR(60) UNIQUE NOT NULL,         -- Código de auditoria interno KwanzaPay
    trade_token VARCHAR(128) UNIQUE NOT NULL,      -- Token temporário do checkout
    
    merchant_id UUID NOT NULL REFERENCES merchants(id),
    partner_id VARCHAR(64) NOT NULL,
    out_trade_no VARCHAR(100) NOT NULL,            -- ID da encomenda no sistema da loja

    user_id UUID REFERENCES users(id),
    lp_id UUID REFERENCES lps(id),

    amount NUMERIC(18, 2) NOT NULL,
    CONSTRAINT chk_tx_amount_positive CHECK (amount > 0.00),
    currency VARCHAR(10) NOT NULL DEFAULT 'AOA',
    subject TEXT NOT NULL,
    payment_method payment_method_enum,
    
    status transaction_state NOT NULL DEFAULT 'PENDING_AUTH',
    
    -- REGRA CRÍTICA 3: NUP ÚNICO ABSOLUTO (Anti-Fraude de reciclagem de comprovativo)
    nup_code VARCHAR(50) UNIQUE,
    proof_receipt_url TEXT,

    -- Split financeiro
    lp_commission_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    platform_fee_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,

    -- REGRA CRÍTICA 2: TIMERS SEPARADOS (Evita cancelamento prematuro por atraso interbancário)
    payment_window_timer INT NOT NULL DEFAULT 900,  -- 15 min (900s) para o cliente transferir
    lp_confirmation_timer INT NOT NULL DEFAULT 1800, -- 30 min (1800s) para o LP verificar extrato
    
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

    -- REGRA CRÍTICA 1: Idempotência garantida por loja e número de pedido
    CONSTRAINT uq_merchant_out_trade UNIQUE (merchant_id, out_trade_no)
);

CREATE INDEX IF NOT EXISTS idx_tx_trade_token ON transactions(trade_token);
CREATE INDEX IF NOT EXISTS idx_tx_status_deadlines ON transactions(status, transfer_deadline, verification_deadline);
CREATE INDEX IF NOT EXISTS idx_tx_lp_status ON transactions(lp_id, status);

-- ----------------------------------------------------------------------------
-- 5. TABELA: DISPUTES (Isolamento Estrito de Estado e Auditoria de Escrow)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID UNIQUE NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    opened_by_user_id UUID NOT NULL REFERENCES users(id),
    
    reason TEXT NOT NULL,
    evidence_url TEXT,
    status dispute_state NOT NULL DEFAULT 'OPEN',
    
    auditor_notes TEXT,
    resolved_by_admin_id UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
