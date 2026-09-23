import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Store, 
  Package, 
  Tag, 
  Users, 
  Repeat, 
  Receipt, 
  Link as LinkIcon, 
  ArrowUpRight, 
  ShieldAlert, 
  Terminal, 
  BookOpen, 
  Key, 
  Webhook, 
  Puzzle, 
  MapPin, 
  Cpu, 
  LifeBuoy, 
  LogOut, 
  ExternalLink, 
  Bell, 
  Check, 
  Copy, 
  Plus, 
  RefreshCw, 
  Search, 
  Filter, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  Send, 
  Download, 
  Globe, 
  Sparkles,
  Smartphone,
  Landmark,
  ShieldCheck,
  CreditCard,
  Building2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  Clock,
  FileSpreadsheet
} from 'lucide-react';
import { 
  ProductItem, 
  CouponItem, 
  CustomerItem, 
  SubscriptionItem, 
  ChargeItem, 
  PaymentLinkItem, 
  WithdrawalItem, 
  DisputeItem, 
  SupportTicketItem, 
  StoreSettings,
  INITIAL_STORE_SETTINGS,
  INITIAL_PRODUCTS,
  INITIAL_COUPONS,
  INITIAL_CUSTOMERS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_CHARGES,
  INITIAL_PAYMENT_LINKS,
  INITIAL_WITHDRAWALS,
  INITIAL_DISPUTES,
  INITIAL_TICKETS,
  saveToFirestore
} from '../services/storeService';
import { loginWithGoogle, logoutUser } from '../lib/authClient';
import { AccountRole } from './LoginPage';
import { LpsVerificationModal } from './modals/LpsVerificationModal';
import { DocsModal } from './modals/DocsModal';

export type UnifiedSection = 
  | 'dashboard'
  | 'loja'
  | 'produtos'
  | 'cupons'
  | 'clientes'
  | 'assinaturas'
  | 'cobrancas'
  | 'links'
  | 'saques'
  | 'disputas'
  | 'integracao'
  | 'documentacao'
  | 'api'
  | 'webhook'
  | 'plugins'
  | 'roadmap'
  | 'devmode'
  | 'suporte';

export type DashboardTab = UnifiedSection;

interface UnifiedDashboardProps {
  initialSection?: UnifiedSection;
  userEmail: string;
  userName?: string;
  userPhoto?: string;
  onLogout: () => void;
  onBackToSite: () => void;
  onOpenCheckoutWithToken?: (token: string) => void;
  onChangeRole?: (newRole: AccountRole) => void;
}

