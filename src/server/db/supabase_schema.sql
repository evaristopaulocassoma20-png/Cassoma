-- ============================================================================
-- KWANZAPAY ARCHITECTURE - SUPABASE PRODUCTION DDL MIGRATION & RLS
-- Concurrency Safe, Anti-Fraud Escrow, NUP Validation & Multi-Role Policies
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

-- ----------------------------------------------------------------------------
-- 3. TABELA: USERS (Usuários, Clientes e Administradores)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    role user_role NOT NULL DEFAULT 'USER',
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    
    -- Saldo Interno (Blindado contra saldo negativo)
    internal_balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_user_internal_balance_positive CHECK (internal_balance >= 0.00),
    
    -- Controles Anti-DoS
    expired_orders_count INT NOT NULL DEFAULT 0,
    lp_blocked_until TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ----------------------------------------------------------------------------
-- 4. TABELA: MERCHANTS (Lojas Parceiras Integradas via API)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id VARCHAR(64) UNIQUE NOT NULL,       -- ID público (ex: 'KP_PARTNER_882910')
    name VARCHAR(150) NOT NULL,
    secret_key VARCHAR(128) NOT NULL,              -- Chave HMAC-SHA256 para assinatura de Webhooks
    notify_url TEXT NOT NULL,                     -- Endpoint default de Webhook da loja
    return_url TEXT NOT NULL,                     -- URL de retorno após checkout do cliente
    
    -- Saldo Acumulado das Vendas a Liquidar
    balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_merchant_balance_positive CHECK (balance >= 0.00),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_merchants_partner_id ON public.merchants(partner_id);

-- ----------------------------------------------------------------------------
-- 5. TABELA: LPS (Provedores de Liquidez com Caução de Escrow)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    status lps_status NOT NULL DEFAULT 'ACTIVE',
    
    -- Saldos com Restrição Estrita CHECK >= 0 (Anti Race Conditions)
    available_balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_lp_available_positive CHECK (available_balance >= 0.00),

    locked_escrow_balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_lp_escrow_positive CHECK (locked_escrow_balance >= 0.00),
    
    -- Comissões (ex: 1.00%)
    commission_rate NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
    total_commissions_earned NUMERIC(18, 2) NOT NULL DEFAULT 0.00,

    -- Coordenadas Bancárias Angolanas para Recepção dos Fundos
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

-- ----------------------------------------------------------------------------
-- 6. TABELA: TRANSACTIONS (Ordens de Pagamento, Timers e NUP Único)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_no VARCHAR(60) UNIQUE NOT NULL,         -- Código de auditoria KwanzaPay
    trade_token VARCHAR(128) UNIQUE NOT NULL,      -- Token temporário para checkout do comprador
    
    merchant_id UUID NOT NULL REFERENCES public.merchants(id),
    partner_id VARCHAR(64) NOT NULL,
    out_trade_no VARCHAR(100) NOT NULL,            -- ID da encomenda no sistema da loja

    user_id UUID REFERENCES public.users(id),
    lp_id UUID REFERENCES public.lps(id),

    amount NUMERIC(18, 2) NOT NULL,
    CONSTRAINT chk_tx_amount_positive CHECK (amount > 0.00),
    currency VARCHAR(10) NOT NULL DEFAULT 'AOA',
    subject TEXT NOT NULL,
    payment_method payment_method_enum,
    
    status transaction_state NOT NULL DEFAULT 'PENDING_AUTH',
    
    -- REGRA CRÍTICA ANTI-FRAUDE: NUP ÚNICO
    nup_code VARCHAR(50) UNIQUE,
    proof_receipt_url TEXT,

    -- Comissões e taxas
    lp_commission_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    platform_fee_amount NUMERIC(18, 2) NOT NULL DEFAULT 0.00,

    -- TIMERS SEPARADOS (Evita cancelamento prematuro por delay interbancário)
    payment_window_timer INT NOT NULL DEFAULT 900,   -- 15 min (900s) para o cliente transferir
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

    -- Idempotência por comerciante e número do pedido
    CONSTRAINT uq_merchant_out_trade UNIQUE (merchant_id, out_trade_no)
);

CREATE INDEX IF NOT EXISTS idx_tx_trade_token ON public.transactions(trade_token);
CREATE INDEX IF NOT EXISTS idx_tx_status_deadlines ON public.transactions(status, transfer_deadline, verification_deadline);
CREATE INDEX IF NOT EXISTS idx_tx_lp_status ON public.transactions(lp_id, status);

