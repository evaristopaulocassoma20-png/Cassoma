import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Bell, 
  LogOut, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowLeftRight, 
  Home, 
  Store, 
  MoreHorizontal, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Copy, 
  Check, 
  Send, 
  ShieldCheck, 
  Key, 
  Lock, 
  User, 
  Settings, 
  HelpCircle,
  CreditCard,
  Plus,
  RefreshCw,
  X
} from 'lucide-react';
import { AccountRole } from './LoginPage';

interface LojaWalletDashboardProps {
  userEmail: string;
  onLogout: () => void;
  onBackToSite: () => void;
  onChangeRole: (newRole: AccountRole) => void;
}

export type LojaTab = 'inicio' | 'adicionar' | 'retirar' | 'caixa' | 'mais';

interface TransactionItem {
  id: string;
  title: string;
  ref: string;
  method: string;
  amount: number;
  time: string;
  status: 'pendente' | 'confirmado';
  statusLabel: string;
}

export const LojaWalletDashboard: React.FC<LojaWalletDashboardProps> = ({
  userEmail,
  onLogout,
  onBackToSite,
  onChangeRole,
}) => {
  const [activeTab, setActiveTab] = useState<LojaTab>('inicio');
  const [showBalance, setShowBalance] = useState(true);
  const [balance, setBalance] = useState(2845000);
  const [inSettlement, setInSettlement] = useState(410500);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals inside "Mais"
  const [activeSubModal, setActiveSubModal] = useState<string | null>(null);

  // Form states for deposit and withdraw
  const [depositAmount, setDepositAmount] = useState('50000');
  const [depositMethod, setDepositMethod] = useState<'express' | 'referencia'>('express');
  const [withdrawAmount, setWithdrawAmount] = useState('100000');
  const [withdrawIban, setWithdrawIban] = useState('AO06 0040 0000 8192 3840 1014 9');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Quick POS / Caixa charge
  const [chargeAmount, setChargeAmount] = useState('15000');
  const [chargePhone, setChargePhone] = useState('+244 923 000 111');
  const [chargeSuccess, setChargeSuccess] = useState(false);

  // Webhook ping
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'testing' | 'success'>('idle');

  // Transactions list
  const [transactions, setTransactions] = useState<TransactionItem[]>([
    {
      id: 'tx_01',
      title: 'Venda Online - Checkout Loja',
      ref: '#MCX-9941',
      method: 'Multicaixa Express',
      amount: 125000,
      time: 'há 6 min',
      status: 'pendente',
      statusLabel: 'Pendente',
    },
    {
      id: 'tx_02',
      title: 'Fatura #2024-089',
      ref: '#REF-001882',
      method: 'Pagamento por Referência EMIS',
      amount: 240000,
      time: 'há 35 min',
      status: 'confirmado',
      statusLabel: 'Confirmado',
    },
    {
      id: 'tx_03',
      title: 'Recarga de Saldo Comercial',
      ref: '#UTM-7712',
      method: 'UNITEL Money',
      amount: 45500,
      time: 'há 2 h',
      status: 'confirmado',
      statusLabel: 'Confirmado',
    },
  ]);

  const formatKz = (num: number) => {
    return new Intl.NumberFormat('pt-AO').format(num) + ' Kz';
  };

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestWebhook = () => {
    setWebhookStatus('testing');
    setTimeout(() => {
      setWebhookStatus('success');
      setTimeout(() => setWebhookStatus('idle'), 3000);
    }, 800);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(depositAmount) || 50000;
    setBalance((prev) => prev + val);
    setTransactions([
      {
        id: `tx_${Date.now()}`,
        title: 'Depósito de Liquidez',
        ref: depositMethod === 'express' ? '#MCX-DEP' : '#REF-DEP',
        method: depositMethod === 'express' ? 'Multicaixa Express' : 'Referência EMIS',
        amount: val,
        time: 'Agora mesmo',
        status: 'confirmado',
        statusLabel: 'Confirmado',
      },
      ...transactions,
    ]);
    setActiveTab('inicio');
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(withdrawAmount) || 100000;
    if (val > balance) return;
    setBalance((prev) => prev - val);
    setWithdrawSuccess(true);
    setTimeout(() => {
      setWithdrawSuccess(false);
      setActiveTab('inicio');
    }, 1500);
  };

  const handleCreateCharge = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(chargeAmount) || 15000;
    setTransactions([
      {
        id: `tx_${Date.now()}`,
        title: 'Cobrança Terminal Caixa',
        ref: '#CAIXA-' + Math.floor(1000 + Math.random() * 9000),
        method: 'Multicaixa Express',
        amount: val,
        time: 'Agora mesmo',
        status: 'pendente',
        statusLabel: 'Pendente',
      },
      ...transactions,
    ]);
    setChargeSuccess(true);
    setTimeout(() => {
      setChargeSuccess(false);
      setActiveTab('inicio');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0B131F] text-slate-100 flex flex-col font-sans selection:bg-[#A3E635] selection:text-[#0B131F]">
      {/* Top Header - Exact replica of 2.png */}
      <header className="sticky top-0 z-40 bg-[#0B131F]/90 backdrop-blur border-b border-[#1A2638] px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Left: Avatar 'E' + Balance Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Avatar with lime background and dark text */}
          <div className="flex size-10 items-center justify-center rounded-full bg-[#A3E635] text-[#0B131F] font-display font-bold text-base shadow-sm">
            E
          </div>

          {/* Balance Pill */}
          <div className="rounded-full bg-[#132034] border border-[#1E2E47] px-3.5 py-1.5 text-xs sm:text-sm font-bold font-mono text-white shadow-inner">
            {showBalance ? '2 845 000 Kz' : '•••••••• Kz'}
          </div>
        </div>

        {/* Right side controls: Eye, Bell, Exit */}
        <div className="flex items-center gap-2">
          {/* Quick back to site button for convenience */}
          <button
            onClick={onBackToSite}
            className="hidden md:inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-full border border-[#1E2E47] bg-[#132034] transition-colors mr-1"
          >
            <ArrowLeft className="size-3" />
            <span>Site</span>
          </button>

          {/* Toggle Role */}
          <div className="hidden lg:flex items-center gap-1 text-xs text-slate-400 mr-2">
            <span className="text-[11px] uppercase tracking-wider">Papel:</span>
            <select
              value="loja"
              onChange={(e) => onChangeRole(e.target.value as AccountRole)}
              className="rounded-lg border border-[#1E2E47] bg-[#132034] px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#A3E635]"
            >
              <option value="loja">Loja</option>
              <option value="provedor">Provedor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Eye Icon (Toggle visibility) */}
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="flex size-10 items-center justify-center rounded-full bg-[#132034] border border-[#1E2E47] text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            title={showBalance ? 'Ocultar saldo' : 'Mostrar saldo'}
          >
            {showBalance ? <Eye className="size-4.5" /> : <EyeOff className="size-4.5" />}
          </button>

          {/* Bell Icon (Notifications) */}
          <div className="relative">
            <button
              onClick={() => setActiveSubModal('notificacoes')}
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

      {/* Main Content Area - padded to avoid bottom navigation bar */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-5 pb-24 space-y-5">
        
        {/* ===================== TAB 1: INÍCIO (IMAGE 2) ===================== */}
        {activeTab === 'inicio' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* HERO CARD: Saldo KwanzaPay */}
            <div className="rounded-3xl border border-[#1E2D44] bg-[#111C2D] p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-4">
              {/* Subtle radial glow in top right */}
              <div className="absolute top-0 right-0 -mr-12 -mt-12 size-48 rounded-full bg-[#A3E635]/10 blur-3xl pointer-events-none" />

              {/* Header inside card */}
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-slate-400 font-medium">
                  Saldo KwanzaPay
                </span>
                <div className="flex items-center gap-1 font-display text-base sm:text-lg font-bold">
                  <span className="text-white">Kwanza</span>
                  <span className="text-[#A3E635]">Pay</span>
                </div>
              </div>

              {/* Big Balance Amount */}
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
                  {showBalance ? '2 845 000 Kz' : '•••••••• Kz'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">
                  ≈ ≈ 3 050 USD · disponível para levantamento
                </p>
              </div>

              {/* Lime Badge */}
              <div className="pt-1">
                <span className="inline-block rounded-full bg-[#A3E635] px-3 py-1 text-xs font-bold text-[#0B131F]">
                  Bónus de boas-vindas: 5 000 Kz em taxas
                </span>
              </div>

              {/* Footer Account Identity */}
              <div className="pt-2 text-xs text-slate-400 font-medium border-t border-[#1C2C42]">
                Evaristopaulocassoma2352 · Cliente / Loja
              </div>
            </div>

            {/* 3 Circular Action Buttons: Adicionar, Retirar, Converter */}
            <div className="grid grid-cols-3 gap-2 py-2">
              {/* Adicionar */}
              <button
                onClick={() => setActiveTab('adicionar')}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-[#132034] border border-[#20324D] group-hover:border-[#A3E635] text-white transition-all shadow-md group-active:scale-95">
                  <ArrowDownToLine className="size-6" />
                </div>
                <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                  Adicionar
                </span>
              </button>

              {/* Retirar */}
              <button
                onClick={() => setActiveTab('retirar')}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-[#132034] border border-[#20324D] group-hover:border-[#A3E635] text-white transition-all shadow-md group-active:scale-95">
                  <ArrowUpFromLine className="size-6" />
                </div>
                <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                  Retirar
                </span>
              </button>

              {/* Converter */}
              <button
                onClick={() => setActiveSubModal('converter')}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="flex size-14 items-center justify-center rounded-full bg-[#132034] border border-[#20324D] group-hover:border-[#A3E635] text-white transition-all shadow-md group-active:scale-95">
                  <ArrowLeftRight className="size-6" />
                </div>
                <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                  Converter
                </span>
              </button>
            </div>

            {/* 3 Stats / KPI Cards */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {/* Card 1: EM LIQUIDAÇÃO */}
              <div className="rounded-2xl border border-[#1E2D44] bg-[#111C2D] p-3.5 sm:p-4 space-y-1">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  EM LIQUIDAÇÃO
                </span>
                <p className="text-sm sm:text-base font-bold font-display text-white truncate">
                  410 500 Kz
                </p>
              </div>

              {/* Card 2: NEGOCIAÇÕES */}
              <div className="rounded-2xl border border-[#1E2D44] bg-[#111C2D] p-3.5 sm:p-4 space-y-1">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  NEGOCIAÇÕES
                </span>
                <p className="text-sm sm:text-base font-bold font-display text-white">
                  3 abertas
                </p>
              </div>

              {/* Card 3: SUCESSO 7 DIAS */}
              <div className="rounded-2xl border border-[#1E2D44] bg-[#111C2D] p-3.5 sm:p-4 space-y-1">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                  SUCESSO 7 DIAS
                </span>
                <p className="text-sm sm:text-base font-bold font-display text-white">
                  96,4%
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
                  onClick={() => setActiveSubModal('todas_transacoes')}
                  className="text-xs font-semibold text-[#A3E635] hover:underline"
                >
                  Ver tudo
                </button>
              </div>

              {/* Transaction list */}
              <div className="space-y-2.5 pt-1">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl bg-[#132034]/60 border border-[#1C2C42] flex items-center justify-between gap-3 hover:border-slate-600 transition-colors"
                  >
                    <div className="space-y-1">
                      {/* Status Tag */}
                      <div>
                        {tx.status === 'pendente' ? (
                          <span className="inline-block rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
                            Pendente
                          </span>
                        ) : (
                          <span className="inline-block rounded-md bg-[#A3E635]/20 px-2 py-0.5 text-[11px] font-semibold text-[#A3E635]">
                            Confirmado
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-white">
                        {tx.title}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {tx.method} · {tx.ref}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-mono font-bold text-white block">
                        {formatKz(tx.amount)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {tx.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: ADICIONAR ===================== */}
        {activeTab === 'adicionar' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="rounded-3xl border border-[#1E2D44] bg-[#111C2D] p-5 sm:p-6 space-y-5 shadow-xl">
              <div>
                <h2 className="text-lg font-bold font-display text-white">
                  Adicionar Saldo à Conta Loja
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Carregue fundos para liquidar taxas ou pagar fornecedores instantaneamente em Angola.
                </p>
              </div>

              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Montante a Adicionar (Kz)
                  </label>
                  <input
                    type="number"
                    required
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full rounded-xl border border-[#1E2D44] bg-[#132034] px-4 py-3 text-base font-mono text-white focus:outline-none focus:ring-2 focus:ring-[#A3E635]"
                    placeholder="Ex: 50000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Método de Pagamento
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setDepositMethod('express')}
                      className={`p-3 rounded-xl border text-left transition-colors ${
                        depositMethod === 'express'
                          ? 'border-[#A3E635] bg-[#A3E635]/10 text-white'
                          : 'border-[#1E2D44] bg-[#132034] text-slate-400'
                      }`}
                    >
                      <span className="font-bold block text-white">Multicaixa Express</span>
                      <span className="text-[10px] text-slate-400">GPO Notificação push</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDepositMethod('referencia')}
                      className={`p-3 rounded-xl border text-left transition-colors ${
                        depositMethod === 'referencia'
                          ? 'border-[#A3E635] bg-[#A3E635]/10 text-white'
                          : 'border-[#1E2D44] bg-[#132034] text-slate-400'
                      }`}
                    >
                      <span className="font-bold block text-white">Referência EMIS</span>
                      <span className="text-[10px] text-slate-400">Pagar em ATM / Multicaixa</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-[#132034] p-3 text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between text-white font-medium">
                    <span>Taxa de processamento:</span>
                    <span className="text-[#A3E635]">0 Kz (Grátis)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tempo de crédito:</span>
                    <span>Imediato (&lt; 30 segundos)</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#A3E635] text-[#0B131F] font-bold text-sm hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-lg"
                >
                  Gerar Pedido de Pagamento
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: RETIRAR ===================== */}
        {activeTab === 'retirar' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="rounded-3xl border border-[#1E2D44] bg-[#111C2D] p-5 sm:p-6 space-y-5 shadow-xl">
              <div>
                <h2 className="text-lg font-bold font-display text-white">
                  Retirar para Conta Bancária
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Transfira o seu saldo KwanzaPay para qualquer conta bancária em Angola (IBAN BNA).
                </p>
              </div>

              {withdrawSuccess ? (
                <div className="rounded-2xl bg-[#A3E635]/10 border border-[#A3E635]/40 p-6 text-center space-y-2">
                  <CheckCircle2 className="size-10 text-[#A3E635] mx-auto animate-bounce" />
                  <h3 className="font-bold text-base text-white">Pedido de Levantamento Enviado!</h3>
                  <p className="text-xs text-slate-300">
                    Os fundos serão creditados no seu IBAN dentro de minutos.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1.5 font-semibold">
                      <span>Montante a Retirar (Kz)</span>
                      <span className="text-slate-400">Disponível: {formatKz(balance)}</span>
                    </div>
                    <input
                      type="number"
                      required
                      max={balance}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full rounded-xl border border-[#1E2D44] bg-[#132034] px-4 py-3 text-base font-mono text-white focus:outline-none focus:ring-2 focus:ring-[#A3E635]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      IBAN do Beneficiário (Angola)
                    </label>
                    <input
                      type="text"
                      required
                      value={withdrawIban}
                      onChange={(e) => setWithdrawIban(e.target.value)}
                      className="w-full rounded-xl border border-[#1E2D44] bg-[#132034] px-4 py-3 text-xs sm:text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-[#A3E635]"
                    />
                  </div>

                  <div className="rounded-xl bg-[#132034] p-3 text-xs text-slate-400 space-y-1">
                    <div className="flex justify-between text-white font-medium">
                      <span>Titular:</span>
                      <span>Evaristo Paulo Cassoma</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Banco:</span>
                      <span>Banco Angolano de Investimentos (BAI)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de Saída:</span>
                      <span className="text-[#A3E635]">Isento (0 Kz)</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-[#A3E635] text-[#0B131F] font-bold text-sm hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-lg"
                  >
                    Confirmar Levantamento
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 4: CAIXA (TERMINAL DE VENDAS) ===================== */}
        {activeTab === 'caixa' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="rounded-3xl border border-[#1E2D44] bg-[#111C2D] p-5 sm:p-6 space-y-5 shadow-xl">
              <div>
                <h2 className="text-lg font-bold font-display text-white">
                  Terminal de Caixa KwanzaPay
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Cobre clientes no balcão ou envie pedidos de pagamento imediatos para o Multicaixa Express.
                </p>
              </div>

              {chargeSuccess ? (
                <div className="rounded-2xl bg-[#A3E635]/10 border border-[#A3E635]/40 p-6 text-center space-y-2">
                  <CheckCircle2 className="size-10 text-[#A3E635] mx-auto" />
                  <h3 className="font-bold text-base text-white">Cobrança Disparada!</h3>
                  <p className="text-xs text-slate-300">
                    A notificação foi enviada ao telemóvel do cliente.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreateCharge} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Valor a Cobrar (Kz)
                    </label>
                    <input
                      type="number"
                      required
                      value={chargeAmount}
                      onChange={(e) => setChargeAmount(e.target.value)}
                      className="w-full rounded-xl border border-[#1E2D44] bg-[#132034] px-4 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#A3E635]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Número do Cliente (Angola)
                    </label>
                    <input
                      type="text"
                      required
                      value={chargePhone}
                      onChange={(e) => setChargePhone(e.target.value)}
                      className="w-full rounded-xl border border-[#1E2D44] bg-[#132034] px-4 py-3 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-[#A3E635]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-[#A3E635] text-[#0B131F] font-bold text-sm hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer shadow-lg"
                  >
                    Enviar Pedido de Pagamento
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 5: MAIS (EXACT REPLICA OF IMAGE 1) ===================== */}
        {activeTab === 'mais' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header: Conta e definições */}
            <div className="rounded-3xl border border-[#1E2D44] bg-[#111C2D] p-5 sm:p-6 space-y-4 shadow-xl">
              <div>
                <h1 className="text-lg sm:text-xl font-bold font-display text-white">
                  Conta e definições
                </h1>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Passo 1 de 1 · Menu
                </p>
                {/* Horizontal lime line indicator exactly as in 1.png */}
                <div className="w-full h-1 bg-[#A3E635] rounded-full mt-2" />
              </div>

              {/* List of 6 Action Cards matching 1.png */}
              <div className="space-y-2.5 pt-2">
                {/* 1. Perfil */}
                <button
                  onClick={() => setActiveSubModal('perfil')}
                  className="w-full text-left rounded-2xl border border-[#1E2D44] bg-[#132034]/60 p-4 hover:bg-[#132034] hover:border-[#2D4468] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-sm text-white group-hover:text-[#A3E635] transition-colors">
                      Perfil
                    </h3>
                    <p className="text-xs text-slate-400">
                      Nome, contacto e dados da conta.
                    </p>
                  </div>
                  <ChevronRight className="size-4.5 text-slate-400 group-hover:text-white transition-colors" />
                </button>

                {/* 2. Verificação de conta (Nível 2) */}
                <button
                  onClick={() => setActiveSubModal('verificacao')}
                  className="w-full text-left rounded-2xl border border-[#1E2D44] bg-[#132034]/60 p-4 hover:bg-[#132034] hover:border-[#2D4468] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white group-hover:text-[#A3E635] transition-colors">
                        Verificação de conta
                      </h3>
                      <span className="rounded-full bg-[#1E2D44] border border-[#2D4468] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                        Nível 2
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Documento, morada e limites por nível.
                    </p>
                  </div>
                  <ChevronRight className="size-4.5 text-slate-400 group-hover:text-white transition-colors" />
                </button>

                {/* 3. Segurança */}
                <button
                  onClick={() => setActiveSubModal('seguranca')}
                  className="w-full text-left rounded-2xl border border-[#1E2D44] bg-[#132034]/60 p-4 hover:bg-[#132034] hover:border-[#2D4468] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-sm text-white group-hover:text-[#A3E635] transition-colors">
                      Segurança
                    </h3>
                    <p className="text-xs text-slate-400">
                      Palavra-passe, MFA e dispositivos ligados.
                    </p>
                  </div>
                  <ChevronRight className="size-4.5 text-slate-400 group-hover:text-white transition-colors" />
                </button>

                {/* 4. Conectividade e API */}
                <button
                  onClick={() => setActiveSubModal('api')}
                  className="w-full text-left rounded-2xl border border-[#1E2D44] bg-[#132034]/60 p-4 hover:bg-[#132034] hover:border-[#2D4468] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-sm text-white group-hover:text-[#A3E635] transition-colors">
                      Conectividade e API
                    </h3>
                    <p className="text-xs text-slate-400">
                      Chaves, cobranças e entregas de webhook.
                    </p>
                  </div>
                  <ChevronRight className="size-4.5 text-slate-400 group-hover:text-white transition-colors" />
                </button>

                {/* 5. Configurações */}
                <button
                  onClick={() => setActiveSubModal('configuracoes')}
                  className="w-full text-left rounded-2xl border border-[#1E2D44] bg-[#132034]/60 p-4 hover:bg-[#132034] hover:border-[#2D4468] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-sm text-white group-hover:text-[#A3E635] transition-colors">
                      Configurações
                    </h3>
                    <p className="text-xs text-slate-400">
                      Notificações, idioma e moeda.
                    </p>
                  </div>
                  <ChevronRight className="size-4.5 text-slate-400 group-hover:text-white transition-colors" />
                </button>

                {/* 6. Ajuda e regras */}
                <button
                  onClick={() => setActiveSubModal('ajuda')}
                  className="w-full text-left rounded-2xl border border-[#1E2D44] bg-[#132034]/60 p-4 hover:bg-[#132034] hover:border-[#2D4468] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-sm text-white group-hover:text-[#A3E635] transition-colors">
                      Ajuda e regras
                    </h3>
                    <p className="text-xs text-slate-400">
                      Termos, funcionamento e apoio.
                    </p>
                  </div>
                  <ChevronRight className="size-4.5 text-slate-400 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===================== BOTTOM NAVIGATION BAR ===================== */}
      {/* Exact replica of the bottom navigation bar seen across both screenshots */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B131F]/95 backdrop-blur border-t border-[#1E2D44] px-4 py-2">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          {/* Início Tab */}
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

          {/* Adicionar Tab */}
          <button
            onClick={() => setActiveTab('adicionar')}
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
              activeTab === 'adicionar' ? 'text-[#A3E635]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === 'adicionar' ? 'bg-[#A3E635]/15' : ''}`}>
              <ArrowDownToLine className="size-5" />
            </div>
            <span className="text-[11px] font-semibold">Adicionar</span>
          </button>

          {/* Retirar Tab */}
          <button
            onClick={() => setActiveTab('retirar')}
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
              activeTab === 'retirar' ? 'text-[#A3E635]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === 'retirar' ? 'bg-[#A3E635]/15' : ''}`}>
              <ArrowUpFromLine className="size-5" />
            </div>
            <span className="text-[11px] font-semibold">Retirar</span>
          </button>

          {/* Caixa Tab */}
          <button
            onClick={() => setActiveTab('caixa')}
            className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
              activeTab === 'caixa' ? 'text-[#A3E635]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-full ${activeTab === 'caixa' ? 'bg-[#A3E635]/15' : ''}`}>
              <Store className="size-5" />
            </div>
            <span className="text-[11px] font-semibold">Caixa</span>
          </button>

          {/* Mais Tab (Active in 1.png with lime green dot circle) */}
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

      {/* ===================== SUB MODALS FOR 'MAIS' & ACTIONS ===================== */}
      {activeSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#111C2D] border border-[#1E2D44] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E2D44] pb-3">
              <h3 className="font-display font-bold text-base text-white capitalize">
                {activeSubModal === 'api' && 'Conectividade e API'}
                {activeSubModal === 'perfil' && 'Perfil da Loja'}
                {activeSubModal === 'verificacao' && 'Verificação de Conta (Nível 2)'}
                {activeSubModal === 'seguranca' && 'Segurança & Credenciais'}
                {activeSubModal === 'configuracoes' && 'Configurações Globais'}
                {activeSubModal === 'ajuda' && 'Ajuda e Regras'}
                {activeSubModal === 'converter' && 'Conversor de Moedas'}
                {activeSubModal === 'todas_transacoes' && 'Todas as Transações'}
                {activeSubModal === 'notificacoes' && 'Notificações'}
              </h3>
              <button
                onClick={() => setActiveSubModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#132034]"
              >
                <X className="size-4.5" />
              </button>
            </div>

            {/* Content for API keys */}
            {activeSubModal === 'api' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-300">
                  Utilize estas chaves para integrar o gateway KwanzaPay no seu website ou aplicação.
                </p>

                <div className="space-y-3">
                  <div className="rounded-xl bg-[#132034] p-3 border border-[#1E2D44] flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Chave Pública</span>
                      <span className="font-mono text-white truncate block">kz_live_pub_88a910f2491b</span>
                    </div>
                    <button
                      onClick={() => handleCopy('kz_live_pub_88a910f2491b', 'pub')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E2D44]"
                    >
                      {copiedKey === 'pub' ? <Check className="size-4 text-[#A3E635]" /> : <Copy className="size-4" />}
                    </button>
                  </div>

                  <div className="rounded-xl bg-[#132034] p-3 border border-[#1E2D44] flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Webhook URL</span>
                      <span className="font-mono text-white truncate block">https://loja.ao/hooks/pay</span>
                    </div>
                    <button
                      onClick={() => handleCopy('https://loja.ao/hooks/pay', 'hook')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E2D44]"
                    >
                      {copiedKey === 'hook' ? <Check className="size-4 text-[#A3E635]" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleTestWebhook}
                  disabled={webhookStatus === 'testing'}
                  className="w-full py-2.5 rounded-xl border border-[#1E2D44] bg-[#132034] text-white hover:bg-[#1A2C46] font-semibold text-xs flex items-center justify-center gap-2"
                >
                  <Send className="size-3.5" />
                  <span>{webhookStatus === 'testing' ? 'A disparar...' : webhookStatus === 'success' ? 'Disparado (HTTP 200 OK)!' : 'Testar Webhook (Ping)'}</span>
                </button>
              </div>
            )}

            {/* Perfil Content */}
            {activeSubModal === 'perfil' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3 pb-3 border-b border-[#1E2D44]">
                  <div className="flex size-12 items-center justify-center rounded-full bg-[#A3E635] text-[#0B131F] font-bold text-lg">
                    E
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Evaristo Paulo Cassoma</h4>
                    <p className="text-slate-400">Cliente / Loja Credenciado</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-[#1A283C]">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-white font-mono">evaristopaulocassoma2352@gmail.com</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#1A283C]">
                    <span className="text-slate-400">País:</span>
                    <span className="text-white">Angola (Luanda)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#1A283C]">
                    <span className="text-slate-400">Estado da Conta:</span>
                    <span className="text-[#A3E635] font-semibold">Ativa e Verificada ✓</span>
                  </div>
                </div>
              </div>
            )}

            {/* Verificação Nível 2 */}
            {activeSubModal === 'verificacao' && (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl bg-[#A3E635]/10 border border-[#A3E635]/30 p-3 text-slate-200">
                  <span className="font-bold text-white block mb-1">Nível 2 Ativo</span>
                  Permite movimentações até 50.000.000 Kz/mês em liquidações instantâneas.
                </div>
                <div className="space-y-1.5 text-slate-300">
                  <p>✓ Bilhete de Identidade (B.I.) validado</p>
                  <p>✓ NIF Empresarial associado</p>
                  <p>✓ Comprovativo de morada aprovado</p>
                </div>
              </div>
            )}

            {/* Converter Moedas */}
            {activeSubModal === 'converter' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-400">Cotação oficial de referência BNA / Mercado.</p>
                <div className="rounded-xl bg-[#132034] p-4 border border-[#1E2D44] space-y-3">
                  <div className="flex justify-between items-center text-sm font-bold text-white">
                    <span>1 USD</span>
                    <span className="text-[#A3E635]">≈ 932 Kz</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-white">
                    <span>2 845 000 Kz</span>
                    <span>≈ 3 052,57 USD</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notificações */}
            {activeSubModal === 'notificacoes' && (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#132034] border border-[#1E2D44]">
                  <span className="text-[10px] text-[#A3E635] font-bold">Hoje às 12:00</span>
                  <p className="text-white font-medium mt-0.5">Bónus de 5 000 Kz creditado na sua conta!</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#132034] border border-[#1E2D44]">
                  <span className="text-[10px] text-slate-400 font-bold">Ontem</span>
                  <p className="text-white font-medium mt-0.5">Sua liquidação diária foi processada com sucesso.</p>
                </div>
              </div>
            )}

            {/* Close button for all */}
            <button
              onClick={() => setActiveSubModal(null)}
              className="w-full py-2.5 rounded-xl bg-[#132034] text-white hover:bg-[#1A2C46] text-xs font-semibold"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