export const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({
  initialSection = 'dashboard',
  userEmail: initialEmail,
  userName: initialName,
  userPhoto: initialPhoto,
  onLogout,
  onBackToSite,
  onOpenCheckoutWithToken,
  onChangeRole
}) => {
  // Estado da seção ativa
  const [currentSection, setCurrentSection] = useState<UnifiedSection>(initialSection);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (initialSection) {
      setCurrentSection(initialSection);
    }
  }, [initialSection]);

  // Perfil do utilizador autenticado
  const [userEmail, setUserEmail] = useState(initialEmail);
  const [userName, setUserName] = useState(initialName || 'Evaristo Paulo Cassoma');
  const [userPhoto, setUserPhoto] = useState(initialPhoto || '');
  const [isGoogleAuth, setIsGoogleAuth] = useState(true);
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);

  // Modo de Desenvolvimento (Dev Mode: Sandbox vs Produção)
  const [isDevMode, setIsDevMode] = useState(true); // true = Sandbox, false = Live

  // Verificação KYC para Provedor de Liquidez (LPS)
  const [isLpsVerified, setIsLpsVerified] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [docsModalInitialTab, setDocsModalInitialTab] = useState<'guide' | 'architecture' | 'endpoints' | 'database' | 'tester'>('guide');

  // Segurança de Sessão: Timeout de 30 minutos (1800s) com Reautenticação Obrigatória
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(1800); // 30 minutos em segundos
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);

  // Monitor e cronómetro regressivo de 30 minutos para segurança da sessão JWT
  useEffect(() => {
    // Resetar ou inicializar timer de sessão
    const sessionKey = `kp_session_started_${userEmail}`;
    let startTime = parseInt(localStorage.getItem(sessionKey) || '0', 10);
    const now = Date.now();

    if (!startTime || now - startTime > 1800 * 1000) {
      startTime = now;
      localStorage.setItem(sessionKey, startTime.toString());
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, 1800 - elapsed);
      setSessionTimeLeft(remaining);

      if (remaining === 0) {
        setIsSessionExpired(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userEmail]);

  const handleRenewSession = async () => {
    setIsLoggingInGoogle(true);
    try {
      const res = await loginWithGoogle();
      if (res.user) {
        setUserEmail(res.user.email || userEmail);
        setUserName(res.user.displayName || userName);
        setUserPhoto(res.user.photoURL || '');
        setIsGoogleAuth(true);
      }
      localStorage.setItem(`kp_session_started_${userEmail}`, Date.now().toString());
      setSessionTimeLeft(1800);
      setIsSessionExpired(false);
      showToast('Sessão de 30 minutos renovada com sucesso!');
    } catch {
      showToast('Falha na renovação da sessão.');
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  useEffect(() => {
    const verified = localStorage.getItem('kp_lps_verified') === 'true' ||
                     localStorage.getItem(`kp_lps_verified_${userEmail}`) === 'true';
    setIsLpsVerified(verified);
  }, [userEmail]);

  // Saldos da Loja
  const [balance, setBalance] = useState(2845000);
  const [inEscrow, setInEscrow] = useState(410500);
  const [showBalance, setShowBalance] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Coleções de Dados Interativos
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(INITIAL_STORE_SETTINGS);
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [coupons, setCoupons] = useState<CouponItem[]>(INITIAL_COUPONS);
  const [customers, setCustomers] = useState<CustomerItem[]>(INITIAL_CUSTOMERS);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(INITIAL_SUBSCRIPTIONS);
  const [charges, setCharges] = useState<ChargeItem[]>(INITIAL_CHARGES);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLinkItem[]>(INITIAL_PAYMENT_LINKS);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>(INITIAL_WITHDRAWALS);
  const [disputes, setDisputes] = useState<DisputeItem[]>(INITIAL_DISPUTES);
  const [tickets, setTickets] = useState<SupportTicketItem[]>(INITIAL_TICKETS);

  // Estados de Modais de Criação
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Formulários temporários
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '25000', stock: '50', category: 'Geral' });
  const [newCoupon, setNewCoupon] = useState({ code: '', discountValue: '10', discountType: 'percent' as 'percent' | 'fixed', minOrder: '15000', maxUses: '100' });
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '+244 ', city: 'Luanda' });
  const [newCharge, setNewCharge] = useState({ title: '', customer: '', amount: '20000', method: 'Multicaixa Express' as any, referenceNumber: '+244 923 111 222' });
  const [newLink, setNewLink] = useState({ title: '', amount: '15000' });
  const [newWithdrawal, setNewWithdrawal] = useState({ amount: '250000', iban: storeSettings.settlementIban });
  const [newDisputeReply, setNewDisputeReply] = useState('');
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'API' as any, priority: 'ALTA' as any });

  // Webhook Tester State
  const [webhookTestStatus, setWebhookTestStatus] = useState<'idle' | 'testing' | 'success'>('idle');
  const [webhookLogs, setWebhookLogs] = useState<Array<{ id: string; event: string; status: number; time: string }>>([
    { id: 'wh_log_01', event: 'payment.completed', status: 200, time: 'Há 12 min' },
    { id: 'wh_log_02', event: 'payment.disputed', status: 200, time: 'Há 1 hora' },
  ]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    showToast(`Copiado: ${label}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatKz = (amount: number) => {
    return new Intl.NumberFormat('pt-AO').format(amount) + ' Kz';
  };

  // Google Login Handler
  const handleGoogleSignIn = async () => {
    setIsLoggingInGoogle(true);
    try {
      const res = await loginWithGoogle();
      if (res.user) {
        setUserEmail(res.user.email || userEmail);
        setUserName(res.user.displayName || userName);
        setUserPhoto(res.user.photoURL || '');
        setIsGoogleAuth(true);
        showToast('Autenticado com sucesso via Google!');
      }
    } catch (e: any) {
      showToast('Erro ao logar com o Google.');
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  // Criação de Produto
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    const item: ProductItem = {
      id: `prod_${Date.now()}`,
      name: newProduct.name,
      description: newProduct.description || 'Produto oficial da loja',
      price: parseFloat(newProduct.price) || 10000,
      stock: parseInt(newProduct.stock) || 10,
      active: true,
      category: newProduct.category || 'Geral',
      createdAt: 'Hoje',
    };
    setProducts([item, ...products]);
    saveToFirestore('products', item.id, item);
    setModalOpen(null);
    setNewProduct({ name: '', description: '', price: '25000', stock: '50', category: 'Geral' });
    showToast('Produto cadastrado com sucesso!');
  };

  // Criação de Cupom
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) return;
    const item: CouponItem = {
      id: `coup_${Date.now()}`,
      code: newCoupon.code.toUpperCase().trim(),
      discountType: newCoupon.discountType,
      discountValue: parseFloat(newCoupon.discountValue) || 10,
      minOrder: parseFloat(newCoupon.minOrder) || 10000,
      uses: 0,
      maxUses: parseInt(newCoupon.maxUses) || 100,
      active: true,
      expiresAt: '31/12/2026',
    };
    setCoupons([item, ...coupons]);
    saveToFirestore('coupons', item.id, item);
    setModalOpen(null);
    setNewCoupon({ code: '', discountValue: '10', discountType: 'percent', minOrder: '15000', maxUses: '100' });
    showToast(`Cupom ${item.code} criado!`);
  };

  // Criação de Cliente
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.email) return;
    const item: CustomerItem = {
      id: `cust_${Date.now()}`,
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      city: newCustomer.city,
      totalSpent: 0,
      ordersCount: 0,
      lastPurchase: 'Cadastrado hoje',
    };
    setCustomers([item, ...customers]);
    saveToFirestore('customers', item.id, item);
    setModalOpen(null);
    setNewCustomer({ name: '', email: '', phone: '+244 ', city: 'Luanda' });
    showToast('Cliente adicionado à sua base!');
  };

  // Emissão de Cobrança
  const handleCreateCharge = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newCharge.amount) || 20000;
    const item: ChargeItem = {
      id: `chg_${Date.now()}`,
      title: newCharge.title || 'Cobrança Avulsa KwanzaPay',
      customer: newCharge.customer || 'Cliente Particular',
      amount: val,
      method: newCharge.method,
      referenceNumber: newCharge.method === 'Referência EMIS' ? `882 109 ${Math.floor(100 + Math.random() * 900)}` : newCharge.referenceNumber,
      entityNumber: newCharge.method === 'Referência EMIS' ? '00142' : undefined,
      status: 'PAGO',
      createdAt: 'Agora',
    };
    setCharges([item, ...charges]);
    setBalance(prev => prev + val);
    saveToFirestore('transactions', item.id, item);
    setModalOpen(null);
    showToast(`Cobrança emitida e creditada com sucesso: ${formatKz(val)}`);
  };

  // Geração de Link de Pagamento
  const handleCreatePaymentLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLink.title) return;
    const slug = newLink.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const item: PaymentLinkItem = {
      id: `link_${Date.now()}`,
      title: newLink.title,
      amount: parseFloat(newLink.amount) || 15000,
      slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
      url: `https://kwanzapay.ao/pay/${slug}`,
      clicks: 1,
      salesCount: 0,
      status: 'ATIVO',
      createdAt: 'Hoje',
    };
    setPaymentLinks([item, ...paymentLinks]);
    saveToFirestore('payment_links', item.id, item);
    setModalOpen(null);
    setNewLink({ title: '', amount: '15000' });
    showToast('Link de pagamento instantâneo gerado!');
  };

  // Pedido de Saque
  const handleCreateWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newWithdrawal.amount) || 50000;
    if (val > balance) {
      showToast('Saldo insuficiente para o saque solicitado.');
      return;
    }
    const fee = Math.round(val * 0.005); // 0.5%
    const net = val - fee;
    const item: WithdrawalItem = {
      id: `saq_${Date.now()}`,
      amount: val,
      fee,
      netAmount: net,
      bankName: storeSettings.bankName,
      iban: newWithdrawal.iban || storeSettings.settlementIban,
      status: 'PROCESSANDO',
      createdAt: 'Hoje às ' + new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }),
    };
    setBalance(prev => prev - val);
    setWithdrawals([item, ...withdrawals]);
    saveToFirestore('withdrawals', item.id, item);
    setModalOpen(null);
    showToast(`Saque de ${formatKz(val)} solicitado com sucesso para o seu IBAN!`);
  };

  // Abertura de Ticket de Suporte
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject) return;
    const item: SupportTicketItem = {
      id: `tkt_${Date.now()}`,
      subject: newTicket.subject,
      category: newTicket.category,
      priority: newTicket.priority,
      status: 'ABERTO',
      lastReply: 'Aguardando atribuição do engenheiro de plantão.',
      createdAt: 'Hoje às ' + new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }),
    };
    setTickets([item, ...tickets]);
    saveToFirestore('tickets', item.id, item);
    setModalOpen(null);
    setNewTicket({ subject: '', category: 'API', priority: 'ALTA' });
    showToast('Chamado de suporte aberto no sistema!');
  };

  // Teste de Ping do Webhook
  const handleTestWebhook = () => {
    setWebhookTestStatus('testing');
    setTimeout(() => {
      setWebhookTestStatus('success');
      const newLog = {
        id: `wh_log_${Date.now()}`,
        event: 'payment.completed (TEST PING)',
        status: 200,
        time: 'Agora',
      };
      setWebhookLogs([newLog, ...webhookLogs]);
      showToast('Webhook entregue com sucesso: HTTP 200 OK!');
      setTimeout(() => setWebhookTestStatus('idle'), 3000);
    }, 900);
  };

  // Rotação de Chaves de API
  const handleRotateApiKey = () => {
    const newKey = `sec_live_kpay_${Math.random().toString(36).substring(2)}${Date.now()}`;
    setStoreSettings(prev => ({ ...prev, liveSecretKey: newKey }));
    showToast('Chave de API secreta rotacionada com segurança!');
  };

  // Lista dos 18 menus requisitados pelo usuário
  const menuSections: Array<{
    id: UnifiedSection;
    label: string;
    icon: React.ElementType;
    group: 'principal' | 'financeiro' | 'dev' | 'sistema';
    badge?: string;
  }> = [
    // 1 a 5: Principal
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'principal' },
    { id: 'loja', label: 'Sua Loja', icon: Store, group: 'principal' },
    { id: 'produtos', label: 'Produtos', icon: Package, group: 'principal', badge: `${products.length}` },
    { id: 'cupons', label: 'Cupons', icon: Tag, group: 'principal', badge: `${coupons.length}` },
    { id: 'clientes', label: 'Clientes', icon: Users, group: 'principal' },

    // 6 a 10: Financeiro & Pagamentos
    { id: 'assinaturas', label: 'Assinaturas', icon: Repeat, group: 'financeiro' },
    { id: 'cobrancas', label: 'Cobranças', icon: Receipt, group: 'financeiro' },
    { id: 'links', label: 'Link de pagamentos', icon: LinkIcon, group: 'financeiro', badge: `${paymentLinks.length}` },
    { id: 'saques', label: 'Saques', icon: ArrowUpRight, group: 'financeiro' },
    { id: 'disputas', label: 'Disputas', icon: ShieldAlert, group: 'financeiro', badge: `${disputes.length}` },

    // 11 a 15: Desenvolvedor & Integração
    { id: 'integracao', label: 'Integração', icon: Terminal, group: 'dev' },
    { id: 'documentacao', label: 'Documentação', icon: BookOpen, group: 'dev' },
    { id: 'api', label: 'API', icon: Key, group: 'dev' },
    { id: 'webhook', label: 'Webhook', icon: Webhook, group: 'dev' },
    { id: 'plugins', label: 'Plugins', icon: Puzzle, group: 'dev' },

    // 16 a 18: Sistema & Suporte
    { id: 'roadmap', label: 'Roadmap', icon: MapPin, group: 'sistema' },
    { id: 'devmode', label: 'Dev Mode', icon: Cpu, group: 'sistema', badge: isDevMode ? 'Sandbox' : 'Live' },
    { id: 'suporte', label: 'Suporte', icon: LifeBuoy, group: 'sistema', badge: `${tickets.length}` },
  ];

  return (
    <div className="min-h-screen bg-[#070D1E] text-slate-100 flex flex-col font-sans selection:bg-[#A3E635] selection:text-slate-900">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#A3E635] text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-lime-400 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="size-5 shrink-0" />
          <span className="text-sm">{notification}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="h-16 border-b border-slate-800 bg-[#0B132B]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
            aria-label="Toggle menu"
          >
            <LayoutDashboard className="size-5" />
          </button>

          <button 
            onClick={onBackToSite}
            className="flex items-center gap-2 text-left group cursor-pointer"
          >
            <div className="size-9 rounded-xl bg-[#A3E635] text-slate-950 font-black flex items-center justify-center text-sm shadow-md group-hover:scale-105 transition-transform">
              KP
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>KwanzaPay</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30">
                  {isDevMode ? 'SANDBOX' : 'PRODUÇÃO'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block font-medium">Gateway P2P & Escrow Angola</span>
            </div>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Alternador de Papel de Acesso com Verificação (RBAC) */}
          {onChangeRole && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-xl">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Papel:</span>
              <select
                value="loja"
                onChange={(e) => {
                  const targetRole = e.target.value as AccountRole;
                  if (targetRole === 'provedor') {
                    if (!isLpsVerified) {
                      showToast('Quem não verificou o perfil não pode se tornar LPS. Solicite a verificação de perfil!');
                      setIsVerificationModalOpen(true);
                      return;
                    }
                    onChangeRole('provedor');
                    return;
                  }
                  if (targetRole === 'admin') {
                    showToast('Acesso restrito: Esta conta não possui privilégios de Administrador.');
                    return;
                  }
                  onChangeRole('loja');
                }}
                className="bg-transparent text-xs font-bold text-[#A3E635] focus:outline-none cursor-pointer"
                title="Mudar papel de acesso"
              >
                <option value="loja" className="bg-[#0B132B] text-white">Cliente / Loja</option>
                <option value="provedor" className="bg-[#0B132B] text-white">
                  {isLpsVerified ? 'Provedor de Liquidez (Ativo)' : 'Provedor de Liquidez (Requer KYC)'}
                </option>
                <option value="admin" className="bg-[#0B132B] text-slate-500" disabled>Administrador (Restrito)</option>
              </select>
            </div>
          )}

          {/* Botão de Verificação de Perfil para LPS */}
          {!isLpsVerified ? (
            <button
              onClick={() => setIsVerificationModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer shadow-sm"
              title="Solicitar verificação de perfil para se tornar Provedor de Liquidez"
            >
              <UserCheck className="size-3.5 text-amber-400" />
              <span>Tornar-se LPS</span>
            </button>
          ) : (
            <button
              onClick={() => onChangeRole && onChangeRole('provedor')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-sm"
              title="Aceder à Carteira de Provedor de Liquidez"
            >
              <Check className="size-3.5 text-emerald-400" />
              <span>LPS Verificado</span>
            </button>
          )}

          {/* Alternador Sandbox / Produção */}
          <button
            onClick={() => {
              setIsDevMode(!isDevMode);
              showToast(isDevMode ? 'Modo de Produção ativado!' : 'Modo Sandbox de Testes ativado!');
            }}
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              isDevMode 
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20' 
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            <span className={`size-2 rounded-full ${isDevMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span>{isDevMode ? 'Dev Mode: Sandbox' : 'Dev Mode: Live'}</span>
          </button>

          {/* Indicador de Segurança de Sessão JWT (Timeout de 30 minutos) */}
          <div
            onClick={handleRenewSession}
            title="Sessão com timeout de 30 minutos. Clique para renovar o token."
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono border cursor-pointer transition-colors ${
              sessionTimeLeft < 300 
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 animate-pulse' 
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-[#A3E635]/50'
            }`}
          >
            <Clock className="size-3 text-[#A3E635]" />
            <span>Sessão: {Math.floor(sessionTimeLeft / 60)}:{String(sessionTimeLeft % 60).padStart(2, '0')}</span>
          </div>

          {/* Perfil Google do Usuário */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            {userPhoto ? (
              <img src={userPhoto} alt={userName} className="size-8 rounded-full border border-slate-700 object-cover" />
            ) : (
              <div className="size-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold border border-slate-700">
                {userName.charAt(0)}
              </div>
            )}
            
            <div className="hidden md:block text-left">
              <span className="text-xs font-bold text-white block leading-tight truncate max-w-[130px]">{userName}</span>
              <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">{userEmail}</span>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoggingInGoogle}
              title="Reautenticar ou Trocar Conta Google"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <RefreshCw className={`size-3.5 ${isLoggingInGoogle ? 'animate-spin text-[#A3E635]' : ''}`} />
            </button>
          </div>

          <button
            onClick={onBackToSite}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Voltar ao Site
          </button>
        </div>
      </header>

      {/* Main Layout: Sidebar + Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar with 18 Sections */}
        <aside className={`
          fixed inset-y-16 left-0 z-20 w-64 bg-[#0B132B] border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Navigation Items grouped */}
          <div className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
            
            {/* GRUPO 1: PRINCIPAL */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-3 font-semibold">
                Principal
              </span>
              <div className="mt-1.5 space-y-0.5">
                {menuSections.filter(s => s.group === 'principal').map(item => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentSection(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#A3E635] text-slate-950 shadow-sm font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="size-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GRUPO 2: FINANCEIRO & PAGAMENTOS */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-3 font-semibold">
                Financeiro & Pagamentos
              </span>
              <div className="mt-1.5 space-y-0.5">
                {menuSections.filter(s => s.group === 'financeiro').map(item => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentSection(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#A3E635] text-slate-950 shadow-sm font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="size-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GRUPO 3: DESENVOLVEDOR & INTEGRAÇÃO */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-3 font-semibold">
                Desenvolvedor & API
              </span>
              <div className="mt-1.5 space-y-0.5">
                {menuSections.filter(s => s.group === 'dev').map(item => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentSection(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#A3E635] text-slate-950 shadow-sm font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="size-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GRUPO 4: SISTEMA & SUPORTE */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-3 font-semibold">
                Sistema & Suporte
              </span>
              <div className="mt-1.5 space-y-0.5">
                {menuSections.filter(s => s.group === 'sistema').map(item => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentSection(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#A3E635] text-slate-950 shadow-sm font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="size-4 shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Bottom Logout & Database status */}
          <div className="p-3 border-t border-slate-800 bg-[#070D1E]/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                Motor KPay Ativo
              </span>
              <span className="font-mono text-[10px]">v2.4.0</span>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="size-3.5" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* ========================================================================= */}
          {/* 1. SEÇÃO: DASHBOARD */}
          {/* ========================================================================= */}
          {currentSection === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header do Dashboard */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <span>Visão Geral do Negócio</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold font-mono">
                      Em Tempo Real
                    </span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Acompanhamento consolidado de vendas, liquidações e taxas do gateway KwanzaPay.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModalOpen('charge')}
                    className="px-4 py-2 rounded-xl bg-[#A3E635] text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:scale-[1.02] transition-transform shadow-md cursor-pointer"
                  >
                    <Plus className="size-4" />
                    <span>Nova Cobrança</span>
                  </button>
                  <button
                    onClick={() => setModalOpen('withdraw')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                  >
                    <ArrowUpRight className="size-4" />
                    <span>Solicitar Saque</span>
                  </button>
                </div>
              </div>

              {/* Cards de Métricas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Saldo Disponível</span>
                    <button onClick={() => setShowBalance(!showBalance)} className="text-slate-500 hover:text-white">
                      {showBalance ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </button>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">
                    {showBalance ? formatKz(balance) : '•••••••• Kz'}
                  </div>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <TrendingUp className="size-3" /> +18.4% esta semana
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Retido em Escrow</span>
                    <ShieldCheck className="size-4 text-sky-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-sky-400 font-mono">
                    {showBalance ? formatKz(inEscrow) : '•••••••• Kz'}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Garantia sob custódia</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Faturas Liquidadas</span>
                    <CheckCircle2 className="size-4 text-[#A3E635]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">
                    {charges.length + 18}
                  </div>
                  <span className="text-[11px] text-[#A3E635] font-semibold">99.4% taxa de aprovação</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold">Links de Pagamento</span>
                    <LinkIcon className="size-4 text-amber-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">
                    {paymentLinks.length}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">531 cliques únicos</span>
                </div>
              </div>

              {/* Tabela de Vendas Recentes */}
              <div className="rounded-2xl border border-slate-800 bg-[#0B132B] overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Receipt className="size-4 text-[#A3E635]" />
                    <span>Últimas Cobranças e Vendas</span>
                  </h3>
                  <button 
                    onClick={() => setCurrentSection('cobrancas')}
                    className="text-xs text-[#A3E635] hover:underline font-semibold"
                  >
                    Ver todas
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#070D1E] text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Identificador</th>
                        <th className="py-3 px-4">Cliente</th>
                        <th className="py-3 px-4">Método</th>
                        <th className="py-3 px-4">Montante</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {charges.slice(0, 5).map(c => (
                        <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-slate-300">{c.id}</td>
                          <td className="py-3.5 px-4 text-white font-semibold">{c.customer}</td>
                          <td className="py-3.5 px-4 text-slate-300">{c.method}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-white">{formatKz(c.amount)}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono">{c.createdAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. SEÇÃO: SUA LOJA */}
          {/* ========================================================================= */}
          {currentSection === 'loja' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">Configurações da Loja</h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Defina os dados da sua empresa, logotipo e a conta bancária para liquidação automática.
                </p>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  saveToFirestore('merchants', 'settings', storeSettings);
                  showToast('Dados da loja salvos com sucesso!');
                }}
                className="rounded-2xl border border-slate-800 bg-[#0B132B] p-5 sm:p-6 space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Nome Comercial da Loja</label>
                    <input 
                      type="text"
                      value={storeSettings.storeName}
                      onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-[#A3E635]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Email de Atendimento</label>
                    <input 
                      type="email"
                      value={storeSettings.supportEmail}
                      onChange={(e) => setStoreSettings({ ...storeSettings, supportEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-[#A3E635]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Telefone / WhatsApp Comercial</label>
                    <input 
                      type="text"
                      value={storeSettings.supportPhone}
                      onChange={(e) => setStoreSettings({ ...storeSettings, supportPhone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-[#A3E635]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Banco de Liquidação</label>
                    <select 
                      value={storeSettings.bankName}
                      onChange={(e) => setStoreSettings({ ...storeSettings, bankName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-[#A3E635]"
                    >
                      <option>Banco Angolano de Investimentos (BAI)</option>
                      <option>Banco Millennium Atlântico (BMA)</option>
                      <option>Banco de Fomento Angola (BFA)</option>
                      <option>Banco BIC Angola</option>
                      <option>Banco SOL</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300">IBAN de Liquidação (Angola)</label>
                    <input 
                      type="text"
                      value={storeSettings.settlementIban}
                      onChange={(e) => setStoreSettings({ ...storeSettings, settlementIban: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-[#A3E635]"
                    />
                    <span className="text-[11px] text-slate-500">Exemplo: AO06 0040 0000 8192 3840 1014 9</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button 
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#A3E635] text-slate-950 font-bold text-xs hover:scale-[1.02] transition-transform cursor-pointer shadow-md"
                  >
                    Salvar Alterações da Loja
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. SEÇÃO: PRODUTOS */}
          {/* ========================================================================= */}
          {currentSection === 'produtos' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white">Catálogo de Produtos</h1>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Crie e gerencie itens comercializáveis através do checkout KwanzaPay.
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen('product')}
                  className="px-4 py-2 rounded-xl bg-[#A3E635] text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:scale-[1.02] transition-transform shadow-md cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="size-4" />
                  <span>Cadastrar Produto</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => (
                  <div key={p.id} className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                          {p.category}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          p.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {p.active ? 'Ativo' : 'Pausado'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{p.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Preço</span>
                        <span className="text-base font-black text-white font-mono">{formatKz(p.price)}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">Estoque: {p.stock} un</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. SEÇÃO: CUPONS */}
          {/* ========================================================================= */}
          {currentSection === 'cupons' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white">Cupons de Desconto</h1>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Crie códigos promocionais para impulsionar conversões no checkout.
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen('coupon')}
                  className="px-4 py-2 rounded-xl bg-[#A3E635] text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:scale-[1.02] transition-transform shadow-md cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="size-4" />
                  <span>Criar Novo Cupom</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map(c => (
                  <div key={c.id} className="p-4 rounded-2xl bg-[#0B132B] border border-dashed border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-lg bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 font-mono font-black text-sm">
                        {c.code}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {c.discountType === 'percent' ? `${c.discountValue}% OFF` : `-${formatKz(c.discountValue)}`}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1">
                      <p>Pedido Mínimo: <span className="text-white font-mono">{formatKz(c.minOrder)}</span></p>
                      <p>Usos: <span className="text-white font-mono">{c.uses}</span> de {c.maxUses}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Expira em: {c.expiresAt}</span>
                      <button 
                        onClick={() => handleCopy(c.code, `Cupom ${c.code}`)}
                        className="text-[#A3E635] hover:underline font-bold"
                      >
                        Copiar Código
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. SEÇÃO: CLIENTES */}
          {/* ========================================================================= */}
          {currentSection === 'clientes' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white">Base de Clientes</h1>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Histórico de compradores e métricas individuais de consumo.
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen('customer')}
                  className="px-4 py-2 rounded-xl bg-[#A3E635] text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:scale-[1.02] transition-transform shadow-md cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="size-4" />
                  <span>Adicionar Cliente</span>
                </button>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0B132B] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#070D1E] text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Nome do Cliente</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Telefone</th>
                      <th className="py-3 px-4">Localização</th>
                      <th className="py-3 px-4">Total Gasto</th>
                      <th className="py-3 px-4">Pedidos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {customers.map(c => (
                      <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-white">{c.name}</td>
                        <td className="py-3 px-4 text-slate-300">{c.email}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{c.phone}</td>
                        <td className="py-3 px-4 text-slate-400">{c.city}</td>
                        <td className="py-3 px-4 font-mono font-bold text-[#A3E635]">{formatKz(c.totalSpent)}</td>
                        <td className="py-3 px-4 text-slate-300 font-mono">{c.ordersCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. SEÇÃO: ASSINATURAS */}
          {/* ========================================================================= */}
          {currentSection === 'assinaturas' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white">Assinaturas e Recorrência</h1>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Planos com débito programado automático para serviços contínuos.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0B132B] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#070D1E] text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Assinante</th>
                      <th className="py-3 px-4">Plano</th>
                      <th className="py-3 px-4">Valor Recorrente</th>
                      <th className="py-3 px-4">Intervalo</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Próxima Cobrança</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {subscriptions.map(s => (
                      <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-white block">{s.customerName}</span>
                          <span className="text-[11px] text-slate-400">{s.customerEmail}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-200 font-semibold">{s.planName}</td>
                        <td className="py-3 px-4 font-mono font-bold text-white">{formatKz(s.amount)}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{s.interval}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">{s.nextBilling}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 7. SEÇÃO: COBRANÇAS */}
          {/* ========================================================================= */}
          {currentSection === 'cobrancas' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white">Cobranças e Faturas</h1>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Emita faturas manuais em Kwanzas com Multicaixa Express ou Referência EMIS.
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen('charge')}
                  className="px-4 py-2 rounded-xl bg-[#A3E635] text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:scale-[1.02] transition-transform shadow-md cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="size-4" />
                  <span>Emitir Cobrança</span>
                </button>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0B132B] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#070D1E] text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Identificador</th>
                      <th className="py-3 px-4">Descrição</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Método & Coordenadas</th>
                      <th className="py-3 px-4">Valor</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {charges.map(c => (
                      <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-400">{c.id}</td>
                        <td className="py-3.5 px-4 text-white font-bold">{c.title}</td>
                        <td className="py-3.5 px-4 text-slate-300">{c.customer}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-white block font-semibold">{c.method}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {c.entityNumber ? `Ent: ${c.entityNumber} | Ref: ${c.referenceNumber}` : c.referenceNumber}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#A3E635]">{formatKz(c.amount)}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 8. SEÇÃO: LINK DE PAGAMENTOS */}
          {/* ========================================================================= */}
          {currentSection === 'links' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white">Links de Pagamentos</h1>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Crie links instantâneos para cobrar clientes no WhatsApp, Instagram e redes sociais.
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen('link')}
                  className="px-4 py-2 rounded-xl bg-[#A3E635] text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:scale-[1.02] transition-transform shadow-md cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="size-4" />
                  <span>Gerar Novo Link</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentLinks.map(l => (
                  <div key={l.id} className="p-5 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">{l.title}</h3>
                      <span className="text-base font-black text-[#A3E635] font-mono">{formatKz(l.amount)}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
                      <span className="truncate pr-2">{l.url}</span>
                      <button
                        onClick={() => handleCopy(l.url, 'Link de Pagamento')}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[#A3E635] transition-colors shrink-0"
                      >
                        <Copy className="size-3.5" />
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>{l.clicks} cliques • {l.salesCount} vendas</span>
                      <button
                        onClick={() => {
                          if (onOpenCheckoutWithToken) {
                            onOpenCheckoutWithToken('TEST_TOKEN_LINK_01');
                          } else {
                            window.location.hash = 'checkout';
                          }
                        }}
                        className="text-sky-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        <span>Simular Checkout</span>
                        <ExternalLink className="size-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 9. SEÇÃO: SAQUES */}
          {/* ========================================================================= */}
          {currentSection === 'saques' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white">Saques Bancários</h1>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Transfira o saldo disponível da sua carteira para a sua conta bancária em Angola.
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen('withdraw')}
                  className="px-4 py-2 rounded-xl bg-[#A3E635] text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:scale-[1.02] transition-transform shadow-md cursor-pointer self-start sm:self-auto"
                >
                  <ArrowUpRight className="size-4" />
                  <span>Novo Pedido de Saque</span>
                </button>
              </div>

              {/* Card de Resumo de Saldo */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0B132B] to-[#131E35] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Disponível para Liquidação Imediata</span>
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">{formatKz(balance)}</span>
                  <span className="text-xs text-slate-500 block mt-1">Taxa de transferência bancária: 0.5% (mínimo 500 Kz)</span>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400 block font-semibold">Conta Padrão Cadastrada</span>
                  <span className="text-xs text-white font-mono font-bold block">{storeSettings.bankName}</span>
                  <span className="text-xs text-slate-400 font-mono block">{storeSettings.settlementIban}</span>
                </div>
              </div>

              {/* Tabela de Saques Anteriores */}
              <div className="rounded-2xl border border-slate-800 bg-[#0B132B] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#070D1E] text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Identificador</th>
                      <th className="py-3 px-4">Montante Bruto</th>
                      <th className="py-3 px-4">Taxa (0.5%)</th>
                      <th className="py-3 px-4">Montante Líquido</th>
                      <th className="py-3 px-4">Banco & IBAN</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {withdrawals.map(w => (
                      <tr key={w.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-400">{w.id}</td>
                        <td className="py-3 px-4 font-mono font-bold text-white">{formatKz(w.amount)}</td>
                        <td className="py-3 px-4 font-mono text-rose-400">-{formatKz(w.fee)}</td>
                        <td className="py-3 px-4 font-mono font-bold text-[#A3E635]">{formatKz(w.netAmount)}</td>
                        <td className="py-3 px-4">
                          <span className="text-white block font-semibold">{w.bankName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{w.iban}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            w.status === 'CONCLUIDO' 
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">{w.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 10. SEÇÃO: DISPUTAS */}
          {/* ========================================================================= */}
          {currentSection === 'disputas' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">Central de Disputas & Mediação</h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Gerenciamento de pedidos contestados com retenção de segurança em garantia de Escrow.
                </p>
              </div>

              {disputes.length === 0 ? (
                <div className="p-8 rounded-2xl border border-slate-800 bg-[#0B132B] text-center space-y-2">
                  <CheckCircle2 className="size-8 text-emerald-400 mx-auto" />
                  <h3 className="text-sm font-bold text-white">Nenhuma disputa aberta no momento!</h3>
                  <p className="text-xs text-slate-400">Todas as suas vendas foram liquidadas com conformidade bancária.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {disputes.map(d => (
                    <div key={d.id} className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <ShieldAlert className="size-5 text-amber-400" />
                          <div>
                            <span className="text-sm font-bold text-white block">Ordem #{d.tradeNo} — {d.customerName}</span>
                            <span className="text-xs text-amber-300/80">Motivo: {d.reason}</span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-base font-black text-white font-mono">{formatKz(d.amount)}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 block w-fit sm:ml-auto">
                            EM ANÁLISE
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Garantia congelada no Escrow KwanzaPay até resolução.</span>
                        <button
                          onClick={() => {
                            showToast('Resposta e comprovativo enviados para a auditoria.');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#A3E635] text-slate-950 font-bold hover:scale-[1.02] transition-transform"
                        >
                          Enviar Defesa & Comprovativo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 11. SEÇÃO: INTEGRAÇÃO */}
          {/* ========================================================================= */}
          {currentSection === 'integracao' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">Guia Rápido de Integração</h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Conecte o checkout KwanzaPay ao seu backend em menos de 5 minutos.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0B132B] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-white font-mono">1. Chamada API de Criação de Ordem (Node.js / Express)</span>
                  <button 
                    onClick={() => handleCopy(`const res = await fetch('https://api.kwanzapay.ao/v1/checkout/create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${storeSettings.liveSecretKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    out_trade_no: 'PEDIDO_LOJA_9921',
    amount: 50000,
    currency: 'AOA',
    subject: 'Assinatura Pro KwanzaPay',
    notify_url: '${storeSettings.webhookUrl}',
    return_url: 'https://minhaloja.ao/checkout/sucesso'
  })
});
const data = await res.json();
console.log('URL de Pagamento:', data.payment_url);`, 'Snippet Node.js')}
                    className="text-xs text-[#A3E635] font-bold hover:underline"
                  >
                    Copiar Código
                  </button>
                </div>

                <pre className="font-mono text-[11px] text-slate-300 bg-slate-950 p-4 rounded-xl overflow-x-auto leading-relaxed">
{`const res = await fetch('https://api.kwanzapay.ao/v1/checkout/create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${storeSettings.liveSecretKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    out_trade_no: 'PEDIDO_LOJA_9921',
    amount: 50000,
    currency: 'AOA',
    subject: 'Assinatura Pro KwanzaPay',
    notify_url: '${storeSettings.webhookUrl}',
    return_url: 'https://minhaloja.ao/checkout/sucesso'
  })
});