-- ----------------------------------------------------------------------------
-- 7. TABELA: DISPUTES (Isolamento Estrito de Auditoria de Escrow)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 8. TABELA: AUDIT_LOGS (Trilha de Auditoria Regulatória BNA)
-- ----------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs(entity_type, entity_id);

-- ----------------------------------------------------------------------------
-- 9. TABELA: WEBHOOK_DELIVERIES (Log de Entregas e Retentativas)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 10. TRIGGER PARA ATUALIZAÇÃO AUTOMÁTICA DE updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_merchants_updated_at BEFORE UPDATE ON public.merchants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_lps_updated_at BEFORE UPDATE ON public.lps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TRIGGER trg_disputes_updated_at BEFORE UPDATE ON public.disputes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 11. STORED PROCEDURES PARA OPERAÇÕES ATÔMICAS NO SUPABASE (RPC)
-- ----------------------------------------------------------------------------

-- 11.1 MATCHING E BLOQUEIO DE ESCROW ATÔMICO (COM SELECT FOR UPDATE)
CREATE OR REPLACE FUNCTION public.kwanzapay_match_lp(
    p_trade_token TEXT,
    p_user_id UUID,
    p_payment_method payment_method_enum
)
RETURNS JSONB AS $$
DECLARE
    v_tx RECORD;
    v_lp RECORD;
    v_transfer_deadline TIMESTAMP WITH TIME ZONE;
