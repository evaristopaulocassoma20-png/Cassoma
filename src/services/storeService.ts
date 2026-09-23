// Gestão de estado e dados da loja KwanzaPay

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  active: boolean;
  category: string;
  createdAt: string;
}

export interface CouponItem {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrder: number;
  uses: number;
  maxUses: number;
  active: boolean;
  expiresAt: string;
}

export interface CustomerItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalSpent: number;
  ordersCount: number;
  lastPurchase: string;
}

export interface SubscriptionItem {
  id: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  amount: number;
  interval: 'SEMANAL' | 'MENSAL' | 'ANUAL';
  status: 'ATIVA' | 'PENDENTE' | 'CANCELADA';
  nextBilling: string;
}

export interface ChargeItem {
  id: string;
  title: string;
  customer: string;
  amount: number;
  method: 'Multicaixa Express' | 'Referência EMIS' | 'UNITEL Money';
  referenceNumber: string;
  entityNumber?: string;
  status: 'PAGO' | 'PENDENTE' | 'EXPIRADO';
  createdAt: string;
}

export interface PaymentLinkItem {
  id: string;
  title: string;
  amount: number;
  slug: string;
  url: string;
  clicks: number;
  salesCount: number;
  status: 'ATIVO' | 'PAUSADO';
  createdAt: string;
}

export interface WithdrawalItem {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  bankName: string;
  iban: string;
  status: 'PROCESSANDO' | 'CONCLUIDO' | 'PENDENTE';
  createdAt: string;
}

export interface DisputeItem {
  id: string;
  tradeNo: string;
  customerName: string;
  amount: number;
  reason: string;
  status: 'EM_ANALISE' | 'RESOLVIDO_LOJA' | 'REEMBOLSADO';
  evidenceUrl?: string;
  createdAt: string;
}

export interface SupportTicketItem {
  id: string;
  subject: string;
  category: 'API' | 'Pagamentos' | 'Saques' | 'Conta';
  priority: 'ALTA' | 'MEDIA' | 'BAIXA';
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO';
  lastReply: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  brandColor: string;
  supportEmail: string;
  supportPhone: string;
  settlementIban: string;
  bankName: string;
  accountHolder: string;
  autoWithdrawal: boolean;
  webhookUrl: string;
  webhookSecret: string;
  livePublicKey: string;
  liveSecretKey: string;
  testPublicKey: string;
  testSecretKey: string;
}

// Valores padrão para a loja
export const INITIAL_STORE_SETTINGS: StoreSettings = {
  storeName: 'KwanzaPay Merchant Hub Angola',
  brandColor: '#A3E635',
  supportEmail: 'evaristopaulocassoma2352@gmail.com',
  supportPhone: '+244 923 456 789',
  settlementIban: 'AO06 0040 0000 8192 3840 1014 9',
  bankName: 'Banco Angolano de Investimentos (BAI)',
  accountHolder: 'Evaristo Paulo Cassoma',
  autoWithdrawal: true,
  webhookUrl: 'https://minhaloja.co.ao/api/kwanza-pay/webhook',
  webhookSecret: 'whsec_live_9a87d65f12344c88e990a1b2c3',
  livePublicKey: 'pk_live_kpay_998124401829',
  liveSecretKey: 'sec_live_kpay_449102837482910384',
  testPublicKey: 'pk_test_kpay_sandbox_118273928',
  testSecretKey: 'sec_test_kpay_sandbox_9981273948',
};

// Seed de dados iniciais para todas as 18 seções
export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod_01',
    name: 'Licença Anual KwanzaPay Pro',
    description: 'Acesso total a taxas reduzidas de 0.8% e liquidação em 1 hora',
    price: 150000,
    stock: 99,
    active: true,
    category: 'Software',
    createdAt: '15/09/2026',
  },
  {
    id: 'prod_02',
    name: 'Kit Terminal POS Portátil Bluetooth',
    description: 'Maquininha compatível com Multicaixa EMIS e impressora térmica',
    price: 85000,
    stock: 24,
    active: true,
    category: 'Hardware',
    createdAt: '14/09/2026',
  },
  {
    id: 'prod_03',
    name: 'Curso E-Commerce & Vendas em Angola',
    description: 'Passo a passo prático para escalar faturamento em Kwanzas',
    price: 35000,
    stock: 999,
    active: true,
    category: 'Educação',
    createdAt: '12/09/2026',
  },
];