const data = await res.json();
console.log('URL de Pagamento:', data.payment_url);`}
                </pre>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 12. SEÇÃO: DOCUMENTAÇÃO */}
          {/* ========================================================================= */}
          {currentSection === 'documentacao' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white">Documentação da API & Guia KwanzaPay</h1>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Manual completo de ponta a ponta, referência dos endpoints REST, regras RBAC e arquitetura de custódia P2P.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setDocsModalInitialTab('guide');
                      setIsDocsModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#A3E635] hover:bg-[#8ece28] text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                  >
                    <BookOpen className="size-4" />
                    <span>Abrir Guia Completo da Plataforma</span>
                  </button>
                  <div className="hidden md:block px-3 py-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                    OpenAPI 3.1 • v1.0
                  </div>
                </div>
              </div>

              {/* Destaque do Guia Completo */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#131E35] to-[#0B132B] border border-[#A3E635]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-bold text-[#A3E635] flex items-center gap-1.5">
                    <BookOpen className="size-3.5" />
                    Guia Oficial Interativo Disponível
                  </span>
                  <button
                    onClick={() => {
                      setDocsModalInitialTab('guide');
                      setIsDocsModalOpen(true);
                    }}
                    className="text-xs text-[#A3E635] font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Ver no Modal</span>
                    <ArrowUpRight className="size-3.5" />
                  </button>
                </div>
                <h3 className="text-base font-bold text-white">
                  Tudo sobre o KwanzaPay: Do Início ao Fim
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  Consulte a explicação completa dos papéis de acesso (Lojas, Provedores de Liquidez LPS e Administrador), fluxo de verificação de perfil KYC, criação de cobranças na API REST, webhooks e liquidação segura via Escrow com Multicaixa Express.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => {
                      setDocsModalInitialTab('guide');
                      setIsDocsModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white border border-slate-700 flex items-center gap-1.5"
                  >
                    <span>1. O que é</span>
                  </button>
                  <button
                    onClick={() => {
                      setDocsModalInitialTab('guide');
                      setIsDocsModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white border border-slate-700 flex items-center gap-1.5"
                  >
                    <span>2. Estrutura da Interface</span>
                  </button>
                  <button
                    onClick={() => {
                      setDocsModalInitialTab('guide');
                      setIsDocsModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white border border-slate-700 flex items-center gap-1.5"
                  >
                    <span>3. Regras de Perfis (RBAC)</span>
                  </button>
                  <button
                    onClick={() => {
                      setDocsModalInitialTab('guide');
                      setIsDocsModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white border border-slate-700 flex items-center gap-1.5"
                  >
                    <span>4. API & Endpoints</span>
                  </button>
                  <button
                    onClick={() => {
                      setDocsModalInitialTab('guide');
                      setIsDocsModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white border border-slate-700 flex items-center gap-1.5"
                  >
                    <span>5. Escrow & Ciclo P2P</span>
                  </button>
                  <button
                    onClick={() => {
                      setDocsModalInitialTab('guide');
                      setIsDocsModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-xs font-medium text-amber-300 border border-amber-500/40 flex items-center gap-1.5"
                  >
                    <span>8. Testes & Disputas</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-400 font-mono text-xs font-bold">POST</span>
                    <span className="font-mono text-xs text-white font-bold">/v1/checkout/create</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Cria uma nova ordem de pagamento e bloqueia caução correspondente no Provedor de Liquidez (LP) mais bem avaliado.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">GET</span>
                    <span className="font-mono text-xs text-white font-bold">/v1/transactions/:trade_no</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Consulta o estado atômico de uma transação (PENDING, ESCROW_LOCKED, COMPLETED, DISPUTED).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 font-mono text-xs font-bold">POST</span>
                    <span className="font-mono text-xs text-white font-bold">/v1/refunds/request</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Inicia o estorno de fundos retidos em garantia para a carteira de origem do pagador.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 13. SEÇÃO: API */}
          {/* ========================================================================= */}
          {currentSection === 'api' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white">Chaves de API & Credenciais</h1>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Utilize as chaves para autenticar as chamadas do seu servidor ao KwanzaPay.
                  </p>
                </div>
                <button
                  onClick={handleRotateApiKey}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                >
                  <RefreshCw className="size-4" />
                  <span>Rotacionar Chaves</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Chave Pública Live */}
                <div className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-400">Chave Pública (Live Public Key)</span>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono text-white">
                    <span>{storeSettings.livePublicKey}</span>
                    <button onClick={() => handleCopy(storeSettings.livePublicKey, 'Public Key')} className="text-[#A3E635] p-1">
                      <Copy className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Chave Secreta Live */}
                <div className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-400">Chave Secreta (Live Secret Key) — Guarde em Segredo!</span>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono text-white">
                    <span>{storeSettings.liveSecretKey}</span>
                    <button onClick={() => handleCopy(storeSettings.liveSecretKey, 'Secret Key')} className="text-[#A3E635] p-1">
                      <Copy className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Chaves Sandbox */}
                <div className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-amber-400">Chave Secreta de Testes (Sandbox Key)</span>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono text-white">
                    <span>{storeSettings.testSecretKey}</span>
                    <button onClick={() => handleCopy(storeSettings.testSecretKey, 'Sandbox Key')} className="text-amber-400 p-1">
                      <Copy className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 14. SEÇÃO: WEBHOOK */}
          {/* ========================================================================= */}
          {currentSection === 'webhook' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white">Configuração de Webhooks</h1>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Notificações assíncronas em tempo real assinadas com chave secreta HMAC-SHA256.
                  </p>
                </div>
                <button
                  onClick={handleTestWebhook}
                  disabled={webhookTestStatus === 'testing'}
                  className="px-4 py-2 rounded-xl bg-[#A3E635] text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:scale-[1.02] transition-transform shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Send className={`size-4 ${webhookTestStatus === 'testing' ? 'animate-spin' : ''}`} />
                  <span>Testar Envio (Ping ao Vivo)</span>
                </button>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0B132B] p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">URL do Endpoint de Webhook do seu Servidor</label>
                  <input 
                    type="url"
                    value={storeSettings.webhookUrl}
                    onChange={(e) => setStoreSettings({ ...storeSettings, webhookUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-[#A3E635]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Segredo de Assinatura Webhook (HMAC-SHA256 Secret)</label>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono text-white">
                    <span>{storeSettings.webhookSecret}</span>
                    <button onClick={() => handleCopy(storeSettings.webhookSecret, 'Webhook Secret')} className="text-[#A3E635] p-1">
                      <Copy className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Histórico de Disparos de Webhook */}
              <div className="rounded-2xl border border-slate-800 bg-[#0B132B] overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Histórico de Disparos Recentes
                  </h3>
                </div>
                <div className="divide-y divide-slate-800/60">
                  {webhookLogs.map(log => (
                    <div key={log.id} className="p-3.5 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                          {log.status} OK
                        </span>
                        <span className="text-white">{log.event}</span>
                      </div>
                      <span className="text-slate-500">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 15. SEÇÃO: PLUGINS */}
          {/* ========================================================================= */}
          {currentSection === 'plugins' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">Plugins Oficiais KwanzaPay</h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Módulos prontos para instalação com 1 clique nas principais plataformas de e-commerce.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-white">WooCommerce (WordPress)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#A3E635]/15 text-[#A3E635] font-bold">
                      v2.1.0 Estável
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Adiciona Multicaixa Express, Referência EMIS e UNITEL Money direto no checkout do seu WooCommerce.
                  </p>
                  <button 
                    onClick={() => showToast('Download do pacote kwanzapay-woocommerce.zip iniciado!')}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="size-4" />
                    <span>Baixar Plugin (.zip)</span>
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-white">Shopify App</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 font-bold">
                      App Oficial
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Instalação automática no painel da sua loja Shopify sem necessidade de editar código Liquid.
                  </p>
                  <button 
                    onClick={() => showToast('Redirecionando para o instalador da Shopify App Store...')}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="size-4" />
                    <span>Instalar na Shopify</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 16. SEÇÃO: ROADMAP */}
          {/* ========================================================================= */}
          {currentSection === 'roadmap' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">Roadmap de Produto</h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Planejamento de novidades e melhorias contínuas para o mercado angolano.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-emerald-400 font-mono uppercase block">✅ Lançado</span>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 text-slate-300 font-medium">
                      • Matching Atômico de Provedores de Liquidez (LPs)
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 text-slate-300 font-medium">
                      • Persistência em Base de Dados Supabase / PostgreSQL
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 text-slate-300 font-medium">
                      • Webhooks assinados com HMAC-SHA256
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-sky-400 font-mono uppercase block">⚡ Em Desenvolvimento</span>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 text-slate-300 font-medium">
                      • Aplicativo Mobile Android / iOS para Lojistas
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 text-slate-300 font-medium">
                      • Liquidação Instantânea Pix / Kwanza Internacional
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-amber-400 font-mono uppercase block">💡 Planejado</span>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 text-slate-300 font-medium">
                      • Split de Pagamento automático para Marketplaces
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 text-slate-300 font-medium">
                      • Cartão Virtual Pré-pago KwanzaPay Mastercard
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 17. SEÇÃO: DEV MODE */}
          {/* ========================================================================= */}
          {currentSection === 'devmode' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">Ambiente de Testes (Dev Mode)</h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Alterne entre o ambiente Sandbox (dados simulados) e Produção (valores reais).
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0B132B] space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Modo Sandbox Ativo</h3>
                    <p className="text-xs text-slate-400">
                      Quando ativado, todas as ordens e transferências usam coordenadas bancárias simuladas sem debitar dinheiro real.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsDevMode(!isDevMode);
                      showToast(isDevMode ? 'Alternado para Modo de Produção!' : 'Alternado para Modo Sandbox!');
                    }}
                    className="cursor-pointer"
                  >
                    {isDevMode ? (
                      <ToggleRight className="size-10 text-[#A3E635]" />
                    ) : (
                      <ToggleLeft className="size-10 text-slate-600" />
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-1.5">
                  <span className="text-slate-400 block font-bold">Simulação de NUP de Teste Multicaixa Express:</span>
                  <span className="text-[#A3E635] block">NUP_VALID_TEST_884920 (Aprova automaticamente)</span>
                  <span className="text-rose-400 block">NUP_FAIL_TEST_000000 (Simula falha de envio)</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 18. SEÇÃO: SUPORTE */}
          {/* ========================================================================= */}
          {currentSection === 'suporte' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white">Central de Suporte & Chamados</h1>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Abra tickets técnicos ou fale diretamente com a equipe de engenharia do gateway.
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen('ticket')}
                  className="px-4 py-2 rounded-xl bg-[#A3E635] text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:scale-[1.02] transition-transform shadow-md cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="size-4" />
                  <span>Abrir Novo Chamado</span>
                </button>
              </div>

              <div className="space-y-3">
                {tickets.map(t => (
                  <div key={t.id} className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          t.priority === 'ALTA' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          Prioridade: {t.priority}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-bold">
                          {t.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{t.createdAt}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white">{t.subject}</h3>
                    <p className="text-xs text-slate-400 bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                      {t.lastReply}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAIS INTERATIVOS DE CRIAÇÃO */}
      {/* ========================================================================= */}

      {/* Modal: Novo Produto */}
      {modalOpen === 'product' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B132B] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Cadastrar Novo Produto</h3>
              <button onClick={() => setModalOpen(null)} className="text-slate-400 hover:text-white">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Nome do Produto</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Assinatura Mensal KwanzaPay" 
                  value={newProduct.name} 
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Preço (Kz)</label>
                  <input 
                    type="number" 
                    required
                    value={newProduct.price} 
                    onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Estoque</label>
                  <input 
                    type="number" 
                    value={newProduct.stock} 
                    onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-300 font-bold block mb-1">Descrição</label>
                <textarea 
                  rows={2}
                  value={newProduct.description} 
                  onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Breve descrição do produto..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(null)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#A3E635] text-slate-950 font-bold">Salvar Produto</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Cupom */}
      {modalOpen === 'coupon' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B132B] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Criar Cupom Promocional</h3>
              <button onClick={() => setModalOpen(null)} className="text-slate-400 hover:text-white">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Código do Cupom</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: PROMO2026" 
                  value={newCoupon.code} 
                  onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Tipo de Desconto</label>
                  <select
                    value={newCoupon.discountType}
                    onChange={e => setNewCoupon({ ...newCoupon, discountType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="percent">Percentual (%)</option>
                    <option value="fixed">Fixo (Kz)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Valor do Desconto</label>
                  <input 
                    type="number" 
                    required
                    value={newCoupon.discountValue} 
                    onChange={e => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(null)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#A3E635] text-slate-950 font-bold">Ativar Cupom</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nova Cobrança */}
      {modalOpen === 'charge' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B132B] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Emitir Nova Cobrança</h3>
              <button onClick={() => setModalOpen(null)} className="text-slate-400 hover:text-white">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCharge} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Descrição / Título</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Fatura de Venda #2026-90" 
                  value={newCharge.title} 
                  onChange={e => setNewCharge({ ...newCharge, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold"
                />
              </div>
              <div>
                <label className="text-slate-300 font-bold block mb-1">Nome do Cliente</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Manuel Domingos" 
                  value={newCharge.customer} 
                  onChange={e => setNewCharge({ ...newCharge, customer: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Montante (Kz)</label>
                  <input 
                    type="number" 
                    required
                    value={newCharge.amount} 
                    onChange={e => setNewCharge({ ...newCharge, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Método de Pagamento</label>
                  <select
                    value={newCharge.method}
                    onChange={e => setNewCharge({ ...newCharge, method: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  >
                    <option>Multicaixa Express</option>
                    <option>Referência EMIS</option>
                    <option>UNITEL Money</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(null)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#A3E635] text-slate-950 font-bold">Emitir Fatura</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Solicitar Saque */}
      {modalOpen === 'withdraw' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B132B] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Solicitar Saque para Conta Bancária</h3>
              <button onClick={() => setModalOpen(null)} className="text-slate-400 hover:text-white">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreateWithdrawal} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Montante a Sacar (Kz)</label>
                <input 
                  type="number" 
                  required
                  value={newWithdrawal.amount} 
                  onChange={e => setNewWithdrawal({ ...newWithdrawal, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Saldo disponível: {formatKz(balance)}</span>
              </div>
              <div>
                <label className="text-slate-300 font-bold block mb-1">IBAN de Destino</label>
                <input 
                  type="text" 
                  required
                  value={newWithdrawal.iban} 
                  onChange={e => setNewWithdrawal({ ...newWithdrawal, iban: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-[11px]"
                />
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Taxa bancária (0.5%):</span>
                  <span className="text-rose-400 font-mono">-{formatKz(Math.round(parseFloat(newWithdrawal.amount || '0') * 0.005))}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800">
                  <span>Receberá líquido:</span>
                  <span className="text-[#A3E635] font-mono">{formatKz(Math.max(0, Math.round(parseFloat(newWithdrawal.amount || '0') * 0.995)))}</span>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(null)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#A3E635] text-slate-950 font-bold">Confirmar Saque</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Link de Pagamento */}
      {modalOpen === 'link' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B132B] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Gerar Link de Pagamento</h3>
              <button onClick={() => setModalOpen(null)} className="text-slate-400 hover:text-white">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePaymentLink} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Título do Link</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Workshop E-Commerce Luanda" 
                  value={newLink.title} 
                  onChange={e => setNewLink({ ...newLink, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold"
                />
              </div>
              <div>
                <label className="text-slate-300 font-bold block mb-1">Valor (Kz)</label>
                <input 
                  type="number" 
                  required
                  value={newLink.amount} 
                  onChange={e => setNewLink({ ...newLink, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(null)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#A3E635] text-slate-950 font-bold">Criar Link</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Ticket de Suporte */}
      {modalOpen === 'ticket' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B132B] border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Abrir Chamado de Suporte</h3>
              <button onClick={() => setModalOpen(null)} className="text-slate-400 hover:text-white">
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Assunto do Chamado</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Dúvida sobre webhook HMAC..." 
                  value={newTicket.subject} 
                  onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Categoria</label>
                  <select
                    value={newTicket.category}
                    onChange={e => setNewTicket({ ...newTicket, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  >
                    <option>API</option>
                    <option>Pagamentos</option>
                    <option>Saques</option>
                    <option>Conta</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Prioridade</label>
                  <select
                    value={newTicket.priority}
                    onChange={e => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  >
                    <option>ALTA</option>
                    <option>MEDIA</option>
                    <option>BAIXA</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(null)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#A3E635] text-slate-950 font-bold">Enviar Chamado</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Verificação de Perfil para Provedor de Liquidez (LPS) */}
      <LpsVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        userEmail={userEmail}
        onVerifiedSuccess={() => {
          setIsLpsVerified(true);
          showToast('Perfil verificado com sucesso! Acesso a Provedor de Liquidez desbloqueado.');
          if (onChangeRole) {
            onChangeRole('provedor');
          }
        }}
      />

      {/* Modal de Documentação e Guia Completo */}
      <DocsModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
        initialTab={docsModalInitialTab}
      />

      {/* Modal de Reautenticação Obrigatória por Timeout de Sessão (30 min) */}
      {isSessionExpired && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F172A] border border-amber-500/40 rounded-3xl p-6 space-y-5 shadow-2xl text-center animate-in zoom-in-95">
            <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mx-auto flex items-center justify-center shadow-lg">
              <Lock className="size-7" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white">Sessão Expirada (Timeout de 30 Minutos)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Por políticas rigorosas de segurança financeira e conformidade bancária do KwanzaPay, a sua sessão foi finalizada após 30 minutos de atividade. É obrigatória uma reautenticação para prosseguir.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0B132B] border border-slate-800 text-left space-y-1 text-xs font-mono">
              <div className="text-slate-400 flex justify-between">
                <span>Utilizador:</span>
                <span className="text-white truncate max-w-[200px]">{userEmail}</span>
              </div>
              <div className="text-slate-400 flex justify-between">
                <span>Regra:</span>
                <span className="text-amber-400">RFC-6749 30m Session Max</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRenewSession}
              disabled={isLoggingInGoogle}
              className="w-full py-3 rounded-2xl bg-[#A3E635] text-slate-950 font-bold text-xs hover:scale-[1.01] transition-transform shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className={`size-4 ${isLoggingInGoogle ? 'animate-spin' : ''}`} />
              <span>{isLoggingInGoogle ? 'A renovar credenciais...' : 'Reautenticar Agora com Google OAuth'}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