BEGIN
    -- 1. Lock pessimista na transação
    SELECT * INTO v_tx 
    FROM public.transactions 
    WHERE trade_token = p_trade_token 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'TRADE_NOT_FOUND: Transação inexistente para o token fornecido.';
    END IF;

    IF v_tx.status != 'PENDING_AUTH' THEN
        RAISE EXCEPTION 'INVALID_STATE: Transação com status % não permite matching.', v_tx.status;
    END IF;

    -- 2. Lock pessimista no LP com melhor reputação e saldo suficiente
    SELECT * INTO v_lp 
    FROM public.lps 
    WHERE status = 'ACTIVE' 
      AND available_balance >= v_tx.amount
    ORDER BY rating DESC, available_balance DESC 
    LIMIT 1 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NO_LIQUIDITY_AVAILABLE: Nenhum Provedor de Liquidez com saldo de garantia suficiente.';
    END IF;

    -- 3. Movimentação atômica do saldo do LP: available -> locked_escrow
    UPDATE public.lps 
    SET available_balance = available_balance - v_tx.amount,
        locked_escrow_balance = locked_escrow_balance + v_tx.amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_lp.id;

    -- 4. Atualiza a transação com prazo de 15 minutos (900s)
    v_transfer_deadline := CURRENT_TIMESTAMP + INTERVAL '15 minutes';

    UPDATE public.transactions 
    SET user_id = p_user_id,
        lp_id = v_lp.id,
        payment_method = p_payment_method,
        status = 'PENDING_USER_TRANSFER',
        payment_window_timer = 900,
        transfer_deadline = v_transfer_deadline,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_tx.id;

    -- 5. Retorna dados do LP para o cliente efetuar o pagamento
    RETURN jsonb_build_object(
        'trade_no', v_tx.trade_no,
        'status', 'PENDING_USER_TRANSFER',
        'transfer_deadline', v_transfer_deadline,
        'amount', v_tx.amount,
        'currency', v_tx.currency,
        'lp', jsonb_build_object(
            'id', v_lp.id,
            'display_name', v_lp.display_name,
            'bank_name', v_lp.bank_name,
            'iban', v_lp.iban,
            'account_holder', v_lp.account_holder,
            'express_phone', v_lp.express_phone
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11.2 LIQUIDAÇÃO DE ESCROW ATÔMICA
CREATE OR REPLACE FUNCTION public.kwanzapay_release_escrow(
    p_trade_no TEXT,
    p_lp_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_tx RECORD;
    v_lp RECORD;
    v_merchant RECORD;
    v_lp_commission NUMERIC(18, 2);
    v_platform_fee NUMERIC(18, 2);
    v_now TIMESTAMP WITH TIME ZONE := CURRENT_TIMESTAMP;
BEGIN
    -- 1. Lock pessimista na transação
    SELECT * INTO v_tx 
    FROM public.transactions 
    WHERE trade_no = p_trade_no AND lp_id = p_lp_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'TRADE_NOT_FOUND: Transação não encontrada para este Provedor.';
    END IF;

    IF v_tx.status NOT IN ('PROOF_UPLOADED', 'PENDING_LP_VERIFICATION') THEN
        RAISE EXCEPTION 'INVALID_STATE: Não é possível liquidar transação no status %.', v_tx.status;
    END IF;

    -- 2. Lock no LP
    SELECT * INTO v_lp FROM public.lps WHERE id = p_lp_id FOR UPDATE;

    -- Cálculo de split
    v_lp_commission := (v_tx.amount * v_lp.commission_rate) / 100;
    v_platform_fee := (v_tx.amount * 0.5) / 100;

    -- 3. Descongela garantia do LP e credita a comissão merecida
    UPDATE public.lps 
    SET locked_escrow_balance = locked_escrow_balance - v_tx.amount,
        available_balance = available_balance + v_lp_commission,
        total_commissions_earned = total_commissions_earned + v_lp_commission,
        total_trades_completed = total_trades_completed + 1,
        updated_at = v_now
    WHERE id = v_lp.id;

    -- 4. Credita o saldo líquido na conta da Loja
    UPDATE public.merchants 
    SET balance = balance + v_tx.amount,
        updated_at = v_now
    WHERE id = v_tx.merchant_id;

    -- 5. Atualiza a transação para TRADE_SUCCESS
    UPDATE public.transactions 
    SET status = 'TRADE_SUCCESS',
        lp_commission_amount = v_lp_commission,
        platform_fee_amount = v_platform_fee,
        paid_at = v_now,
        updated_at = v_now
    WHERE id = v_tx.id;

    RETURN jsonb_build_object(
        'trade_no', v_tx.trade_no,
        'out_trade_no', v_tx.out_trade_no,
        'status', 'TRADE_SUCCESS',
        'amount', v_tx.amount,
        'lp_commission', v_lp_commission,
        'paid_at', v_now
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- 12.1 Service Role (Bypass total para operações de Escrow no backend)
CREATE POLICY "Service Role Full Access Users" ON public.users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Merchants" ON public.merchants FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access LPs" ON public.lps FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Transactions" ON public.transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Disputes" ON public.disputes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Audit" ON public.audit_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service Role Full Access Webhooks" ON public.webhook_deliveries FOR ALL USING (auth.role() = 'service_role');

-- 12.2 Consulta pública da transação pelo token do checkout
CREATE POLICY "Public Read Transaction by Token" ON public.transactions
FOR SELECT USING (trade_token IS NOT NULL);

-- 12.3 Visualização de LPs ativos para o checkout
CREATE POLICY "Public Read Active LPs" ON public.lps
FOR SELECT USING (status = 'ACTIVE');

-- ----------------------------------------------------------------------------
-- 13. DADOS INICIAIS (SEED DATA DE PRODUÇÃO)
-- ----------------------------------------------------------------------------

-- Usuários base
INSERT INTO public.users (id, email, name, role, internal_balance)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', 'evaristopaulocassoma2352@gmail.com', 'Evaristo Paulo Cassoma', 'ADMIN', 350000.00),
    ('c0000000-0000-0000-0000-000000000002', 'lp.atlantico@kwanzapay.ao', 'LP Atlântico (Evaristo Paulo)', 'LP', 0.00),
    ('c0000000-0000-0000-0000-000000000003', 'loja.kianda@kianda.ao', 'Loja Kianda E-Commerce', 'MERCHANT', 0.00)
ON CONFLICT (email) DO NOTHING;

-- Lojas parceiras
INSERT INTO public.merchants (id, partner_id, name, secret_key, notify_url, return_url, balance)
VALUES 
    ('m0000000-0000-0000-0000-000000000001', 'KP_PARTNER_882910', 'Loja Kianda E-Commerce', 'sec_live_kianda_9a87d65f12344c', 'https://loja.ao/api/kwanza-pay/callback', 'https://loja.ao/checkout/sucesso', 1425000.00),
    ('m0000000-0000-0000-0000-000000000002', 'KP_PARTNER_449012', 'TecnoAngola Distribuição', 'sec_live_tecno_3b11874acb9901', 'https://tecnoangola.ao/api/kp-webhook', 'https://tecnoangola.ao/confirmado', 890000.00)
ON CONFLICT (partner_id) DO NOTHING;

-- Provedores de Liquidez (LPS) com contas BAI e Atlântico
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
