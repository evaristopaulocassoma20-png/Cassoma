import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  Bell, 
  LogOut, 
  Home, 
  CheckCircle, 
  SlidersHorizontal, 
  Coins, 
  MoreHorizontal, 
  Check, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  X, 
  Star, 
  ArrowLeft,
  Info
} from 'lucide-react';
import { AccountRole } from './LoginPage';

interface LPWalletDashboardProps {
  userEmail: string;
  onLogout: () => void;
  onBackToSite: () => void;
  onChangeRole: (newRole: AccountRole) => void;
}

export type LPTab = 'inicio' | 'confirmar' | 'oferta' | 'ganhos' | 'mais';

interface ActivityItem {
  id: string;
  avatar: string;
  name: string;
  product: string;
  method: string;
  amount: number;
  time: string;
  status: 'aguardando' | 'comprovativo' | 'disputa' | 'liquidado';
  statusLabel: string;
  refCode?: string;
  bankName?: string;
  senderIban?: string;
}

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'ord_kianda_01',
    avatar: 'LO',
    name: 'Loja Kianda',
    product: 'PayP2P',
    method: 'Multicaixa Express',
    amount: 145000,
    time: 'há 4 min',
    status: 'aguardando',
    statusLabel: 'A aguardar pagamento',
    refCode: 'MCX-89210',
  },
  {
    id: 'ord_tecno_02',
    avatar: 'TE',
    name: 'TecnoAngola',
    product: 'PayOnline',
    method: 'Transferência bancária',
    amount: 620000,
    time: 'há 40 min',
    status: 'comprovativo',
    statusLabel: 'Comprovativo enviado',
    refCode: 'TRF-BAI-49021',
    bankName: 'Banco Angolano de Investimentos (BAI)',
    senderIban: 'AO06 0040 0000 1289 4410 1029 4',
  },
  {
    id: 'ord_bita_03',
    avatar: 'FA',
    name: 'Farmácia Bita',
    product: 'PayP2P',
    method: 'UNITEL Money',
    amount: 89000,
    time: 'há 3 h',
    status: 'disputa',
    statusLabel: 'Em disputa',
    refCode: 'UTM-003912',
  },
  {
    id: 'ord_mercado_04',
    avatar: 'ME',
    name: 'Mercado Luanda',
    product: 'PayUSD',
    method: 'USDT (TRC20)',
    amount: 310000,
    time: 'há 1 d',
    status: 'liquidado',
    statusLabel: 'Liquidado',
    refCode: 'TRX-77a8b9',
  },
];