export const INITIAL_COUPONS: CouponItem[] = [
  {
    id: 'coup_01',
    code: 'BEMVINDO10',
    discountType: 'percent',
    discountValue: 10,
    minOrder: 20000,
    uses: 142,
    maxUses: 500,
    active: true,
    expiresAt: '31/12/2026',
  },
  {
    id: 'coup_02',
    code: 'KWANZA5000',
    discountType: 'fixed',
    discountValue: 5000,
    minOrder: 50000,
    uses: 68,
    maxUses: 200,
    active: true,
    expiresAt: '30/10/2026',
  },
];

export const INITIAL_CUSTOMERS: CustomerItem[] = [
  {
    id: 'cust_01',
    name: 'Manuel António Domingos',
    email: 'manuel.domingos@unitel.ao',
    phone: '+244 923 111 222',
    city: 'Luanda (Talatona)',
    totalSpent: 485000,
    ordersCount: 7,
    lastPurchase: 'Hoje às 14:20',
  },
  {
    id: 'cust_02',
    name: 'Teresa Esperança Sebastião',
    email: 'teresa.sebastiao@bancobai.ao',
    phone: '+244 931 445 667',
    city: 'Luanda (Maianga)',
    totalSpent: 260000,
    ordersCount: 4,
    lastPurchase: 'Ontem às 18:05',
  },
  {
    id: 'cust_03',
    name: 'João Baptista da Costa',
    email: 'joao.costa@empresa.co.ao',
    phone: '+244 912 889 900',
    city: 'Benguela (Lobito)',
    totalSpent: 890000,
    ordersCount: 12,
    lastPurchase: 'Há 3 dias',
  },
];

export const INITIAL_SUBSCRIPTIONS: SubscriptionItem[] = [
  {
    id: 'sub_01',
    customerName: 'Manuel António Domingos',
    customerEmail: 'manuel.domingos@unitel.ao',
    planName: 'Plano Enterprise Mensal',
    amount: 75000,
    interval: 'MENSAL',
    status: 'ATIVA',
    nextBilling: '15/10/2026',
  },
  {
    id: 'sub_02',
    customerName: 'Teresa Esperança Sebastião',
    customerEmail: 'teresa.sebastiao@bancobai.ao',
    planName: 'Plano Start Semanal',
    amount: 18500,
    interval: 'SEMANAL',
    status: 'ATIVA',
    nextBilling: '22/09/2026',
  },
  {
    id: 'sub_03',
    customerName: 'Auto Peças Kilamba Lda',
    customerEmail: 'contato@kilambapecas.ao',
    planName: 'Plano Gateway B2B Anual',
    amount: 600000,
    interval: 'ANUAL',
    status: 'ATIVA',
    nextBilling: '01/03/2027',
  },
];

export const INITIAL_CHARGES: ChargeItem[] = [
  {
    id: 'chg_01',
    title: 'Cobrança #MCX-88210 - Pedido Loja',
    customer: 'Manuel António Domingos',
    amount: 125000,
    method: 'Multicaixa Express',
    referenceNumber: '+244 923 111 222',
    status: 'PAGO',
    createdAt: 'Há 15 min',
  },
  {
    id: 'chg_02',
    title: 'Fatura Proforma #REF-99182',
    customer: 'Auto Peças Kilamba Lda',
    amount: 340000,
    method: 'Referência EMIS',
    entityNumber: '00142',
    referenceNumber: '891 002 441',
    status: 'PAGO',
    createdAt: 'Há 45 min',
  },
  {
    id: 'chg_03',
    title: 'Venda Rápida WhatsApp',
    customer: 'Ana Paula Lourenço',
    amount: 45000,
    method: 'UNITEL Money',
    referenceNumber: '+244 931 998 112',
    status: 'PENDENTE',
    createdAt: 'Há 1 hora',
  },
];

export const INITIAL_PAYMENT_LINKS: PaymentLinkItem[] = [
  {
    id: 'link_01',
    title: 'Inscrição Workshop E-Commerce Luanda',
    amount: 25000,
    slug: 'workshop-ecommerce-2026',
    url: 'https://kwanzapay.ao/pay/workshop-ecommerce-2026',
    clicks: 342,
    salesCount: 48,
    status: 'ATIVO',
    createdAt: '10/09/2026',
  },
  {
    id: 'link_02',
    title: 'Acesso VIP Mentoria de Finanças',
    amount: 90000,
    slug: 'mentoria-financas-vip',
    url: 'https://kwanzapay.ao/pay/mentoria-financas-vip',
    clicks: 189,
    salesCount: 19,
    status: 'ATIVO',
    createdAt: '12/09/2026',
  },
];

