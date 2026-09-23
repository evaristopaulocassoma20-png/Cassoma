import React, { useState } from 'react';
import { 
  Building2, 
  Landmark, 
  Shield, 
  ArrowLeft, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Copy, 
  Check, 
  Plus, 
  RefreshCw, 
  Send, 
  ExternalLink,
  Zap,
  TrendingUp,
  CreditCard,
  Phone,
  Layers,
  Search,
  Filter
} from 'lucide-react';
import { AccountRole } from './LoginPage';

interface DashboardPageProps {
  role: AccountRole;
  userEmail: string;
  onLogout: () => void;
  onBackToSite: () => void;
  onChangeRole: (newRole: AccountRole) => void;
}

interface Transaction {
  id: string;
  reference: string;
  method: 'multicaixa_express' | 'referencia' | 'debito_direto' | 'unitel_money';
  methodLabel: string;
  amount: number;
  customerPhone: string;
  status: 'confirmed' | 'pending' | 'failed';
  timestamp: string;
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'chg_9f2k882a',
    reference: '001 882 441',
    method: 'multicaixa_express',
    methodLabel: 'Multicaixa Express',
    amount: 12500,
    customerPhone: '+244 923 456 789',
    status: 'confirmed',
    timestamp: 'Há 2 min',
  },
  {
    id: 'chg_4e1a09bc',
    reference: '001 882 440',
    method: 'referencia',
    methodLabel: 'Pagamento por Ref.',
    amount: 45000,
    customerPhone: '+244 945 112 334',
    status: 'confirmed',
    timestamp: 'Há 14 min',
  },
  {
    id: 'chg_7c3d44ff',
    reference: '001 882 439',
    method: 'unitel_money',
    methodLabel: 'UNITEL Money',
    amount: 8200,
    customerPhone: '+244 931 778 990',
    status: 'confirmed',
    timestamp: 'Há 32 min',
  },
  {
    id: 'chg_1a8b99ee',
    reference: '001 882 438',
    method: 'debito_direto',
    methodLabel: 'Débito Direto',
    amount: 150000,
    customerPhone: '+244 912 345 678',
    status: 'pending',
    timestamp: 'Há 50 min',
  },
  {
    id: 'chg_6f0e22dd',
    reference: '001 882 437',
    method: 'multicaixa_express',
    methodLabel: 'Multicaixa Express',
    amount: 25000,
    customerPhone: '+244 924 889 001',
    status: 'confirmed',
    timestamp: 'Há 1 hora',
  },
];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  role,
  userEmail,
  onLogout,
  onBackToSite,
  onChangeRole,
}) => {
  const [envMode, setEnvMode] = useState<'sandbox' | 'live'>('sandbox');
  const [activeTab, setActiveTab] = useState<'overview' | 'api' | 'ledger'>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'testing' | 'success'>('idle');

  // New quick charge state
  const [isNewChargeOpen, setIsNewChargeOpen] = useState(false);
  const [newAmount, setNewAmount] = useState('18500');
  const [newMethod, setNewMethod] = useState<'multicaixa_express' | 'referencia' | 'unitel_money'>('multicaixa_express');
  const [newPhone, setNewPhone] = useState('+244 923 111 222');

  // Provedor settlement states
  const [settledBatches, setSettledBatches] = useState<{ [key: string]: boolean }>({
    'LT-0914-A': false,
    'LT-0914-B': false,
  });

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestWebhook = () => {
    setWebhookStatus('testing');
    setTimeout(() => {
      setWebhookStatus('success');
      setTimeout(() => setWebhookStatus('idle'), 3500);
    }, 800);
  };

  const handleCreateCharge = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(newAmount) || 10000;
    const randomRef = '001 ' + Math.floor(100000 + Math.random() * 900000);
    const methodNames: Record<string, string> = {
      multicaixa_express: 'Multicaixa Express',
      referencia: 'Pagamento por Ref.',
      unitel_money: 'UNITEL Money',
    };

    const newTx: Transaction = {
      id: `chg_${Math.random().toString(36).substring(2, 9)}`,
      reference: randomRef,
      method: newMethod,
      methodLabel: methodNames[newMethod],
      amount: parsedAmount,
      customerPhone: newPhone,
      status: 'confirmed',
      timestamp: 'Agora mesmo',
    };

    setTransactions([newTx, ...transactions]);
    setIsNewChargeOpen(false);
  };

  const formatAOA = (num: number) => {
    return new Intl.NumberFormat('pt-AO').format(num) + ' AOA';
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={onBackToSite}
            className="flex items-center gap-1.5 font-display text-xl font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity"
            title="Voltar à página inicial da KwanzaPay"
          >
            <span>Kwanza</span>
            <span className="text-primary">Pay</span>
          </button>

          {/* Role badge */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs">
            {role === 'loja' && <Building2 className="size-3.5 text-primary" />}
            {role === 'provedor' && <Landmark className="size-3.5 text-primary" />}
            {role === 'admin' && <Shield className="size-3.5 text-primary" />}
            <span className="font-semibold text-foreground">
              {role === 'loja' ? 'Cliente / Loja' : role === 'provedor' ? 'Provedor de Liquidez' : 'Administrador'}
            </span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Environment toggle */}
          <div className="flex rounded-lg bg-secondary p-0.5 text-xs font-medium">
            <button
              onClick={() => setEnvMode('sandbox')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                envMode === 'sandbox' ? 'bg-card text-foreground shadow-sm font-semibold' : 'text-muted-foreground'
              }`}
            >
              Sandbox
            </button>
            <button
              onClick={() => setEnvMode('live')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                envMode === 'live' ? 'bg-primary text-primary-foreground shadow-sm font-semibold' : 'text-muted-foreground'
              }`}
            >
              Produção
            </button>
          </div>

          {/* Quick role switcher for demo convenience */}
          <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
            <span className="text-[11px] uppercase tracking-wider">Papel:</span>
            <select
              value={role}
              onChange={(e) => onChangeRole(e.target.value as AccountRole)}
              className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="loja">Loja</option>
              <option value="provedor">Provedor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Terminar sessão e voltar ao login"
          >
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Terminar sessão</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground uppercase">
                {envMode === 'sandbox' ? 'Ambiente de Testes (Sandbox)' : 'Ambiente Operacional (Live)'}
              </span>
              <span className="inline-block size-2 rounded-full bg-primary animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mt-1">
              {role === 'loja' && 'Painel de Cobranças da Loja'}
              {role === 'provedor' && 'Gestão de Reservas de Liquidez'}
              {role === 'admin' && 'Supervisão Global do Gateway'}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Autenticado como <strong className="text-foreground font-mono">{userEmail}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToSite}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>← Voltar ao site principal</span>
            </button>
            {role === 'loja' && (
              <button
                onClick={() => setIsNewChargeOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 shadow-sm transition-transform active:scale-[0.98]"
              >
                <Plus className="size-3.5" />
                <span>Simular Cobrança</span>
              </button>
            )}
          </div>
        </div>

        {/* ROLE 1: CLIENTE / LOJA */}
        {role === 'loja' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Saldo Disponível</span>
                <p className="text-2xl font-bold font-display text-foreground mt-1.5">
                  14.850.200 AOA
                </p>
                <span className="text-[11px] text-primary flex items-center gap-1 mt-1 font-medium">
                  <TrendingUp className="size-3" /> +1.250.000 AOA liquidado hoje
                </span>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Cobranças Hoje</span>
                <p className="text-2xl font-bold font-display text-foreground mt-1.5">
                  {transactions.length + 38} transações
                </p>
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  99,4% taxa de aprovação
                </span>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Tempo Médio de Confirmação</span>
                <p className="text-2xl font-bold font-display text-foreground mt-1.5">
                  210 ms
                </p>
                <span className="text-[11px] text-primary flex items-center gap-1 mt-1 font-medium">
                  <Zap className="size-3" /> SLA &lt; 300ms cumprido
                </span>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Estado do Webhook</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="size-2 rounded-full bg-primary" />
                  <p className="text-lg font-bold text-foreground">HTTP 200 OK</p>
                </div>
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  Último evento há 2 min
                </span>
              </div>
            </div>

            {/* Quick API Keys & Webhook Bar */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Credenciais & Webhooks da Loja</h3>
                  <p className="text-xs text-muted-foreground">Utilize estas chaves para autenticar chamadas HTTP à API KwanzaPay.</p>
                </div>
                <button
                  onClick={handleTestWebhook}
                  disabled={webhookStatus === 'testing'}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors w-fit"
                >
                  <Send className="size-3" />
                  <span>
                    {webhookStatus === 'testing' ? 'A disparar...' : webhookStatus === 'success' ? 'Disparado (200 OK)!' : 'Testar Webhook (Ping)'}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="rounded-xl bg-secondary/80 border border-border p-3 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Chave Pública (Live/Sandbox)</span>
                    <span className="text-xs font-mono text-foreground truncate block">kz_live_pub_88a910f2491b</span>
                  </div>
                  <button
                    onClick={() => handleCopy('kz_live_pub_88a910f2491b', 'pub')}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-colors shrink-0"
                    title="Copiar chave pública"
                  >
                    {copiedKey === 'pub' ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                  </button>
                </div>

                <div className="rounded-xl bg-secondary/80 border border-border p-3 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Webhook Endpoint</span>
                    <span className="text-xs font-mono text-foreground truncate block">https://loja.ao/hooks/pay</span>
                  </div>
                  <button
                    onClick={() => handleCopy('https://loja.ao/hooks/pay', 'hook')}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-colors shrink-0"
                    title="Copiar URL webhook"
                  >
                    {copiedKey === 'hook' ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-display text-foreground">Cobranças Recentes</h2>
                  <p className="text-xs text-muted-foreground">Transações em tempo real processadas via API KwanzaPay.</p>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {transactions.length} registos
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-secondary/50 text-muted-foreground uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Referência / ID</th>
                      <th className="py-3 px-4">Método</th>
                      <th className="py-3 px-4">Montante</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                          {tx.reference}
                          <span className="block text-[10px] text-muted-foreground">{tx.id}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                            <CreditCard className="size-3.5 text-primary" />
                            {tx.methodLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-foreground">
                          {formatAOA(tx.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground font-mono">
                          {tx.customerPhone}
                        </td>
                        <td className="py-3.5 px-4">
                          {tx.status === 'confirmed' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-semibold text-[11px]">
                              <CheckCircle2 className="size-3 text-primary" /> Confirmado
                            </span>
                          )}
                          {tx.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-semibold text-[11px]">
                              <Clock className="size-3" /> Pendente
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right text-muted-foreground">
                          {tx.timestamp}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ROLE 2: PROVEDOR DE LIQUIDEZ */}
        {role === 'provedor' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Reserva de Liquidez em Custódia</span>
                <p className="text-2xl font-bold font-display text-foreground mt-1.5">
                  350.000.000 AOA
                </p>
                <span className="text-[11px] text-primary mt-1 block font-medium">
                  Alocação segura em conta Banco Central / EMIS
                </span>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Volume Liquidado (24 Horas)</span>
                <p className="text-2xl font-bold font-display text-foreground mt-1.5">
                  74.200.000 AOA
                </p>
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  12 lotes processados
                </span>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Taxa de Liquidez Instantânea</span>
                <p className="text-2xl font-bold font-display text-foreground mt-1.5">
                  100%
                </p>
                <span className="text-[11px] text-primary flex items-center gap-1 mt-1 font-medium">
                  <CheckCircle2 className="size-3" /> Em conformidade regulamentar
                </span>
              </div>
            </div>

            {/* Lotes de Confirmação Pendente */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <h2 className="text-base font-bold font-display text-foreground">
                Lotes de Liquidação para Confirmação Bancária
              </h2>
              <p className="text-xs text-muted-foreground">
                Assine as liquidações diárias para libertação de fundos aos comerciantes e reconciliação EMIS.
              </p>

              <div className="space-y-3 pt-2">
                <div className="rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-foreground">Lote #LT-0914-A</span>
                      <span className="px-2 py-0.5 rounded-full bg-secondary text-[11px] text-muted-foreground">
                        Multicaixa Express
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Montante: <strong className="text-foreground">28.400.000 AOA</strong> (142 transações)
                    </p>
                  </div>
                  <button
                    onClick={() => setSettledBatches({ ...settledBatches, 'LT-0914-A': true })}
                    disabled={settledBatches['LT-0914-A']}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      settledBatches['LT-0914-A']
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-primary text-primary-foreground hover:opacity-90'
                    }`}
                  >
                    {settledBatches['LT-0914-A'] ? '✓ Liquidado e Reconciliado' : 'Confirmar e Assinar Liquidação'}
                  </button>
                </div>

                <div className="rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/30">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-foreground">Lote #LT-0914-B</span>
                      <span className="px-2 py-0.5 rounded-full bg-secondary text-[11px] text-muted-foreground">
                        UNITEL Money
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Montante: <strong className="text-foreground">12.300.000 AOA</strong> (89 transações)
                    </p>
                  </div>
                  <button
                    onClick={() => setSettledBatches({ ...settledBatches, 'LT-0914-B': true })}
                    disabled={settledBatches['LT-0914-B']}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      settledBatches['LT-0914-B']
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-primary text-primary-foreground hover:opacity-90'
                    }`}
                  >
                    {settledBatches['LT-0914-B'] ? '✓ Liquidado e Reconciliado' : 'Confirmar e Assinar Liquidação'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROLE 3: ADMINISTRADOR */}
        {role === 'admin' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Volume Global (24h)</span>
                <p className="text-2xl font-bold font-display text-foreground mt-1.5">
                  2.410.500.000 AOA
                </p>
                <span className="text-[11px] text-primary flex items-center gap-1 mt-1 font-medium">
                  <TrendingUp className="size-3" /> +18.2% vs semana anterior
                </span>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Lojas Ativas</span>
                <p className="text-2xl font-bold font-display text-foreground mt-1.5">
                  412 comerciantes
                </p>
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  Luanda, Benguela, Huíla
                </span>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Disponibilidade (SLA)</span>
                <p className="text-2xl font-bold font-display text-foreground mt-1.5">
                  99,98%
                </p>
                <span className="text-[11px] text-primary flex items-center gap-1 mt-1 font-medium">
                  <CheckCircle2 className="size-3" /> Zero incidentes
                </span>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Motor Antifraude</span>
                <p className="text-2xl font-bold font-display text-foreground mt-1.5">
                  Ativo &amp; Estrito
                </p>
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  3 bloqueios automáticos hoje
                </span>
              </div>
            </div>

            {/* Ledger imutável e auditável */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold font-display text-foreground">Ledger Imutável e Auditável</h2>
                  <p className="text-xs text-muted-foreground">Registo criptográfico de auditoria com encadeamento de blocos.</p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-secondary text-foreground">
                  SHA-256 Verificado
                </span>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="rounded-xl bg-secondary/70 border border-border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-primary font-bold">BLOCO #0092144</span>
                    <p className="text-muted-foreground text-[11px]">Hash: 8f9b2a1c...e430 | Prev: 1b44c8...91a2</p>
                  </div>
                  <span className="text-foreground text-[11px]">Liquidação Lote Multicaixa Express (28.400.000 AOA)</span>
                  <span className="text-muted-foreground text-[11px]">Há 4 min</span>
                </div>

                <div className="rounded-xl bg-secondary/70 border border-border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-primary font-bold">BLOCO #0092143</span>
                    <p className="text-muted-foreground text-[11px]">Hash: 77a0bc41...ff90 | Prev: 6a218d...00bb</p>
                  </div>
                  <span className="text-foreground text-[11px]">Autorização RBAC: Nova loja aprovada (Loja Kero Luanda)</span>
                  <span className="text-muted-foreground text-[11px]">Há 18 min</span>
                </div>

                <div className="rounded-xl bg-secondary/70 border border-border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-primary font-bold">BLOCO #0092142</span>
                    <p className="text-muted-foreground text-[11px]">Hash: 5e11ad92...82ca | Prev: 4f129c...8172</p>
                  </div>
                  <span className="text-foreground text-[11px]">Reconciliação Bancária com EMIS Luanda</span>
                  <span className="text-muted-foreground text-[11px]">Há 1 hora</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Simular Cobrança */}
      {isNewChargeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-display text-foreground">Nova Cobrança de Teste</h3>
            <p className="text-xs text-muted-foreground">Simule o envio de um pedido de pagamento na rede angolana.</p>

            <form onSubmit={handleCreateCharge} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Montante (AOA)</label>
                <input
                  type="number"
                  required
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Método de Pagamento</label>
                <select
                  value={newMethod}
                  onChange={(e) => setNewMethod(e.target.value as any)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="multicaixa_express">Multicaixa Express (GPO)</option>
                  <option value="referencia">Pagamento por Referência EMIS</option>
                  <option value="unitel_money">UNITEL Money</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Número de Telemóvel</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewChargeOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                  Criar Cobrança
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