export const LPWalletDashboard: React.FC<LPWalletDashboardProps> = ({
  userEmail,
  onLogout,
  onBackToSite,
  onChangeRole,
}) => {
  const [activeTab, setActiveTab] = useState<LPTab>('inicio');
  const [showBalance, setShowBalance] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Balances
  const [availableLiquidity, setAvailableLiquidity] = useState(9250000);
  const [reservedLiquidity, setReservedLiquidity] = useState(854000);
  const [monthlyCommission, setMonthlyCommission] = useState(184300);

  // Activities
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);

  // Offer Configuration (Image 5)
  const [offerTaxRate, setOfferTaxRate] = useState<number>(1.20);
  const [minPerOp, setMinPerOp] = useState<string>('5000');
  const [maxPerOp, setMaxPerOp] = useState<string>('4500000');
  const [paymentWindow, setPaymentWindow] = useState<string>('15 min');
  const [pauseOffersCheck, setPauseOffersCheck] = useState<boolean>(false);

  // Accepted methods checkboxes
  const [methods, setMethods] = useState({
    multicaixaExpress: true,
    transferenciaBancaria: true,
    referencia: false,
    unitelMoney: false,
    depositoNumerario: false,
    usdt: false,
  });

  // Modal states
  const [selectedProof, setSelectedProof] = useState<ActivityItem | null>(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pendingCount = activities.filter((a) => a.status === 'comprovativo').length;

  useEffect(() => {
    document.title = 'Carteira do LP — Ofertas, taxas e confirmações | KwanzaPay';
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConfirmProof = (activity: ActivityItem) => {
    setActivities((prev) =>
      prev.map((item) =>
        item.id === activity.id
          ? { ...item, status: 'liquidado', statusLabel: 'Liquidado', time: 'Agora mesmo' }
          : item
      )
    );
    setReservedLiquidity((prev) => Math.max(0, prev - activity.amount));
    const commissionEarned = Math.round(activity.amount * (offerTaxRate / 100));
    setMonthlyCommission((prev) => prev + commissionEarned);
    setSelectedProof(null);
    showToast(`Comprovativo validado! ${formatKz(activity.amount)} liquidados (+${formatKz(commissionEarned)} comissão).`);
  };

  const formatKz = (num: number) => {
    return new Intl.NumberFormat('pt-AO').format(num) + ' Kz';
  };

  const toggleMethod = (key: keyof typeof methods) => {
    setMethods((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-[#0B131F] text-slate-100 flex flex-col font-sans selection:bg-[#A3E635] selection:text-[#0B131F]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#111C2D] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#A3E635]/40 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="size-4 text-[#A3E635] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navigation - Matching Image 3 */}
      <header className="sticky top-0 z-40 bg-[#0B131F]/90 backdrop-blur border-b border-[#1A2638] px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Left: Lime Avatar 'E' + Balance Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-[#A3E635] text-[#0B131F] font-display font-bold text-base shadow-sm">
            E
          </div>

          <div className="rounded-full bg-[#132034] border border-[#1E2E47] px-3.5 py-1.5 text-xs sm:text-sm font-bold font-mono text-white shadow-inner">
            {showBalance ? '9 250 000 Kz' : '•••••••• Kz'}
          </div>
        </div>

        {/* Right side controls: Eye, Bell, Exit */}
        <div className="flex items-center gap-2">
          {/* Quick link back to site */}
          <button
            onClick={onBackToSite}
            className="hidden md:inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-full border border-[#1E2E47] bg-[#132034] transition-colors mr-1"
          >
            <ArrowLeft className="size-3" />
            <span>Site</span>
          </button>

          {/* Alternador de papel */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 mr-2">
            <span className="text-[11px] uppercase tracking-wider">Papel:</span>
            <select
              value="provedor"
              onChange={(e) => {
                const target = e.target.value as AccountRole;
                if (target === 'loja') {
                  onChangeRole('loja');
                }
              }}
              className="rounded-lg border border-[#1E2E47] bg-[#132034] px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#A3E635] cursor-pointer"
            >
              <option value="provedor">Provedor de Liquidez (LPS)</option>
              <option value="loja">Cliente / Loja</option>
            </select>
          </div>

          {/* Eye Icon (Toggle balance visibility) */}
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="flex size-10 items-center justify-center rounded-full bg-[#132034] border border-[#1E2E47] text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            title={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
          >
            {showBalance ? <Eye className="size-4.5" /> : <EyeOff className="size-4.5" />}
          </button>

          {/* Bell Icon (Notifications with green dot) */}
          <div className="relative">
            <button
              onClick={() => showToast('Nenhuma notificação nova no momento.')}
              className="flex size-10 items-center justify-center rounded-full bg-[#132034] border border-[#1E2E47] text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
              title="Notificações"
            >
              <Bell className="size-4.5" />
              <span className="absolute top-2 right-2 size-2 rounded-full bg-[#A3E635]" />
            </button>
          </div>

          {/* Exit / Logout Icon */}
          <button
            onClick={onLogout}
            className="flex size-10 items-center justify-center rounded-full bg-[#132034] border border-[#1E2E47] text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            title="Sair / Terminar sessão"
          >
            <LogOut className="size-4.5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-5 pb-24 space-y-5">
        
        {/* ===================== COMMON CIRCULAR BUTTONS (Images 3, 4, 5) ===================== */}
        {/* When in tab 'oferta' or 'mais', the circular action buttons appear at the top above the cards */}
        {(activeTab === 'oferta' || activeTab === 'mais' || activeTab === 'confirmar') && (
          <div className="grid grid-cols-3 gap-2 py-2">
            {/* Confirmar */}
            <button
              onClick={() => setActiveTab('confirmar')}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className={`relative flex size-14 items-center justify-center rounded-full border transition-all shadow-md group-active:scale-95 ${
                activeTab === 'confirmar'
                  ? 'border-[#A3E635] bg-[#A3E635]/15 text-[#A3E635]'
                  : 'bg-[#132034] border-[#20324D] text-white group-hover:border-[#A3E635]'
              }`}>
                <CheckCircle className="size-6" />
                {pendingCount > 0 && (
                  <span className="absolute top-0 right-0 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-black">
                    {pendingCount}
                  </span>
                )}
              </div>
              <span className={`text-xs font-semibold ${activeTab === 'confirmar' ? 'text-[#A3E635]' : 'text-slate-300 group-hover:text-white'}`}>
                Confirmar
              </span>
            </button>

            {/* Oferta */}
            <button
              onClick={() => setActiveTab('oferta')}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className={`flex size-14 items-center justify-center rounded-full border transition-all shadow-md group-active:scale-95 ${
                activeTab === 'oferta'
                  ? 'border-[#A3E635] bg-[#A3E635]/15 text-[#A3E635]'
                  : 'bg-[#132034] border-[#20324D] text-white group-hover:border-[#A3E635]'
              }`}>
                <SlidersHorizontal className="size-6" />
              </div>
              <span className={`text-xs font-semibold ${activeTab === 'oferta' ? 'text-[#A3E635]' : 'text-slate-300 group-hover:text-white'}`}>
                Oferta
              </span>
            </button>

            {/* Pausar / Ativar */}
            <button
              onClick={() => {
                const nextState = !isPaused;
                setIsPaused(nextState);
                showToast(nextState ? 'Liquidez pausada temporariamente.' : 'Liquidez reativada no mercado.');
              }}
              className="flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className={`flex size-14 items-center justify-center rounded-full border transition-all shadow-md group-active:scale-95 ${
                isPaused
                  ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                  : 'bg-[#132034] border-[#20324D] text-white group-hover:border-[#A3E635]'
              }`}>
                <div className="flex gap-1 items-center justify-center">
                  <div className="w-1.5 h-4 bg-current rounded-full" />
                  <div className="w-1.5 h-4 bg-current rounded-full" />
                </div>
              </div>
              <span className={`text-xs font-semibold ${isPaused ? 'text-amber-400' : 'text-slate-300 group-hover:text-white'}`}>
                {isPaused ? 'Ativar' : 'Pausar'}
              </span>
            </button>
          </div>
        )}

        {/* ===================== TAB 1: INÍCIO (EXACT REPLICA OF IMAGE 3) ===================== */}
        {activeTab === 'inicio' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* HERO CARD: Liquidez disponível */}
            <div className="rounded-3xl border border-[#1E2D44] bg-[#111C2D] p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-4">
              {/* Subtle radial glow top right */}
              <div className="absolute top-0 right-0 -mr-12 -mt-12 size-48 rounded-full bg-[#A3E635]/10 blur-3xl pointer-events-none" />

              {/* Header inside card: Liquidez disponível (left) and KwanzaPay (right) */}
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-slate-400 font-medium">
                  Liquidez disponível
                </span>
                <div className="flex items-center gap-1 font-display text-base sm:text-lg font-bold">
                  <span className="text-white">Kwanza</span>
                  <span className="text-[#A3E635]">Pay</span>
                </div>
              </div>

              {/* Big Amount: 9 250 000 Kz */}
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
                  {showBalance ? '9 250 000 Kz' : '•••••••• Kz'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">
                  ≈ 854 000 Kz reservados em 4 operações
                </p>
              </div>

              {/* Lime Badge: Comissões do mês: 184 300 Kz */}
              <div className="pt-1">
                <span className="inline-block rounded-full bg-[#A3E635] px-3 py-1 text-xs font-bold text-[#0B131F]">
                  Comissões do mês: {formatKz(monthlyCommission)}
                </span>
              </div>

              {/* Footer Account Identity */}
              <div className="pt-2 text-xs text-slate-400 font-medium border-t border-[#1C2C42]">
                Evaristopaulocassoma2352 · Provedor de Liquidez
              </div>
            </div>

            {/* 3 Circular Action Buttons: Confirmar, Oferta, Pausar */}
            <div className="grid grid-cols-3 gap-2 py-2">
              {/* Confirmar */}
              <button
                onClick={() => setActiveTab('confirmar')}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="relative flex size-14 items-center justify-center rounded-full bg-[#132034] border border-[#20324D] group-hover:border-[#A3E635] text-white transition-all shadow-md group-active:scale-95">
                  <CheckCircle className="size-6" />
                  {pendingCount > 0 && (
                    <span className="absolute top-0 right-0 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-black">
                      {pendingCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                  Confirmar
                </span>
              </button>

              {/* Oferta */}
              <button
                onClick={() => setActiveTab('oferta')}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-[#132034] border border-[#20324D] group-hover:border-[#A3E635] text-white transition-all shadow-md group-active:scale-95">
                  <SlidersHorizontal className="size-6" />
                </div>
                <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                  Oferta
                </span>
              </button>

              {/* Pausar / Ativar */}
              <button
                onClick={() => {
                  const nextState = !isPaused;
                  setIsPaused(nextState);
                  showToast(nextState ? 'Liquidez pausada temporariamente.' : 'Liquidez reativada no mercado.');
                }}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className={`flex size-14 items-center justify-center rounded-full border transition-all shadow-md group-active:scale-95 ${
                  isPaused
                    ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                    : 'bg-[#132034] border-[#20324D] text-white group-hover:border-[#A3E635]'
                }`}>
                  <div className="flex gap-1 items-center justify-center">
                    <div className="w-1.5 h-4 bg-current rounded-full" />
                    <div className="w-1.5 h-4 bg-current rounded-full" />
                  </div>
                </div>
                <span className={`text-xs font-semibold ${isPaused ? 'text-amber-400' : 'text-slate-300 group-hover:text-white'}`}>
                  {isPaused ? 'Ativar' : 'Pausar'}
                </span>
              </button>
            </div>

            {/* 3 Stats / KPI Cards: RESERVADA, A VALIDAR, REPUTAÇÃO */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {/* RESERVADA */}
              <div className="rounded-2xl border border-[#1E2D44] bg-[#111C2D] p-3.5 sm:p-4 space-y-1">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                  RESERVADA
                </span>
                <p className="text-sm sm:text-base font-bold font-display text-white truncate">
                  {formatKz(reservedLiquidity)}
                </p>
              </div>

              {/* A VALIDAR */}
              <div 
                onClick={() => setActiveTab('confirmar')}
                className="rounded-2xl border border-[#1E2D44] bg-[#111C2D] p-3.5 sm:p-4 space-y-1 cursor-pointer hover:border-[#A3E635]/50 transition-colors"
              >
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  A VALIDAR
                </span>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm sm:text-base font-bold font-display text-white">
                    {pendingCount}
                  </p>
                  {pendingCount > 0 && (
                    <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
              </div>

              {/* REPUTAÇÃO */}
              <div className="rounded-2xl border border-[#1E2D44] bg-[#111C2D] p-3.5 sm:p-4 space-y-1">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  REPUTAÇÃO
                </span>
                <p className="text-sm sm:text-base font-bold font-display text-white">
                  4,9 ★
                </p>
              </div>
            </div>

            {/* Atividade recente Section */}
            <div className="rounded-2xl border border-[#1E2D44] bg-[#111C2D] p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#1A283C]">
                <h2 className="text-sm sm:text-base font-bold text-white font-display">
                  Atividade recente
                </h2>
                <button
                  onClick={() => setActiveTab('confirmar')}
                  className="text-xs font-semibold text-[#A3E635] hover:underline"
                >
                  Ver tudo
                </button>
              </div>

              {/* List matching screenshot: A aguardar pagamento, Comprovativo enviado, Em disputa, Liquidado */}
              <div className="space-y-3 pt-1">
                {activities.map((item) => {
                  const isAwaiting = item.status === 'aguardando';
                  const isProofSent = item.status === 'comprovativo';
                  const isDispute = item.status === 'disputa';
                  const isLiquidated = item.status === 'liquidado';

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-[#132034]/60 border border-[#1C2C42] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-600 transition-colors"
                    >
                      <div className="space-y-1.5">
                        {/* Status Tag */}
                        <div>
                          {isAwaiting && (
                            <span className="inline-block rounded-md bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
                              A aguardar pagamento
                            </span>
                          )}
                          {isProofSent && (
                            <span className="inline-block rounded-md bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-sky-400">
                              Comprovativo enviado
                            </span>
                          )}
                          {isDispute && (
                            <span className="inline-block rounded-md bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-rose-400">
                              Em disputa
                            </span>
                          )}
                          {isLiquidated && (
                            <span className="inline-block rounded-md bg-[#A3E635]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#A3E635]">
                              Liquidado
                            </span>
                          )}
                        </div>

                        {/* Title & subtitle */}
                        <div className="flex items-center gap-2">
                          <div className="flex size-7 items-center justify-center rounded-lg bg-[#1E2D44] text-[11px] font-bold text-white">
                            {item.avatar}
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-semibold text-white">
                              {item.name}
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              {item.product} · {item.method}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Amount and actions */}
                      <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[#1C2C42]">
                        <div className="sm:text-right">
                          <span className="text-xs sm:text-sm font-mono font-bold text-white block">
                            {formatKz(item.amount)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.time}
                          </span>
                        </div>

                        {/* Direct action button if proof received */}
                        {isProofSent && (
                          <button
                            onClick={() => setSelectedProof(item)}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#A3E635] text-[#0B131F] px-2.5 py-1 text-[11px] font-bold hover:opacity-90 shadow-sm cursor-pointer"
                          >
                            <FileText className="size-3" />
                            <span>Validar</span>
                          </button>
                        )}

                        {isDispute && (
                          <button
                            onClick={() => setIsDisputeModalOpen(true)}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 text-[11px] font-semibold hover:bg-rose-500/30 cursor-pointer"
                          >
                            <AlertCircle className="size-3" />
                            <span>Disputa</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: CONFIRMAR ===================== */}
        {activeTab === 'confirmar' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="rounded-3xl border border-[#1E2D44] bg-[#111C2D] p-5 sm:p-6 space-y-4 shadow-xl">
              <div>
                <h2 className="text-base sm:text-lg font-bold font-display text-white">
                  Validação de Comprovativos Bancários
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Confirme o crédito em conta antes de autorizar a libertação de fundos em custódia.
                </p>
              </div>

              {pendingCount === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#1E2D44] p-8 text-center space-y-2">
                  <CheckCircle2 className="size-8 text-[#A3E635] mx-auto" />
                  <p className="font-semibold text-sm text-white">Tudo validado!</p>
                  <p className="text-xs text-slate-400">Não existem comprovativos pendentes no momento.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities
                    .filter((a) => a.status === 'comprovativo')
                    .map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-[#A3E635]/40 bg-[#132034]/70 p-4 space-y-3 shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-[#A3E635]/20 text-[#A3E635] font-bold text-xs">
                              {item.avatar}
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#A3E635]">Comprovativo Recebido</span>
                              <h4 className="font-bold text-sm text-white">{item.name}</h4>
                            </div>
                          </div>
                          <span className="font-mono text-base font-bold text-white">
                            {formatKz(item.amount)}
                          </span>
                        </div>

                        <div className="rounded-xl bg-[#0B131F] p-3 text-xs space-y-1.5 font-mono border border-[#1C2C42]">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Banco:</span>
                            <span className="text-white">{item.bankName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Referência:</span>
                            <span className="text-white font-bold">{item.refCode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Remetente:</span>
                            <span className="text-white truncate max-w-[180px]">{item.senderIban}</span>
                          </div>
                          <div className="flex justify-between border-t border-[#1C2C42] pt-1">
                            <span className="text-slate-400">Sua Comissão (+{offerTaxRate}%):</span>
                            <span className="text-[#A3E635] font-bold">
                              +{formatKz(Math.round(item.amount * (offerTaxRate / 100)))}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => setSelectedProof(item)}
                            className="py-2.5 rounded-xl border border-[#1E2D44] bg-[#132034] text-xs font-semibold text-white hover:bg-[#1C2C42]"
                          >
                            Ver Recibo
                          </button>
                          <button
                            onClick={() => handleConfirmProof(item)}
                            className="py-2.5 rounded-xl bg-[#A3E635] text-[#0B131F] text-xs font-bold hover:opacity-95 shadow-md flex items-center justify-center gap-1.5"
                          >
                            <Check className="size-4" />
                            <span>Confirmar e Libertar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 3: OFERTA (EXACT REPLICA OF IMAGE 5) ===================== */}
        {activeTab === 'oferta' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Card: Configuração de oferta e taxas */}
            <div className="rounded-3xl border border-[#1E2D44] bg-[#111C2D] p-5 sm:p-6 space-y-5 shadow-xl">
              <div>
                <h1 className="text-base sm:text-lg font-bold font-display text-white">
                  Configuração de oferta e taxas
                </h1>
              </div>

              {/* Taxa aplicada + Slider */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-medium text-slate-300">
                    Taxa aplicada
                  </label>
                  <span className="text-sm font-bold text-[#A3E635] font-mono">
                    {offerTaxRate.toFixed(2)}%
                  </span>
                </div>

                {/* Custom Styled Slider with Lime Track */}
                <div className="relative flex items-center py-1">
                  <input
                    type="range"
                    min="0.20"
                    max="3.00"
                    step="0.05"
                    value={offerTaxRate}
                    onChange={(e) => setOfferTaxRate(parseFloat(e.target.value))}
                    className="w-full h-2 bg-[#1E2D44] rounded-lg appearance-none cursor-pointer accent-[#A3E635]"
                  />
                </div>
              </div>

              {/* Inputs: Mínimo por operação (Kz) and Máximo por operação (Kz) */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Mínimo por operação (Kz)
                  </label>
                  <input
                    type="number"
                    value={minPerOp}
                    onChange={(e) => setMinPerOp(e.target.value)}
                    className="w-full rounded-2xl border border-[#1E2D44] bg-[#111C2D] px-4 py-3 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-[#A3E635]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Máximo por operação (Kz)
                  </label>
                  <input
                    type="number"
                    value={maxPerOp}
                    onChange={(e) => setMaxPerOp(e.target.value)}
                    className="w-full rounded-2xl border border-[#1E2D44] bg-[#111C2D] px-4 py-3 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-[#A3E635]"
                  />
                </div>
              </div>

              {/* Janela de pagamento do cliente (mínimo 5 minutos) */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-medium text-slate-300">
                  Janela de pagamento do cliente (mínimo 5 minutos)
                </label>
                <div className="flex flex-wrap gap-2">
                  {['5 min', '10 min', '15 min', '20 min', '30 min', '45 min', '60 min'].map((time) => {
                    const isSelected = paymentWindow === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setPaymentWindow(time)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isSelected
                            ? 'border border-[#A3E635] text-[#A3E635] bg-[#A3E635]/10'
                            : 'border border-[#1E2D44] bg-[#111C2D] text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  Depois da janela, o cliente tem sempre no mínimo 5 minutos para enviar o comprovativo.
                </p>
              </div>

              {/* MÉTODOS ACEITES */}
              <div className="space-y-3 pt-2">
                <span className="block text-xs font-semibold text-slate-400 tracking-wider uppercase">
                  MÉTODOS ACEITES
                </span>

                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                  {/* Multicaixa Express */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={methods.multicaixaExpress}
                      onChange={() => toggleMethod('multicaixaExpress')}
                      className="size-4 rounded border-[#1E2D44] bg-[#132034] text-[#A3E635] accent-[#A3E635] focus:ring-0"
                    />
                    <span className="text-white">Multicaixa Express</span>
                  </label>

                  {/* Transferência bancária */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={methods.transferenciaBancaria}
                      onChange={() => toggleMethod('transferenciaBancaria')}
                      className="size-4 rounded border-[#1E2D44] bg-[#132034] text-[#A3E635] accent-[#A3E635] focus:ring-0"
                    />
                    <span className="text-white">Transferência bancária</span>
                  </label>

                  {/* Referência */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={methods.referencia}
                      onChange={() => toggleMethod('referencia')}
                      className="size-4 rounded border-[#1E2D44] bg-[#132034] text-[#A3E635] accent-[#A3E635] focus:ring-0"
                    />
                    <span className="text-slate-300">Referência</span>
                  </label>

                  {/* UNITEL Money */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={methods.unitelMoney}
                      onChange={() => toggleMethod('unitelMoney')}
                      className="size-4 rounded border-[#1E2D44] bg-[#132034] text-[#A3E635] accent-[#A3E635] focus:ring-0"
                    />
                    <span className="text-slate-300">UNITEL Money</span>
                  </label>

                  {/* Depósito em numerário */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={methods.depositoNumerario}
                      onChange={() => toggleMethod('depositoNumerario')}
                      className="size-4 rounded border-[#1E2D44] bg-[#132034] text-[#A3E635] accent-[#A3E635] focus:ring-0"
                    />
                    <span className="text-slate-300">Depósito em numerário</span>
                  </label>

                  {/* USDT (TRC20) */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={methods.usdt}
                      onChange={() => toggleMethod('usdt')}
                      className="size-4 rounded border-[#1E2D44] bg-[#132034] text-[#A3E635] accent-[#A3E635] focus:ring-0"
                    />
                    <span className="text-slate-300">USDT (TRC20)</span>
                  </label>
                </div>

                {/* Pausar ofertas checkbox */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={pauseOffersCheck}
                      onChange={(e) => setPauseOffersCheck(e.target.checked)}
                      className="size-4 rounded border-[#1E2D44] bg-[#132034] text-[#A3E635] accent-[#A3E635] focus:ring-0"
                    />
                    <span className="text-xs text-white">
                      Pausar ofertas (não receber novas negociações)
                    </span>
                  </label>
                </div>
              </div>

              {/* Guardar oferta Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => showToast('Oferta guardada e atualizada no mercado com sucesso!')}
                  className="w-full py-3.5 rounded-2xl bg-[#A3E635] text-[#0B131F] font-bold text-sm hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-lg"
                >
                  Guardar oferta
                </button>
              </div>

              {/* Footnote */}
              <p className="text-xs text-slate-400">
                Pré-visualização no mercado: <strong className="text-white">{offerTaxRate.toFixed(2)}%</strong> · {formatKz(parseInt(minPerOp) || 5000)} – {formatKz(parseInt(maxPerOp) || 4500000)} · online.
              </p>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: GANHOS ===================== */}
        {activeTab === 'ganhos' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="rounded-3xl border border-[#1E2D44] bg-[#111C2D] p-5 sm:p-6 space-y-4 shadow-xl">
              <div>
                <h2 className="text-base sm:text-lg font-bold font-display text-white">
                  Comissões e Ganhos do LP
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Resumo de remuneração pelas liquidações e provisão de liquidez no KwanzaPay.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-4 rounded-2xl bg-[#132034] border border-[#1E2D44]">
                  <span className="text-[11px] text-slate-400 block uppercase">Este Mês</span>
                  <p className="text-xl font-bold font-mono text-[#A3E635] mt-1">
                    {formatKz(monthlyCommission)}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#132034] border border-[#1E2D44]">
                  <span className="text-[11px] text-slate-400 block uppercase">Total Histórico</span>
                  <p className="text-xl font-bold font-mono text-white mt-1">
                    2 420 000 Kz
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-[#132034] border border-[#1E2D44] p-4 text-xs space-y-2">
                <span className="font-bold text-white block">Levantamento Automático</span>
                <p className="text-slate-400">
                  Os valores de comissão são creditados no seu IBAN verificado ao final de cada ciclo semanal sem taxas adicionais.
                </p>
                <div className="rounded-xl bg-[#0B131F] p-2.5 font-mono text-[11px] text-slate-300">
                  IBAN: AO06 0040 0000 8192 3840 1014 9 (BAI)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 5: MAIS (EXACT REPLICA OF IMAGE 4) ===================== */}
        {activeTab === 'mais' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Card 1: Concorrência no mercado */}
            <div className="rounded-3xl border border-[#1E2D44] bg-[#111C2D] p-5 sm:p-6 space-y-4 shadow-xl">
              <div>
                <h2 className="text-base sm:text-lg font-bold font-display text-white">
                  Concorrência no mercado
                </h2>
              </div>

              {/* 4 Competitor Cards matching Image 4 */}
              <div className="space-y-3 pt-1">
                {/* 1. LP Atlântico */}
                <div className="p-4 rounded-2xl border border-[#1E2D44] bg-[#132034]/70 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-sm text-white">
                      LP Atlântico
                    </h3>
                    <p className="text-xs text-slate-400">
                      5 000 Kz – 4 500 000 Kz · 15 min
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#A3E635] block font-mono">
                      1.20%
                    </span>
                    <span className="text-xs text-slate-400">
                      4.9 ★ (1284)
                    </span>
                  </div>
                </div>

                {/* 2. LP Kalunga */}
                <div className="p-4 rounded-2xl border border-[#1E2D44] bg-[#132034]/70 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-sm text-white">
                      LP Kalunga
                    </h3>
                    <p className="text-xs text-slate-400">
                      10 000 Kz – 2 000 000 Kz · 20 min
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#A3E635] block font-mono">
                      0.90%
                    </span>
                    <span className="text-xs text-slate-400">
                      4.7 ★ (862)
                    </span>
                  </div>
                </div>

                {/* 3. LP Bengo */}
                <div className="p-4 rounded-2xl border border-[#1E2D44] bg-[#132034]/70 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-sm text-white">
                      LP Bengo
                    </h3>
                    <p className="text-xs text-slate-400">
                      5 000 Kz – 800 000 Kz · 30 min
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#A3E635] block font-mono">
                      0.70%
                    </span>
                    <span className="text-xs text-slate-400">
                      4.4 ★ (341)
                    </span>
                  </div>
                </div>

                {/* 4. LP Cabinda */}
                <div className="p-4 rounded-2xl border border-[#1E2D44] bg-[#132034]/70 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-sm text-white">
                      LP Cabinda
                    </h3>
                    <p className="text-xs text-slate-400">
                      5 000 Kz – 300 000 Kz · 25 min
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#A3E635] block font-mono">
                      0.60%
                    </span>
                    <span className="text-xs text-slate-400">
                      4.1 ★ (128)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Regras do LP */}
            <div className="rounded-3xl border border-[#1E2D44] bg-[#111C2D] p-5 sm:p-6 space-y-3 shadow-xl">
              <div>
                <h2 className="text-base sm:text-lg font-bold font-display text-white">
                  Regras do LP
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                Regras completas do que o LP pode e não pode fazer em{' '}
                <button
                  type="button"
                  onClick={() => setIsTermsModalOpen(true)}
                  className="text-[#A3E635] font-semibold underline hover:opacity-90 cursor-pointer"
                >
                  Termos e regras
                </button>
                .
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ===================== BOTTOM NAVIGATION BAR ===================== */}
      {/* Exact replica of the bottom navigation bar seen across screenshots 3, 4, 5 */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B131F]/95 backdrop-blur border-t border-[#1E2D44] px-4 py-2">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          {/* Início Tab (Home Icon) */}
          <button
            onClick={() => setActiveTab('inicio')}
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
              activeTab === 'inicio' ? 'text-[#A3E635]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === 'inicio' ? 'bg-[#A3E635]/15' : ''}`}>
              <Home className="size-5" />
            </div>
            <span className="text-[11px] font-semibold">Início</span>
          </button>

          {/* Confirmar Tab (Checkmark in circle) */}
          <button
            onClick={() => setActiveTab('confirmar')}
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
              activeTab === 'confirmar' ? 'text-[#A3E635]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === 'confirmar' ? 'bg-[#A3E635]/15' : ''}`}>
              <CheckCircle className="size-5" />
            </div>
            <span className="text-[11px] font-semibold">Confirmar</span>
          </button>

          {/* Oferta Tab (Sliders icon) */}
          <button
            onClick={() => setActiveTab('oferta')}
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
              activeTab === 'oferta' ? 'text-[#A3E635]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-full ${activeTab === 'oferta' ? 'bg-[#A3E635] text-[#0B131F]' : ''}`}>
              <SlidersHorizontal className="size-4.5 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-semibold">Oferta</span>
          </button>

          {/* Ganhos Tab (Coins / Trending icon) */}
          <button
            onClick={() => setActiveTab('ganhos')}
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
              activeTab === 'ganhos' ? 'text-[#A3E635]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === 'ganhos' ? 'bg-[#A3E635]/15' : ''}`}>
              <Coins className="size-5" />
            </div>
            <span className="text-[11px] font-semibold">Ganhos</span>
          </button>

          {/* Mais Tab (More horizontal dots in circle) */}
          <button
            onClick={() => setActiveTab('mais')}
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
              activeTab === 'mais' ? 'text-[#A3E635]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-full ${activeTab === 'mais' ? 'bg-[#A3E635] text-[#0B131F]' : ''}`}>
              <MoreHorizontal className="size-4.5 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-semibold">Mais</span>
          </button>
        </div>
      </nav>

      {/* MODAL: VALIDAR COMPROVATIVO BANCÁRIO */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#111C2D] border border-[#1E2D44] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2D44] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-[#A3E635]" />
                <h3 className="font-display font-bold text-base text-white">
                  Comprovativo de Transferência
                </h3>
              </div>
              <button
                onClick={() => setSelectedProof(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#132034]"
              >
                <X className="size-4.5" />
              </button>
            </div>

            {/* Receipt details */}
            <div className="rounded-2xl border border-[#1E2D44] bg-[#132034]/70 p-4 space-y-3 font-mono text-xs">
              <div className="text-center border-b border-[#1E2D44] pb-2">
                <span className="font-bold text-sm text-white block">
                  BANCO ANGOLANO DE INVESTIMENTOS
                </span>
                <span className="text-[11px] text-slate-400">
                  Comprovativo de Transferência EMIS
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Operação:</span>
                  <span className="font-bold text-white">{selectedProof.refCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Remetente:</span>
                  <span className="text-white">{selectedProof.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Conta Origem:</span>
                  <span className="text-white truncate max-w-[180px]">{selectedProof.senderIban}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Beneficiário:</span>
                  <span className="text-white">Evaristo Paulo Cassoma</span>
                </div>
                <div className="flex justify-between border-t border-[#1E2D44] pt-2">
                  <span className="text-slate-400">Montante Creditado:</span>
                  <span className="text-base font-extrabold text-[#A3E635] font-mono">
                    {formatKz(selectedProof.amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedProof(null)}
                className="py-3 rounded-xl border border-[#1E2D44] text-xs font-semibold text-slate-300 hover:bg-[#132034]"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => handleConfirmProof(selectedProof)}
                className="py-3 rounded-xl bg-[#A3E635] text-[#0B131F] text-xs font-bold hover:opacity-95 shadow-lg flex items-center justify-center gap-1.5"
              >
                <Check className="size-4" />
                <span>Confirmar e Libertar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DISPUTA */}
      {isDisputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#111C2D] border border-[#1E2D44] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2D44] pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-5 text-rose-400" />
                <h3 className="font-display font-bold text-base text-white">
                  Mediação de Disputa
                </h3>
              </div>
              <button
                onClick={() => setIsDisputeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#132034]"
              >
                <X className="size-4.5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Operação de <strong className="text-white">89 000 Kz</strong> via UNITEL Money com a <strong className="text-white">Farmácia Bita</strong>.
              </p>
              <div className="rounded-xl bg-[#132034] p-3 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Referência:</span>
                  <span className="text-white">UTM-003912</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estado:</span>
                  <span className="text-amber-400">A aguardar extrato da operadora</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Os fundos encontram-se bloqueados em garantia até confirmação técnica da operadora.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsDisputeModalOpen(false)}
              className="w-full py-3 rounded-xl bg-[#132034] text-white text-xs font-semibold hover:bg-[#1A2C46]"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: TERMOS E REGRAS */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#111C2D] border border-[#1E2D44] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2D44] pb-3">
              <h3 className="font-display font-bold text-base text-white">
                Regras e Termos do Provedor (LP)
              </h3>
              <button
                onClick={() => setIsTermsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#132034]"
              >
                <X className="size-4.5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 max-h-72 overflow-y-auto pr-1">
              <p><strong>1. Janela de Liquidação:</strong> O LP compromete-se a libertar o valor em Kwanza em menos de 10 minutos após validação do comprovativo legítimo.</p>
              <p><strong>2. Proteção de Custódia:</strong> Todas as ordens são garantidas pelo contrato de garantia (Escrow) KwanzaPay em conformidade com as normas do BNA.</p>
              <p><strong>3. Taxas e Concorrência:</strong> As taxas de mercado são livres, cabendo ao LP estabelecer spreads justos e competitivos.</p>
              <p><strong>4. Cancelamento e Fraude:</strong> Qualquer tentativa de envio de comprovativo falso acarreta bloqueio imediato do NIF e da conta.</p>
            </div>

            <button
              type="button"
              onClick={() => setIsTermsModalOpen(false)}
              className="w-full py-3 rounded-xl bg-[#A3E635] text-[#0B131F] text-xs font-bold hover:opacity-95"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