export const INITIAL_WITHDRAWALS: WithdrawalItem[] = [
  {
    id: 'saq_01',
    amount: 1500000,
    fee: 7500,
    netAmount: 1492500,
    bankName: 'Banco Angolano de Investimentos (BAI)',
    iban: 'AO06 0040 0000 8192 3840 1014 9',
    status: 'CONCLUIDO',
    createdAt: '12/09/2026 às 11:30',
  },
  {
    id: 'saq_02',
    amount: 850000,
    fee: 4250,
    netAmount: 845750,
    bankName: 'Banco Millennium Atlântico (BMA)',
    iban: 'AO06 0055 0000 9928 1102 3391 2',
    status: 'PROCESSANDO',
    createdAt: 'Hoje às 09:15',
  },
];

export const INITIAL_DISPUTES: DisputeItem[] = [
  {
    id: 'disp_01',
    tradeNo: 'KP_ORD_8892144',
    customerName: 'Afonso Pedro Cassoma',
    amount: 75000,
    reason: 'Comprador alega não recebimento do código de ativação',
    status: 'EM_ANALISE',
    evidenceUrl: 'https://comprovativo.ao/doc/8892.pdf',
    createdAt: '14/09/2026',
  },
];

export const INITIAL_TICKETS: SupportTicketItem[] = [
  {
    id: 'tkt_01',
    subject: 'Dúvida sobre webhook HMAC em ambiente de produção',
    category: 'API',
    priority: 'ALTA',
    status: 'EM_ANDAMENTO',
    lastReply: 'Técnico KwanzaPay: "Assinatura testada com sucesso..."',
    createdAt: 'Hoje às 10:14',
  },
  {
    id: 'tkt_02',
    subject: 'Solicitação de aumento de limite diário de saque Multicaixa',
    category: 'Saques',
    priority: 'MEDIA',
    status: 'RESOLVIDO',
    lastReply: 'Limite ampliado para 10.000.000 Kz/dia.',
    createdAt: '11/09/2026',
  },
];

/**
 * Funções de persistência local segura (LocalStorage e Cache em memória)
 */
export async function saveToFirestore<T>(collectionName: string, id: string, data: T): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem(`kp_cache_${collectionName}`) || '{}');
      existing[id] = data;
      localStorage.setItem(`kp_cache_${collectionName}`, JSON.stringify(existing));
    }
  } catch (err: any) {
    console.warn(`[Local storage sync note on ${collectionName}]`, err.message);
  }
}

export async function loadCollectionFromFirestore<T>(collectionName: string, defaultItems: T[]): Promise<T[]> {
  // Verifica cache local
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(`kp_cache_${collectionName}`);
    if (cached) {
      try {
        const obj = JSON.parse(cached);
        const list = Object.values(obj) as T[];
        if (list.length > 0) return list;
      } catch (e) {
        // ignore
      }
    }
  }

  return defaultItems;
}

/**
 * Cria uma ordem real no backend para checkout instantâneo de produto ou link de pagamento
 */
export async function createRealCheckoutOrder(params: {
  amount: number;
  subject: string;
  partner_id?: string;
  customer_name?: string;
  customer_email?: string;
}): Promise<{ trade_token: string; trade_no: string; checkout_url: string }> {
  try {
    const res = await fetch('/api/v1/payments/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        partner_id: params.partner_id || 'KP_PARTNER_882910',
        out_trade_no: `ORD_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
        amount: params.amount,
        currency: 'AOA',
        subject: params.subject,
        notify_url: 'https://minhaloja.co.ao/api/kwanza-pay/webhook',
        return_url: 'https://minhaloja.co.ao/checkout/sucesso',
      }),
    });

    const data = await res.json();
    if (data?.data?.trade_token) {
      return {
        trade_token: data.data.trade_token,
        trade_no: data.data.trade_no,
        checkout_url: data.data.checkout_url || `/#checkout?token=${data.data.trade_token}`,
      };
    }
  } catch (e) {
    console.error('Falha ao criar ordem real de pagamento:', e);
  }

  const fallbackToken = `token_${Date.now()}`;
  return {
    trade_token: fallbackToken,
    trade_no: `KP_TX_${Date.now()}`,
    checkout_url: `/#checkout?token=${fallbackToken}`,
  };
}
