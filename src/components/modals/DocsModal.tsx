import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Play, 
  BookOpen, 
  Terminal, 
  Sparkles, 
  Shield, 
  Database, 
  Layers, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Cpu,
  Lock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { SUPABASE_COMPLETE_SQL } from '../../data/supabaseMigrationSql';
import { PlatformGuideTab } from './PlatformGuideTab';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'guide' | 'architecture' | 'endpoints' | 'database' | 'tester';
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose, initialTab = 'guide' }) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'architecture' | 'endpoints' | 'database' | 'tester'>(initialTab);
  const [copied, setCopied] = useState<string | null>(null);

  // API Tester States
  const [testOrderId, setTestOrderId] = useState('ORD-' + Math.floor(100000 + Math.random() * 900000));
  const [testAmount, setTestAmount] = useState('145000');
  const [testMethod, setTestMethod] = useState('MULTICAIXA_EXPRESS');
  const [testReturnUrl, setTestReturnUrl] = useState('https://minhaloja.ao/pedido/sucesso');
  const [authHeaderToken, setAuthHeaderToken] = useState('Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMyJ9.eyJuYW1lIjoiRXZhcmlzdG8gUGF1bG8iLCJlbWFpbCI6ImV2YXJpc3RvcGF1bG9jYXNzb21hMjM1MkBnbWFpbC5jb20iLCJyb2xlIjoiVVNFUiJ9.demo_signature');

  // Live test states
  const [checkoutResult, setCheckoutResult] = useState<any>(null);
  const [confirmResult, setConfirmResult] = useState<any>(null);
  const [depositResult, setDepositResult] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live active transactions and LPS status from server
  const [lpsStatusData, setLpsStatusData] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loadingDb, setLoadingDb] = useState(false);

  const fetchLpsStatus = async () => {
    try {
      const res = await fetch('/api/v1/lps/status');
      if (res.ok) {
        const data = await res.json();
        setLpsStatusData(data);
      }
    } catch {
      // ignore
    }
  };

  const fetchDbStatus = async () => {
    setLoadingDb(true);
    try {
      const res = await fetch('/api/v1/system/database-status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch {
      setDbStatus({ configured: false, connected: false, message: 'Falha ao consultar status do Banco de Dados.' });
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (isOpen) {
      fetchLpsStatus();
      fetchDbStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // 1. Live Call: Checkout
  const handleLiveCheckout = async () => {
    setLoadingAction('checkout');
    setErrorMessage(null);
    try {
      const response = await fetch('/api/v1/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeaderToken,
        },
        body: JSON.stringify({
          order_id: testOrderId,
          amount: Number(testAmount),
          currency: 'AOA',
          payment_method: testMethod,
          return_url: testReturnUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.message || JSON.stringify(data));
      } else {
        setCheckoutResult(data);
        fetchLpsStatus();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha na conexão ao servidor Express.');
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. Live Call: Confirm User Paid
  const handleLiveConfirmPaid = async () => {
    if (!checkoutResult?.transaction_id) {
      setErrorMessage('Primeiro execute o checkout para gerar um transaction_id válido.');
      return;
    }

    setLoadingAction('confirm');
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/v1/payments/${checkoutResult.transaction_id}/confirm-user-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeaderToken,
        },
        body: JSON.stringify({
          proof_receipt_url: 'https://cdn.kwanzapay.ao/proofs/recibo_mcx_9841.pdf',
          notes: 'Transferência efetuada pelo MCX Express.',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.message || JSON.stringify(data));
      } else {
        setConfirmResult(data);
        fetchLpsStatus();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao confirmar pagamento.');
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. Live Call: LPS Guarantee Deposit
  const handleLiveGuaranteeDeposit = async () => {
    setLoadingAction('deposit');
    setErrorMessage(null);
    try {
      const response = await fetch('/api/v1/lps/guarantee/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeaderToken,
          'x-lps-id': 'lps_atlantico_01',
        },
        body: JSON.stringify({
          amount: 500000,
          payment_method: 'TRANSFERENCIA_BANCARIA',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.message || JSON.stringify(data));
      } else {
        setDepositResult(data);
        fetchLpsStatus();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao solicitar recarga de garantia.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0F172A] border border-slate-700/60 shadow-2xl text-slate-100 overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B132B]">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[#A3E635] text-[#0B132B] font-bold shadow-md">
              <Cpu className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-display text-white">
                  Documentação Técnica & API P2P
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider rounded-full bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 px-2.5 py-0.5">
                  v1.0.0 · Node.js / TypeScript
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Arquitetura de Custódia P2P, Bloqueio Atómico de Garantia e Timers de 300 segundos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-[#0B132B]/60 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-3 font-semibold transition-all border-b-2 flex items-center gap-2 shrink-0 ${
              activeTab === 'guide'
                ? 'border-[#A3E635] text-[#A3E635]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="size-4" />
            <span>Guia Completo da Plataforma</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`pb-3 px-3 font-semibold transition-all border-b-2 flex items-center gap-2 shrink-0 ${
              activeTab === 'architecture'
                ? 'border-[#A3E635] text-[#A3E635]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="size-4" />
            <span>Como o Sistema Funciona</span>
          </button>

          <button
            onClick={() => setActiveTab('endpoints')}
            className={`pb-3 px-3 font-semibold transition-all border-b-2 flex items-center gap-2 shrink-0 ${
              activeTab === 'endpoints'
                ? 'border-[#A3E635] text-[#A3E635]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="size-4" />
            <span>Especificação de Endpoints</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`pb-3 px-3 font-semibold transition-all border-b-2 flex items-center gap-2 shrink-0 ${
              activeTab === 'database'
                ? 'border-[#A3E635] text-[#A3E635]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="size-4" />
            <span>Banco de Dados (Prisma / PostgreSQL)</span>
          </button>

          <button
            onClick={() => setActiveTab('tester')}
            className={`pb-3 px-3 font-semibold transition-all border-b-2 flex items-center gap-2 shrink-0 ${
              activeTab === 'tester'
                ? 'border-[#A3E635] text-[#A3E635]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="size-4 fill-current" />
            <span>Testador Interativo ao Vivo</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-300 text-xs leading-relaxed">

          {/* ===================== TAB 0: GUIA COMPLETO ===================== */}
          {activeTab === 'guide' && (
            <PlatformGuideTab />
          )}

          {/* ===================== TAB 1: ARQUITETURA ===================== */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              {/* Introduction Card */}
              <div className="rounded-2xl border border-slate-800 bg-[#131E35] p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Shield className="size-4 text-[#A3E635]" />
                  <span>Como o KwanzaPay Funciona: Gateway P2P Seguro com Escrow de Garantia</span>
                </div>
                <p>
                  O KwanzaPay funciona como um <strong>protocolo híbrido de liquidez e pagamentos</strong> para o mercado angolano. Ele une lojas online e compradores a uma rede de <strong>Provedores de Liquidez (LPS)</strong> certificados pelo BNA/EMIS.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-[#0B132B] border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#A3E635]">1. Saldo de Garantia (Escrow)</span>
                    <p className="text-[11px] text-slate-300">
                      O LPS deposita previamente um saldo de garantia institucional (<code className="text-[#A3E635]">guarantee_balance</code>) que garante o montante de cada operação antes de qualquer interação do cliente.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0B132B] border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#A3E635]">2. Bloqueio Atómico Concorrente</span>
                    <p className="text-[11px] text-slate-300">
                      Quando o usuário inicia o checkout, o sistema seleciona o melhor LPS e bloqueia imediatamente o montante na garantia (<code className="text-[#A3E635]">locked_guarantee</code>). Um LPS nunca pode aceitar transações se <code className="text-amber-300">amount &gt; (guarantee_balance - locked_guarantee)</code>.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0B132B] border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#A3E635]">3. Timers Estritos de 5 Minutos</span>
                    <p className="text-[11px] text-slate-300">
                      O comprador tem <strong>300 segundos (5 min)</strong> para transferir. Se não o fizer, a garantia do LPS é desbloqueada automaticamente. Após o envio, o LPS tem <strong>5 minutos</strong> para validar o crédito bancário.
                    </p>
                  </div>
                </div>
              </div>

              {/* State Machine Diagram */}
              <div className="rounded-2xl border border-slate-800 bg-[#131E35] p-5 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="size-4 text-[#A3E635]" />
                  <span>Máquina de Estados da Transação (Lifecycle)</span>
                </h3>
                <div className="p-4 rounded-xl bg-[#0B132B] font-mono text-[11px] space-y-2 border border-slate-800/80 overflow-x-auto text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-sky-400 font-bold">[POST /checkout]</span>
                    <ArrowRight className="size-3 text-slate-500" />
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">PENDING_USER_TRANSFER</span>
                    <span className="text-slate-400">(Garantia Bloqueada no LPS · Timer de 300s iniciado)</span>
                  </div>
                  <div className="pl-6 border-l-2 border-slate-700 ml-4 space-y-2 py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">[POST /confirm-user-paid]</span>
                      <ArrowRight className="size-3 text-slate-500" />
                      <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">PENDING_LPS_VERIFICATION</span>
                      <span className="text-slate-400">(Timer de 300s para validação bancária do LPS)</span>
                    </div>
                    <div className="pl-6 border-l-2 border-slate-700 ml-4 space-y-2 py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">[LPS Valida Crédito]</span>
                        <ArrowRight className="size-3 text-slate-500" />
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">COMPLETED</span>
                        <span className="text-slate-400">(Garantia debitada, fundos creditados à loja / cliente)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-rose-400 font-bold">[LPS Excede 5 min / Divergência]</span>
                        <ArrowRight className="size-3 text-slate-500" />
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">DISPUTED</span>
                        <span className="text-slate-400">(Mediação automática por suporte KwanzaPay)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400 font-bold">[Timer 300s Expirou sem envio]</span>
                      <ArrowRight className="size-3 text-slate-500" />
                      <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300">EXPIRED</span>
                      <span className="text-slate-400">(Garantia do LPS restaurada: locked_guarantee -= amount)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Concurrency & Invariants */}
              <div className="rounded-2xl border border-slate-800 bg-[#131E35] p-5 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="size-4 text-[#A3E635]" />
                  <span>Regras Estritas de Garantia & Concorrência</span>
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li>
                    <strong>Fórmula do Saldo Disponível:</strong> <code className="text-[#A3E635]">saldo_garantia_disponivel = guarantee_balance - locked_guarantee</code>.
                  </li>
                  <li>
                    <strong>Prevenção de Race Conditions:</strong> No momento do checkout, o banco executa <code className="text-sky-300 font-mono">SELECT ... FOR UPDATE</code> com transação atómica para evitar que duas ordens simultâneas consumam a mesma garantia.
                  </li>
                  <li>
                    <strong>Garantia Institucional:</strong> Para aumentar seu limite, o LPS recarrega saldo enviando fundos para a conta institucional do KwanzaPay via endpoint <code className="text-sky-300 font-mono">/api/v1/lps/guarantee/deposit</code>.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ===================== TAB 2: ENDPOINTS ===================== */}
          {activeTab === 'endpoints' && (
            <div className="space-y-6">
              
              {/* Endpoint 1: Checkout */}
              <div className="rounded-2xl border border-slate-800 bg-[#131E35] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black font-bold text-xs font-mono">
                      POST
                    </span>
                    <span className="font-mono font-bold text-sm text-white">/api/v1/payments/checkout</span>
                  </div>
                  <span className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Requer Google OAuth Token
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Cria a solicitação de pagamento pelo usuário, associa automaticamente ao melhor LPS com garantia disponível suficiente (<code className="text-[#A3E635]">guarantee_balance - locked_guarantee &gt;= amount</code>), bloqueia o montante e retorna os dados bancários do LPS com timer de 300s.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Payload de Entrada (JSON)</span>
                    <pre className="p-3 rounded-xl bg-[#0B132B] font-mono text-[11px] text-slate-300 border border-slate-800 overflow-x-auto">
{`{
  "order_id": "ORD-984210",
  "amount": 145000,
  "currency": "AOA",
  "payment_method": "MULTICAIXA_EXPRESS",
  "return_url": "https://loja.ao/checkout/sucesso"
}`}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Resposta 201 Created</span>
                    <pre className="p-3 rounded-xl bg-[#0B132B] font-mono text-[11px] text-[#A3E635] border border-slate-800 overflow-x-auto">
{`{
  "transaction_id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
  "order_id": "ORD-984210",
  "status": "PENDING_USER_TRANSFER",
  "amount": 145000,
  "currency": "AOA",
  "time_limit_seconds": 300,
  "expires_at": "2026-09-14T19:35:00.000Z",
  "lps_bank_details": {
    "lps_name": "LP Atlântico (Evaristo Paulo)",
    "bank_name": "Banco Angolano de Investimentos (BAI)",
    "iban": "AO06 0040 0000 8192 3840 1014 9",
    "account_holder": "Evaristo Paulo Cassoma",
    "express_phone": "+244 923 456 789",
    "reference_code": "MCX-F81D4F"
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Endpoint 2: Confirm User Paid */}
              <div className="rounded-2xl border border-slate-800 bg-[#131E35] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black font-bold text-xs font-mono">
                      POST
                    </span>
                    <span className="font-mono font-bold text-sm text-white">/api/v1/payments/:transaction_id/confirm-user-paid</span>
                  </div>
                  <span className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Requer Google OAuth Token
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  O usuário notifica o envio dos fundos anexando opcionalmente o comprovativo bancário. O status muda para <code className="text-sky-300">PENDING_LPS_VERIFICATION</code> e dispara o timer de 5 minutos para o LPS validar o crédito em conta.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Payload de Entrada (JSON)</span>
                    <pre className="p-3 rounded-xl bg-[#0B132B] font-mono text-[11px] text-slate-300 border border-slate-800 overflow-x-auto">
{`{
  "proof_receipt_url": "https://cdn.kwanzapay.ao/recibos/mcx_8912.pdf",
  "notes": "Transferência realizada pelo BAI Directo"
}`}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Resposta 200 OK</span>
                    <pre className="p-3 rounded-xl bg-[#0B132B] font-mono text-[11px] text-[#A3E635] border border-slate-800 overflow-x-auto">
{`{
  "transaction_id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
  "status": "PENDING_LPS_VERIFICATION",
  "time_limit_seconds": 300,
  "verification_deadline": "2026-09-14T19:40:00.000Z",
  "message": "Comprovativo registado. O LPS tem 5 minutos para validar o crédito em conta bancária."
}`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Endpoint 3: LPS Guarantee Deposit */}
              <div className="rounded-2xl border border-slate-800 bg-[#131E35] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black font-bold text-xs font-mono">
                      POST
                    </span>
                    <span className="font-mono font-bold text-sm text-white">/api/v1/lps/guarantee/deposit</span>
                  </div>
                  <span className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Autenticado (Papel: LPS)
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Permite ao Provedor de Liquidez aumentar seu saldo de garantia. Retorna os dados bancários institucionais de custódia do KwanzaPay. Após a compensação, o valor é creditado em <code className="text-[#A3E635]">guarantee_balance</code>.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Payload de Entrada (JSON)</span>
                    <pre className="p-3 rounded-xl bg-[#0B132B] font-mono text-[11px] text-slate-300 border border-slate-800 overflow-x-auto">
{`{
  "amount": 500000,
  "payment_method": "TRANSFERENCIA_BANCARIA"
}`}
                    </pre>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase text-slate-400 block mb-1">Resposta 201 Created</span>
                    <pre className="p-3 rounded-xl bg-[#0B132B] font-mono text-[11px] text-[#A3E635] border border-slate-800 overflow-x-auto">
{`{
  "deposit_id": "dep_98a71b2",
  "lps_id": "lps_atlantico_01",
  "amount": 500000,
  "currency": "AOA",
  "status": "PENDING",
  "institutional_bank_details": {
    "bank_name": "Banco Angolano de Investimentos (BAI)",
    "beneficiary": "KwanzaPay Custódia Institucional Lda",
    "iban": "AO06 0040 0000 0019 2831 9999 1",
    "reference": "KP492810"
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 3: DATABASE ===================== */}
          {activeTab === 'database' && (
            <div className="space-y-5">
              
              {/* Database Live Status Header */}
              <div className="rounded-2xl border border-slate-800 bg-[#131E35] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-xl flex items-center justify-center ${
                    dbStatus?.connected 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  }`}>
                    <Database className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Base de Dados: Supabase PostgreSQL & Escrow Local</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        dbStatus?.connected
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                      }`}>
                        {dbStatus?.connected ? 'Supabase Conectado • Cloud PostgreSQL' : 'Motor Atômico Resiliente Ativo'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {dbStatus?.message || 'Persistência relacional PostgreSQL e motor de custódia em memória com isolamento atômico.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={fetchDbStatus}
                    disabled={loadingDb}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`size-3.5 ${loadingDb ? 'animate-spin' : ''}`} />
                    <span>Atualizar Status</span>
                  </button>

                  <div className="px-3 py-1.5 rounded-xl bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30 text-xs font-mono font-semibold">
                    Engine: KPay-Core v2.0
                  </div>
                </div>
              </div>

              {/* Informações da Arquitetura de Dados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0B132B] space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Camada de Persistência</span>
                  <span className="text-xs font-bold text-white font-mono">PostgreSQL / Supabase</span>
                  <span className="text-[11px] text-slate-500 block">Sincronização relacional ACID</span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0B132B] space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Garantia e Escrow</span>
                  <span className="text-xs font-bold text-sky-400 font-mono truncate block">Row-Locking Pessimista</span>
                  <span className="text-[11px] text-slate-500 block">Prevenção atômica de double-spending</span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0B132B] space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Integridade</span>
                  <span className="text-xs font-bold text-[#A3E635] font-mono">HMAC-SHA256 & NUP</span>
                  <span className="text-[11px] text-slate-500 block">Auditoria interbancária EMIS</span>
                </div>
              </div>

              {/* Estrutura de Tabelas Relacionais */}
              <div className="rounded-2xl border border-slate-800 bg-[#0B132B] p-5 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="size-4 text-[#A3E635]" />
                  <span>Estrutura de Tabelas Relacionais do KwanzaPay (PostgreSQL)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-[#131E35] space-y-1.5">
                    <span className="text-xs font-bold text-[#A3E635] font-mono block">public.transactions</span>
                    <span className="text-xs font-semibold text-white block">Ordens de Pagamento</span>
                    <p className="text-[11px] text-slate-400">
                      Armazena tokens de pagamento, NUP único de 16 a 24 dígitos, status, comprovativos e taxas de liquidação.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800 bg-[#131E35] space-y-1.5">
                    <span className="text-xs font-bold text-sky-400 font-mono block">public.lps</span>
                    <span className="text-xs font-semibold text-white block">Provedores de Liquidez</span>
                    <p className="text-[11px] text-slate-400">
                      Saldo caucionado em garantia, saldo bloqueado em Escrow, IBAN bancário BAI/BMA e comissões ganhas.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800 bg-[#131E35] space-y-1.5">
                    <span className="text-xs font-bold text-amber-400 font-mono block">public.merchants</span>
                    <span className="text-xs font-semibold text-white block">Lojas e Comerciantes</span>
                    <p className="text-[11px] text-slate-400">
                      Credenciais de API, chaves secretas para assinatura HMAC-SHA256, saldos disponíveis e URLs de Webhook.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800 bg-[#131E35] space-y-1.5">
                    <span className="text-xs font-bold text-purple-400 font-mono block">public.users</span>
                    <span className="text-xs font-semibold text-white block">Clientes e Contas</span>
                    <p className="text-[11px] text-slate-400">
                      Saldos em carteira interna para pagamento instantâneo em 1 clique e controle de acesso RBAC.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800 bg-[#131E35] space-y-1.5">
                    <span className="text-xs font-bold text-rose-400 font-mono block">public.disputes</span>
                    <span className="text-xs font-semibold text-white block">Mediação e Arbitragem</span>
                    <p className="text-[11px] text-slate-400">
                      Contestação de envio com retenção estrita do montante em Escrow até julgamento pelo auditor.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800 bg-[#131E35] space-y-1.5">
                    <span className="text-xs font-bold text-emerald-400 font-mono block">public.webhook_deliveries</span>
                    <span className="text-xs font-semibold text-white block">Trilha de Notificações</span>
                    <p className="text-[11px] text-slate-400">
                      Registro de disparos de Webhook, assinaturas criptográficas geradas e códigos HTTP de resposta.
                    </p>
                  </div>
                </div>
              </div>

              {/* Code preview: SQL DDL */}
              <div className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 font-mono text-[11px] overflow-x-auto space-y-3">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span>// Arquivo: /src/server/db/schema.sql (Esquema DDL PostgreSQL / Supabase)</span>
                  <span className="text-[#A3E635]">SQL DDL Ativo</span>
                </div>
                <pre className="text-slate-300 leading-relaxed max-h-56 overflow-y-auto">
{`-- KWANZAPAY CORE SCHEMA (PostgreSQL / Supabase)
CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  secret_key VARCHAR(128) NOT NULL,
  notify_url TEXT NOT NULL,
  return_url TEXT NOT NULL,
  balance NUMERIC(15, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name VARCHAR(128) UNIQUE NOT NULL,
  status VARCHAR(32) DEFAULT 'ACTIVE',
  available_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  locked_escrow_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  commission_rate NUMERIC(5, 4) DEFAULT 0.0100, -- 1.0%
  total_commissions_earned NUMERIC(15, 2) DEFAULT 0.00,
  bank_name VARCHAR(64) NOT NULL,
  iban VARCHAR(34) NOT NULL,
  account_holder VARCHAR(128) NOT NULL,
  express_phone VARCHAR(32),
  rating NUMERIC(3, 2) DEFAULT 5.00,
  total_trades_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_no VARCHAR(64) UNIQUE NOT NULL,
  trade_token VARCHAR(128) UNIQUE NOT NULL,
  merchant_id UUID REFERENCES public.merchants(id),
  partner_id VARCHAR(64) NOT NULL,
  out_trade_no VARCHAR(64) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'AOA',
  status VARCHAR(32) NOT NULL,
  nup_code VARCHAR(32),
  payment_method VARCHAR(32),
  lp_commission_amount NUMERIC(15, 2) DEFAULT 0.00,
  platform_fee_amount NUMERIC(15, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`}
                </pre>
              </div>

            </div>
          )}

          {/* ===================== TAB 4: TESTER ===================== */}
          {activeTab === 'tester' && (
            <div className="space-y-5">
              {/* Status Header with live LPS balance */}
              <div className="rounded-2xl border border-[#A3E635]/30 bg-[#131E35] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#A3E635] animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Servidor Backend Express Ativo</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Provedor Ativo: <strong>LP Atlântico (Evaristo Paulo)</strong>
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  {lpsStatusData?.providers?.[0] && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Garantia Disponível:</span>
                      <span className="text-sm font-bold text-[#A3E635]">
                        {new Intl.NumberFormat('pt-AO').format(lpsStatusData.providers[0].available_guarantee)} Kz
                      </span>
                    </div>
                  )}
                  <button
                    onClick={fetchLpsStatus}
                    className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    title="Atualizar saldos"
                  >
                    <RefreshCw className="size-4" />
                  </button>
                </div>
              </div>

              {/* Error Banner if any */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Interactive Step 1: Checkout */}
              <div className="rounded-2xl border border-slate-800 bg-[#131E35] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-full bg-[#A3E635] text-[#0B132B] font-bold flex items-center justify-center text-xs">
                      1
                    </span>
                    <span className="font-bold text-white text-sm">Passo 1: Disparar Checkout</span>
                  </div>
                  <span className="font-mono text-xs text-slate-400">POST /api/v1/payments/checkout</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Order ID</label>
                    <input
                      type="text"
                      value={testOrderId}
                      onChange={(e) => setTestOrderId(e.target.value)}
                      className="w-full rounded-xl bg-[#0B132B] border border-slate-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#A3E635]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Montante em Kwanzas (Kz)</label>
                    <input
                      type="number"
                      value={testAmount}
                      onChange={(e) => setTestAmount(e.target.value)}
                      className="w-full rounded-xl bg-[#0B132B] border border-slate-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#A3E635]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Método de Pagamento</label>
                    <select
                      value={testMethod}
                      onChange={(e) => setTestMethod(e.target.value)}
                      className="w-full rounded-xl bg-[#0B132B] border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#A3E635]"
                    >
                      <option value="MULTICAIXA_EXPRESS">Multicaixa Express</option>
                      <option value="TRANSFERENCIA_BANCARIA">Transferência Bancária</option>
                      <option value="REFERENCIA">Pagamento por Referência</option>
                      <option value="UNITEL_MONEY">UNITEL Money</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleLiveCheckout}
                  disabled={loadingAction === 'checkout'}
                  className="px-5 py-2.5 rounded-xl bg-[#A3E635] text-[#0B132B] font-bold text-xs hover:opacity-95 shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Play className="size-3.5 fill-current" />
                  <span>{loadingAction === 'checkout' ? 'A contactar backend...' : 'Executar Checkout'}</span>
                </button>

                {checkoutResult && (
                  <div className="rounded-xl bg-[#0B132B] p-3 border border-[#A3E635]/40 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-[11px] text-[#A3E635] font-bold">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5" />
                        <span>Transação Criada! Garantia Bloqueada no LPS</span>
                      </span>
                      <span className="font-mono">ID: {checkoutResult.transaction_id}</span>
                    </div>
                    <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto">
                      {JSON.stringify(checkoutResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Interactive Step 2: Confirm Payment */}
              <div className="rounded-2xl border border-slate-800 bg-[#131E35] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-full bg-[#A3E635] text-[#0B132B] font-bold flex items-center justify-center text-xs">
                      2
                    </span>
                    <span className="font-bold text-white text-sm">Passo 2: Confirmação de Envio pelo Usuário</span>
                  </div>
                  <span className="font-mono text-xs text-slate-400">POST /api/v1/payments/:id/confirm-user-paid</span>
                </div>

                <p className="text-xs text-slate-400">
                  Simula o comprador clicando em "Já paguei / Enviar comprovativo".
                </p>

                <button
                  onClick={handleLiveConfirmPaid}
                  disabled={loadingAction === 'confirm' || !checkoutResult}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 text-black font-bold text-xs hover:opacity-95 shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="size-3.5" />
                  <span>{loadingAction === 'confirm' ? 'A confirmar...' : 'Confirmar Envio (Dispara Timer de 5 min para LPS)'}</span>
                </button>

                {confirmResult && (
                  <div className="rounded-xl bg-[#0B132B] p-3 border border-sky-500/40 space-y-2 animate-in fade-in">
                    <div className="text-[11px] text-sky-400 font-bold flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      <span>Status Atualizado: PENDING_LPS_VERIFICATION</span>
                    </div>
                    <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto">
                      {JSON.stringify(confirmResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Interactive Step 3: LPS Guarantee Deposit */}
              <div className="rounded-2xl border border-slate-800 bg-[#131E35] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-full bg-[#A3E635] text-[#0B132B] font-bold flex items-center justify-center text-xs">
                      3
                    </span>
                    <span className="font-bold text-white text-sm">Passo 3: Recarga de Garantia do LPS</span>
                  </div>
                  <span className="font-mono text-xs text-slate-400">POST /api/v1/lps/guarantee/deposit</span>
                </div>

                <button
                  onClick={handleLiveGuaranteeDeposit}
                  disabled={loadingAction === 'deposit'}
                  className="px-5 py-2.5 rounded-xl border border-[#A3E635] text-[#A3E635] font-bold text-xs hover:bg-[#A3E635]/10 shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="size-3.5" />
                  <span>{loadingAction === 'deposit' ? 'A gerar depósito...' : 'Solicitar Depósito de Garantia (+500 000 Kz)'}</span>
                </button>

                {depositResult && (
                  <div className="rounded-xl bg-[#0B132B] p-3 border border-slate-700 space-y-2 animate-in fade-in">
                    <div className="text-[11px] text-[#A3E635] font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5" />
                      <span>Dados Institucionais Gerados</span>
                    </div>
                    <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto">
                      {JSON.stringify(depositResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#0B132B] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#A3E635]" />
            <span>Rotas ativas em <strong>/api/v1/*</strong> sob Node.js Express</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
