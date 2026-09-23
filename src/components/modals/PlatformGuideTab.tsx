import React, { useState } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  Building2, 
  Landmark, 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  Terminal, 
  Copy, 
  Check, 
  CreditCard, 
  Lock, 
  Zap, 
  AlertTriangle,
  RotateCw,
  Layers,
  ChevronRight
} from 'lucide-react';

export const PlatformGuideTab: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'intro' | 'ui' | 'rbac' | 'checkout' | 'api' | 'escrow' | 'cycle' | 'testing' | 'fixes' | 'resilience'>('intro');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 text-slate-300">
      {/* Banner de Boas-Vindas & Visão Geral */}
      <div className="rounded-3xl border border-[#A3E635]/30 bg-gradient-to-r from-[#131E35] via-[#0F172A] to-[#1E293B] p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A3E635]/15 text-[#A3E635] text-[11px] font-bold tracking-wide border border-[#A3E635]/30">
            <BookOpen className="size-3.5" />
            <span>Documento Mestre Oficial · KwanzaPay 2026</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-display">
            Guia Completo da Plataforma KwanzaPay
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Manual de referência técnica e operacional: desde a navegação na interface, regras de controle de acesso (RBAC), API de pagamentos RESTful até o mecanismo de liquidação P2P com garantia de custódia (*escrow*).
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none text-[#A3E635]">
          <Shield className="size-64" />
        </div>
      </div>

      {/* Navegação Rápida entre Seções */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10 gap-2">
        {[
          { id: 'intro', label: '1. O que é' },
          { id: 'ui', label: '2. Interface' },
          { id: 'rbac', label: '3. Perfis RBAC' },
          { id: 'checkout', label: '4. Checkout' },
          { id: 'api', label: '5. API REST' },
          { id: 'escrow', label: '6. Escrow P2P' },
          { id: 'cycle', label: '7. Ciclo Geral' },
          { id: 'testing', label: '8. Testes & Disputas' },
          { id: 'fixes', label: '9. Correções Críticas' },
          { id: 'resilience', label: '10. Resiliência & AGT' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveSection(item.id as any)}
            className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
              activeSection === item.id
                ? 'bg-[#A3E635] text-[#0B132B] shadow-md'
                : 'bg-[#131E35] text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 1. O QUE É O KWANZAPAY */}
      {(activeSection === 'intro' || activeSection === 'intro') && (
        <div className="rounded-2xl border border-slate-800 bg-[#131E35] p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold text-white">
            <Zap className="size-5 text-[#A3E635]" />
            <h2>1. O que é o KwanzaPay?</h2>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
            O <strong>KwanzaPay</strong> é uma infraestrutura moderna de pagamentos digitais e gateway P2P com custódia (<em>escrow</em>) desenhada especificamente para o ecossistema angolano. Ele resolve a lacuna de aceitação instantânea de Kwanzas (AOA) na internet ao conectar três participantes essenciais:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            <div className="p-4 rounded-xl bg-[#0B132B] border border-slate-800 space-y-2">
              <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Building2 className="size-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Lojas e Comerciantes Virtuais</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Empresas, startups e lojistas que precisam receber pagamentos online com liquidação automática, gestão de produtos, links de pagamento e webhooks em tempo real.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B132B] border border-slate-800 space-y-2">
              <div className="size-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <Landmark className="size-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Provedores de Liquidez (LPS)</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Agentes e entidades financeiras que mantêm reservas de garantia para assegurar a liquidação instantânea dos pagamentos recebidos via Multicaixa Express e IBAN em troca de comissões.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B132B] border border-slate-800 space-y-2">
              <div className="size-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
                <CreditCard className="size-4" />
              </div>
              <h3 className="text-xs font-bold text-white">Clientes Finais</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Compradores que realizam compras sem atrito através de métodos familiares como Multicaixa Express (MCX), Pagamento por Referência EMIS e Transferência Bancária.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. ESTRUTURA DA INTERFACE E TELAS */}
      {(activeSection === 'ui' || activeSection === 'intro') && (
        <div className="rounded-2xl border border-slate-800 bg-[#131E35] p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold text-white">
            <Layers className="size-5 text-[#A3E635]" />
            <h2>2. Estrutura da Interface e Telas</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#0B132B] border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#A3E635]" />
                <span>A. Página Inicial (Landing Page)</span>
              </h3>
              <ul className="text-[11px] text-slate-300 space-y-1.5 pl-4 list-disc marker:text-[#A3E635]">
                <li><strong>Cabeçalho (Header)</strong>: Navegação para seções institucionais, botão Demo Checkout para testar pagamentos em modo real, acessos rápidos para Documentação, FAQ, Proposta Comercial e botão de Login.</li>
                <li><strong>Hero Section</strong>: Badges de disponibilidade de infraestrutura (SLA 99.98%), compatibilidade com a rede EMIS e chamada para ação instantânea.</li>
                <li><strong>Métodos Suportados</strong>: Detalhamento dos 4 canais locais (Multicaixa Express, Pagamento por Referência, Débito Direto e Carteiras Digitais).</li>
                <li><strong>Fluxo Visual P2P & Escrow</strong>: Diagrama explicativo mostrando o bloqueio cautelar de fundos até a confirmação da entrega.</li>
                <li><strong>Rodapé Institucional</strong>: Termos de serviço, política de privacidade, dados de conformidade com o Banco Nacional de Angola (BNA).</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#0B132B] border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#A3E635]" />
                <span>B. Painel Unificado do Comerciante (UnifiedDashboard)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                O painel de controle para a loja contém 18 módulos operacionais categorizados em 4 blocos:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 text-[11px]">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="font-bold text-white">1. Principal</span>
                  <p className="text-slate-400">Dashboard, Sua Loja, Produtos, Cupons e Clientes.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="font-bold text-white">2. Financeiro</span>
                  <p className="text-slate-400">Assinaturas, Cobranças, Links de Pagamento, Saques e Disputas.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="font-bold text-white">3. Desenvolvedor</span>
                  <p className="text-slate-400">Integração rápida, Documentação, Chaves de API, Webhooks e Plugins.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <span className="font-bold text-white">4. Sistema</span>
                  <p className="text-slate-400">Roadmap 2026, Alternador Dev Mode (Sandbox/Live) e Central de Suporte.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SISTEMA DE AUTENTICAÇÃO E PERFIS (RBAC) */}
      {(activeSection === 'rbac' || activeSection === 'intro') && (
        <div className="rounded-2xl border border-slate-800 bg-[#131E35] p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold text-white">
            <ShieldCheck className="size-5 text-[#A3E635]" />
            <h2>3. Sistema de Autenticação e Perfis (RBAC)</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            O acesso à plataforma é unificado via <strong>Autenticação Google com um clique</strong>, sem senhas estáticas vulneráveis e com regras estritas de papéis:
          </p>

          <div className="space-y-3">
            {/* Papel 1 */}
            <div className="p-4 rounded-xl bg-[#0B132B] border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Building2 className="size-4 text-emerald-400" />
                  Cliente / Loja (Comerciante) — Padrão
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                  Acesso Imediato
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong>Quem é:</strong> Qualquer novo utilizador que realiza login no KwanzaPay.<br />
                <strong>O que vê:</strong> O <em>UnifiedDashboard</em> com acesso completo para emitir cobranças, gerar chaves de API, configurar webhooks e gerir produtos.<br />
                <strong>Limitação:</strong> Não pode acessar o painel global de Provedores de Liquidez nem o painel de Administrador.
              </p>
            </div>

            {/* Papel 2 */}
            <div className="p-4 rounded-xl bg-[#0B132B] border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Landmark className="size-4 text-amber-400" />
                  Provedor de Liquidez (LPS) — Requer KYC Aprovado
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400">
                  Verificação Obrigatória
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                <strong>Regra Estrita:</strong> Quem não verificou o perfil <strong>NÃO PODE</strong> se tornar LPS nem ver o painel de reservas. Para obter elegibilidade, o utilizador clica em <em>"Solicitar Verificação de Perfil"</em> e envia:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 pt-1">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">• Nome Completo conforme Bilhete de Identidade</div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">• Número de BI / NIF Angolano</div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">• Banco Angolano (BAI, BFA, BIC, Atlântico, etc.)</div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">• IBAN Angolano (AO06...) para liquidação</div>
              </div>
              <p className="text-[11px] text-emerald-400 font-semibold">
                ✓ Uma vez aprovado o perfil, a conta é marcada como verificada e desbloqueia permanentemente o painel LPWalletDashboard.
              </p>
            </div>

            {/* Papel 3 */}
            <div className="p-4 rounded-xl bg-[#0B132B] border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Shield className="size-4 text-purple-400" />
                  Administrador do Gateway
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400">
                  Acesso Restrito
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Painel reservado para auditoria e gestão da infraestrutura central, monitorando volume transacionado em 24h, motor antifraude e o <strong>Ledger Criptográfico SHA-256</strong> com prova de blocos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. A EXPERIÊNCIA DE CHECKOUT */}
      {(activeSection === 'checkout' || activeSection === 'intro') && (
        <div className="rounded-2xl border border-slate-800 bg-[#131E35] p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold text-white">
            <CreditCard className="size-5 text-[#A3E635]" />
            <h2>4. A Experiência de Checkout (Demonstrador de Pagamento)</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Quando uma loja direciona um cliente para a URL gerada pela API, a tela de checkout atua como intermediário seguro:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-[#0B132B] border border-slate-800 space-y-2">
              <div className="text-[10px] uppercase font-bold text-[#A3E635]">Passo 1 · Resumo da Compra</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Exibe o valor exato em Kwanzas (AOA), nome da loja vendedora e temporizador ativo de validade da ordem (300 segundos).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B132B] border border-slate-800 space-y-2">
              <div className="text-[10px] uppercase font-bold text-[#A3E635]">Passo 2 · Bloqueio em Custódia</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                O motor seleciona o LPS ativo com melhor garantia. Os fundos correspondentes ficam retidos no contrato de custódia (escrow). O cliente transfere via Multicaixa Express para a conta do LPS.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B132B] border border-slate-800 space-y-2">
              <div className="text-[10px] uppercase font-bold text-[#A3E635]">Passo 3 · Liquidação & Webhook</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Validado o recebimento bancário, o valor é creditado na conta da Loja, o LPS recebe sua comissão e o webhook é disparado automaticamente para o sistema da loja.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. FUNCIONAMENTO DA API DE PAGAMENTO */}
      {(activeSection === 'api' || activeSection === 'intro') && (
        <div className="rounded-2xl border border-slate-800 bg-[#131E35] p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold text-white">
            <Terminal className="size-5 text-[#A3E635]" />
            <h2>5. Funcionamento da API de Pagamento RESTful</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            A API opera sob o protocolo HTTPS em formato JSON, com autenticação via cabeçalho <code>Authorization: Bearer &lt;chave_secreta&gt;</code>.
          </p>

          {/* Autenticação */}
          <div className="p-4 rounded-xl bg-[#0B132B] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono">Cabeçalho de Autenticação HTTP</span>
              <button
                type="button"
                onClick={() => handleCopy('Authorization: Bearer kz_live_sec_99a810f2491b\nContent-Type: application/json', 'hdr')}
                className="text-[11px] text-[#A3E635] flex items-center gap-1 hover:underline"
              >
                {copiedId === 'hdr' ? <Check className="size-3" /> : <Copy className="size-3" />}
                <span>Copiar</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-900 text-xs font-mono text-slate-300 overflow-x-auto">
{`Authorization: Bearer kz_live_sec_99a810f2491b
Content-Type: application/json`}
            </pre>
          </div>

          {/* Criar Cobrança */}
          <div className="p-4 rounded-xl bg-[#0B132B] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono text-xs font-bold">POST</span>
                <span className="font-mono text-xs font-bold text-white">/api/v1/charges (Criar Cobrança)</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(`{\n  "amount": 25000,\n  "currency": "AOA",\n  "customer": {\n    "name": "João Manuel",\n    "phone": "+244923111222",\n    "email": "cliente@exemplo.ao"\n  },\n  "method": "multicaixa_express",\n  "order_id": "PEDIDO-89210",\n  "redirect_url": "https://sualoja.ao/sucesso"\n}`, 'req_charge')}
                className="text-[11px] text-[#A3E635] flex items-center gap-1 hover:underline"
              >
                {copiedId === 'req_charge' ? <Check className="size-3" /> : <Copy className="size-3" />}
                <span>Copiar Payload</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-300 overflow-x-auto">
{`{
  "amount": 25000,
  "currency": "AOA",
  "customer": {
    "name": "João Manuel",
    "phone": "+244923111222",
    "email": "cliente@exemplo.ao"
  },
  "method": "multicaixa_express",
  "order_id": "PEDIDO-89210",
  "redirect_url": "https://sualoja.ao/sucesso"
}`}
            </pre>
            <span className="text-[11px] font-bold text-slate-400">Resposta JSON (201 Created):</span>
            <pre className="p-3 rounded-lg bg-slate-900 text-[11px] font-mono text-emerald-400 overflow-x-auto">
{`{
  "charge_id": "chg_8912aa",
  "status": "pending",
  "reference": "001 882 441",
  "checkout_url": "https://kwanzapay.ao/pay/chg_8912aa",
  "expires_in_seconds": 900
}`}
            </pre>
          </div>

          {/* Webhook */}
          <div className="p-4 rounded-xl bg-[#0B132B] border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-white font-mono">Disparo de Webhook em Tempo Real (POST na URL da Loja)</span>
            <pre className="p-3 rounded-lg bg-slate-900 text-[11px] font-mono text-slate-300 overflow-x-auto">
{`{
  "event": "charge.confirmed",
  "data": {
    "charge_id": "chg_8912aa",
    "amount": 25000,
    "net_amount": 24375,
    "currency": "AOA",
    "payment_method": "multicaixa_express",
    "settled_at": "2026-09-16T12:45:00Z"
  }
}`}
            </pre>
          </div>
        </div>
      )}

      {/* 6. O SISTEMA DE ESCROW E LIQUIDAÇÃO P2P */}
      {(activeSection === 'escrow' || activeSection === 'intro') && (
        <div className="rounded-2xl border border-slate-800 bg-[#131E35] p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold text-white">
            <Lock className="size-5 text-[#A3E635]" />
            <h2>6. O Sistema de Escrow e Liquidação P2P</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Para contornar as limitações tradicionais do mercado financeiro e eliminar o risco de inadimplência:
          </p>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-[#0B132B] border border-slate-800 flex items-start gap-3">
              <span className="size-6 rounded-full bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center font-bold text-xs shrink-0">1</span>
              <div>
                <strong>Depósito Prévia de Caução:</strong> O LPS credita uma reserva de segurança na plataforma (ex: 1.000.000 AOA).
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0B132B] border border-slate-800 flex items-start gap-3">
              <span className="size-6 rounded-full bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center font-bold text-xs shrink-0">2</span>
              <div>
                <strong>Bloqueio Atômico:</strong> Quando o comprador abre o checkout para 50.000 AOA, exatamente 50.000 AOA da reserva do LPS são congelados no contrato de custódia (escrow).
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0B132B] border border-slate-800 flex items-start gap-3">
              <span className="size-6 rounded-full bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center font-bold text-xs shrink-0">3</span>
              <div>
                <strong>Transferência Direta:</strong> O comprador transfere os 50.000 AOA diretamente para o IBAN ou telefone Multicaixa Express do LPS.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0B132B] border border-slate-800 flex items-start gap-3">
              <span className="size-6 rounded-full bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center font-bold text-xs shrink-0">4</span>
              <div>
                <strong>Liberação Instantânea:</strong> Assim que a entrada dos fundos é verificada no extrato bancário, o valor em custódia é repassado para o saldo sacável da Loja.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0B132B] border border-slate-800 flex items-start gap-3">
              <span className="size-6 rounded-full bg-[#A3E635]/10 text-[#A3E635] flex items-center justify-center font-bold text-xs shrink-0">5</span>
              <div>
                <strong>Resolução de Disputas:</strong> Em desacordos, comprador e lojista podem abrir disputa no painel, auditada pelos dados imutáveis do Ledger SHA-256.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. RESUMO DO CICLO OPERACIONAL */}
      {(activeSection === 'cycle' || activeSection === 'intro') && (
        <div className="rounded-2xl border border-slate-800 bg-[#131E35] p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold text-white">
            <CheckCircle2 className="size-5 text-[#A3E635]" />
            <h2>7. Resumo do Ciclo Operacional da Plataforma</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-[#0B132B]">
                  <th className="py-3 px-4 font-bold">Etapa</th>
                  <th className="py-3 px-4 font-bold">Ação Realizada</th>
                  <th className="py-3 px-4 font-bold">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                <tr className="hover:bg-slate-900/50">
                  <td className="py-3 px-4 font-bold text-white">1. Adesão</td>
                  <td className="py-3 px-4 text-slate-300">Entrada com Google como Cliente / Loja.</td>
                  <td className="py-3 px-4 text-[#A3E635] font-semibold">Comerciante</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-3 px-4 font-bold text-white">2. Integração</td>
                  <td className="py-3 px-4 text-slate-300">Copia as chaves de API e cria links de pagamento ou produtos no painel.</td>
                  <td className="py-3 px-4 text-[#A3E635] font-semibold">Comerciante</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-3 px-4 font-bold text-white">3. Elegibilidade LPS</td>
                  <td className="py-3 px-4 text-slate-300">Preenche o formulário de verificação KYC para operar como custodiante de liquidez.</td>
                  <td className="py-3 px-4 text-amber-400 font-semibold">Utilizador / LPS</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-3 px-4 font-bold text-white">4. Compra</td>
                  <td className="py-3 px-4 text-slate-300">O cliente escolhe Multicaixa Express no Checkout e paga.</td>
                  <td className="py-3 px-4 text-sky-400 font-semibold">Cliente Final</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-3 px-4 font-bold text-white">5. Liquidação</td>
                  <td className="py-3 px-4 text-slate-300">O sistema e o LPS validam a entrada de fundos e liberam a ordem via webhook.</td>
                  <td className="py-3 px-4 text-[#A3E635] font-semibold">Rede KwanzaPay</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-3 px-4 font-bold text-white">6. Supervisão</td>
                  <td className="py-3 px-4 text-slate-300">Monitorização central em tempo real com auditoria criptográfica de blocos.</td>
                  <td className="py-3 px-4 text-purple-400 font-semibold">Administrador</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. CENÁRIOS DE TESTE, FALHAS E PROTOCOLO DE DISPUTAS */}
      {(activeSection === 'testing' || activeSection === 'intro') && (
        <div className="rounded-2xl border border-amber-500/30 bg-[#131E35] p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold text-white">
              <AlertTriangle className="size-5 text-amber-400" />
              <h2>8. Testes de Aceitação, Máquinas de Estado de Falha e Protocolo de Mediação</h2>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
              Fluxo Crítico P2P & Escrow
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Especificação formal para cenários de divergência, fraudes e atrasos na rede bancária EMIS / Multicaixa Express. Garante que o saldo retido em <em>Escrow</em> e os limites operacionais do Provedor de Liquidez (LPS) permaneçam matematicamente consistentes.
          </p>

          {/* Tabela de Casos de Teste */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-400" />
              Matriz de Casos de Teste (P2P & Escrow)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-[#0B132B]">
                    <th className="py-3 px-3 font-bold">ID</th>
                    <th className="py-3 px-3 font-bold">Cenário de Teste</th>
                    <th className="py-3 px-3 font-bold">Condição Inicial</th>
                    <th className="py-3 px-3 font-bold">Ação do Comprador</th>
                    <th className="py-3 px-3 font-bold">Comportamento Esperado do Sistema</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-[11px]">
                  <tr className="hover:bg-slate-900/50">
                    <td className="py-2.5 px-3 font-bold text-amber-400 font-mono">TC-01</td>
                    <td className="py-2.5 px-3 font-bold text-white">Comprovativo Falso / Alterado</td>
                    <td className="py-2.5 px-3 text-slate-300">Cobrança <code className="text-[#A3E635]">pending</code>, saldo LPS bloqueado</td>
                    <td className="py-2.5 px-3 text-slate-300">Envia PDF/Print manipulado sem entrada de fundos</td>
                    <td className="py-2.5 px-3 text-slate-300">LPS recusa o comprovativo no <code>LPWalletDashboard</code>. Transação transita para <code className="text-amber-400">under_review</code>. Saldo permanece em Escrow.</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="py-2.5 px-3 font-bold text-amber-400 font-mono">TC-02</td>
                    <td className="py-2.5 px-3 font-bold text-white">Valor Transferido Menor</td>
                    <td className="py-2.5 px-3 text-slate-300">Cobrança de 25.000 AOA</td>
                    <td className="py-2.5 px-3 text-slate-300">Transfere 20.000 AOA e anexa o comprovativo</td>
                    <td className="py-2.5 px-3 text-slate-300">LPS marca como "Incompleto". O sistema gera estado de <code className="text-amber-400">partial_payment</code>. Permite ao comprador pagar a diferença ou abrir disputa.</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="py-2.5 px-3 font-bold text-amber-400 font-mono">TC-03</td>
                    <td className="py-2.5 px-3 font-bold text-white">Expiração por Timeout (15 min)</td>
                    <td className="py-2.5 px-3 text-slate-300">Cobrança <code className="text-[#A3E635]">pending</code>, timer ativo</td>
                    <td className="py-2.5 px-3 text-slate-300">Não envia comprovativo no tempo limite</td>
                    <td className="py-2.5 px-3 text-slate-300">O status altera para <code className="text-rose-400">expired</code>. O valor retido em Escrow é desbloqueado e devolvido à reserva ativa do LPS.</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="py-2.5 px-3 font-bold text-amber-400 font-mono">TC-04</td>
                    <td className="py-2.5 px-3 font-bold text-white">Atraso da Rede Bancária (EMIS)</td>
                    <td className="py-2.5 px-3 text-slate-300">Cobrança <code className="text-[#A3E635]">pending</code>, SMS de confirmação atrasado</td>
                    <td className="py-2.5 px-3 text-slate-300">Envia comprovativo válido dentro do prazo, mas valor ainda não caiu no banco</td>
                    <td className="py-2.5 px-3 text-slate-300">O tempo de liquidação é pausado (<code className="text-sky-400">extended_validation</code>). O saldo retido permanece seguro em Escrow até a verificação do extrato.</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="py-2.5 px-3 font-bold text-amber-400 font-mono">TC-05</td>
                    <td className="py-2.5 px-3 font-bold text-white">Duplo Envio de Comprovativo</td>
                    <td className="py-2.5 px-3 text-slate-300">Cobrança <code className="text-emerald-400">confirmed</code></td>
                    <td className="py-2.5 px-3 text-slate-300">Tenta reutilizar o mesmo ID/código de transação bancária</td>
                    <td className="py-2.5 px-3 text-slate-300">O motor antifraude identifica o hash do comprovativo/referência como duplicada e rejeita sumariamente a submissão.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Diagrama de Máquinas de Estado de Falha */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-400" />
              Ciclo de Vida do Pagamento e Estados de Falha
            </h3>
            <p className="text-[11px] text-slate-400">
              Quando ocorrem divergências na verificação pelo LPS ou pela rede, a transação abandona o fluxo feliz (<code>pending</code> → <code>confirmed</code>) e transita pelas máquinas de estado de contingência:
            </p>
            <div className="p-4 rounded-xl bg-[#0B132B] border border-slate-800 font-mono text-[11px] text-[#A3E635] overflow-x-auto leading-relaxed">
{`                  ┌──────────────┐
                  │   PENDING    │
                  └──────┬───────┘
                         │
        ┌────────────────┼────────────────┐
        │ (Timeout)      │ (Divergência)  │ (Fraude/Recusa)
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   EXPIRED    │ │UNDER_REVIEW  │ │  REJECTED    │
└──────────────┘ └──────┬───────┘ └──────────────┘
                        │
                (Abertura Disputa)
                        │
                        ▼
               ┌────────────────┐
               │  IN_DISPUTE    │
               └───────┬────────┘
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
┌──────────────┐               ┌──────────────┐
│  RESOLVED_   │               │  RESOLVED_   │
│  MERCHANT    │               │     LPS      │
└──────────────┘               └──────────────┘`}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-amber-400">UNDER_REVIEW</span>
                <p className="text-slate-400">Disparado quando o comprador envia o comprovativo, mas o LPS declara não ter recebido o montante em sua conta bancária dentro da janela regulada.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-amber-400">IN_DISPUTE</span>
                <p className="text-slate-400">Ativado quando o comprador contesta a recusa do LPS, enviando evidências adicionais para a mediação central do Gateway.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400">RESOLVED_MERCHANT</span>
                <p className="text-slate-400">A mediação valida o pagamento, libera os fundos retidos em Escrow para a Loja e credita a comissão do LPS.</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <span className="font-bold text-sky-400">RESOLVED_LPS</span>
                <p className="text-slate-400">A mediação constata ausência de liquidação real, cancela a cobrança e devolve a garantia retida à reserva ativa do LPS.</p>
              </div>
            </div>
          </div>

          {/* Protocolo de Mediação em 3 Etapas */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-400" />
              Mecanismo de Resolução de Disputas e Mediação (3 Etapas Auditadas)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-[#0B132B] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">1. Congelamento em Escrow</span>
                  <span className="text-[10px] text-amber-400 font-bold">Janela: 2h</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Quando o LPS declara "Pagamento Não Reconhecido", o montante na carteira do LPS fica <strong>congelado</strong> (não alocável a novas ordens) e a transação entra em <code>UNDER_REVIEW</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0B132B] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">2. Submissão de Provas</span>
                  <span className="text-[10px] text-amber-400 font-bold">Prazo: 12h</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong>Comprador:</strong> Anexa extrato em PDF do MCX/Internet Banking com número do documento e timestamp.<br />
                  <strong>LPS:</strong> Anexa extrato oficial sem rasuras demonstrando a ausência do crédito.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0B132B] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">3. Auditoria do Ledger</span>
                  <span className="text-[10px] text-[#A3E635] font-bold">SLA: 24h</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  A Administração do Gateway valida a assinatura digital do comprovativo bancário, cruza os dados do IBAN e registra o veredito final no <strong>Ledger SHA-256</strong> imutável.
                </p>
              </div>
            </div>
          </div>

          {/* Webhook de Disputa Aberta */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-400" />
                Exemplo de Evento Webhook para Falhas de Pagamento (charge.dispute_opened)
              </h3>
              <button
                type="button"
                onClick={() => handleCopy(`{\n  "event": "charge.dispute_opened",\n  "timestamp": "2026-09-16T20:55:00Z",\n  "data": {\n    "charge_id": "chg_8912aa",\n    "order_id": "PEDIDO-89210",\n    "amount": 25000,\n    "currency": "AOA",\n    "status": "in_dispute",\n    "reason": "payment_unrecognized_by_lp",\n    "dispute": {\n      "dispute_id": "dsp_44021bb",\n      "opened_at": "2026-09-16T20:50:12Z",\n      "evidence_deadline": "2026-09-17T08:50:12Z"\n    }\n  }\n}`, 'dsp_wh')}
                className="text-[11px] text-[#A3E635] flex items-center gap-1 hover:underline cursor-pointer"
              >
                {copiedId === 'dsp_wh' ? <Check className="size-3" /> : <Copy className="size-3" />}
                <span>Copiar Payload de Disputa</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-amber-300 overflow-x-auto leading-relaxed">
{`{
  "event": "charge.dispute_opened",
  "timestamp": "2026-09-16T20:55:00Z",
  "data": {
    "charge_id": "chg_8912aa",
    "order_id": "PEDIDO-89210",
    "amount": 25000,
    "currency": "AOA",
    "status": "in_dispute",
    "reason": "payment_unrecognized_by_lp",
    "dispute": {
      "dispute_id": "dsp_44021bb",
      "opened_at": "2026-09-16T20:50:12Z",
      "evidence_deadline": "2026-09-17T08:50:12Z"
    }
  }
}`}
            </pre>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. CORREÇÕES CRÍTICAS DE INFRAESTRUTURA & CONFORMIDADE                   */}
      {/* ========================================================================= */}
      {activeSection === 'fixes' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="size-5 text-[#A3E635]" />
              <span>9. Erros Críticos de Infraestrutura, Usabilidade e Conformidade Bancária Corrigidos</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mapeamento de vulnerabilidades operacionais e bancárias identificadas no ecossistema angolano e as respetivas implementações de defesa ativas no KwanzaPay.
            </p>
          </div>

          {/* Matriz de Correções */}
          <div className="rounded-2xl border border-slate-800 bg-[#131E35] overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-[#0B132B] flex items-center justify-between">
              <span className="text-xs font-bold text-white">Matriz de Mitigação de Riscos Bancários & Operacionais</span>
              <span className="text-[10px] font-mono text-[#A3E635] bg-[#A3E635]/10 px-2 py-0.5 rounded border border-[#A3E635]/20 font-bold">
                100% IMPLEMENTADO
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-mono text-[11px]">
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Erro Identificado</th>
                    <th className="p-3">Impacto no Negócio</th>
                    <th className="p-3">Solução & Correção Aplicada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-amber-400">Bancária</td>
                    <td className="p-3 font-semibold text-white">Não Verificação de Titularidade (IBAN vs. NIF)</td>
                    <td className="p-3 text-slate-400">LPS cadastrar IBAN com NIF/Nome de terceiros ("laranjas"), dificultando a reconciliação e rastreamento fiscal.</td>
                    <td className="p-3 text-slate-300">
                      Exigência obrigatória no <strong>LpsVerificationModal</strong> de anexo de declaração/comprovativo oficial de titularidade do IBAN em PDF emitido pelo banco antes da aprovação do perfil.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-sky-400">Checkout UI</td>
                    <td className="p-3 font-semibold text-white">Anexo de Comprovativo com Formato Inválido</td>
                    <td className="p-3 text-slate-400">Clientes enviarem HEIC, Word ou links externos que o LPS não consegue abrir na tela do smartphone.</td>
                    <td className="p-3 text-slate-300">
                      Restrição no <strong>CheckoutPage</strong> para aceitar exclusivamente <code className="text-[#A3E635]">.pdf</code>, <code className="text-[#A3E635]">.png</code> e <code className="text-[#A3E635]">.jpg</code> com limite de 5MB e rejeição imediata de outros formatos.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-rose-400">API</td>
                    <td className="p-3 font-semibold text-white">Ausência de Chave de Idempotência</td>
                    <td className="p-3 text-slate-400">Falha de rede levar a loja parceira a reenviar a requisição e debitar/cobrar duas vezes o mesmo pedido.</td>
                    <td className="p-3 text-slate-300">
                      Suporte nos endpoints <code className="text-sky-300 font-mono">POST /v1/payments/create</code> e <code className="text-sky-300 font-mono">POST /v1/charges</code> ao cabeçalho <code className="text-[#A3E635]">Idempotency-Key</code> com hash SHA-256 em cache.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-purple-400">Segurança</td>
                    <td className="p-3 font-semibold text-white">Sessão Expirada sem Aviso de Reautenticação</td>
                    <td className="p-3 text-slate-400">LPS ou lojista ter o token JWT expirado durante a análise do extrato bancário e ações críticas falharem silenciosamente.</td>
                    <td className="p-3 text-slate-300">
                      Timeout estrito de 30 minutos implementado no <strong>authMiddleware</strong> e monitor com modal modal bloqueante de reautenticação obrigatória com Google OAuth.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-emerald-400">Liquidez</td>
                    <td className="p-3 font-semibold text-white">Sobrecarga de um Único Provedor (LPS)</td>
                    <td className="p-3 text-slate-400">Se o LPS selecionado ficar sem saldo disponível, o cliente é impedido de pagar mesmo com outros LPs ativos.</td>
                    <td className="p-3 text-slate-300">
                      Algoritmo de balanceamento de carga automático no <strong>GuaranteeEngine</strong> que filtra LPSs ativos por <code className="text-[#A3E635]">availableGuarantee &gt;= amount</code> e rotação por rating/colateral.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Diagrama de Rotatividade do Algoritmo de LPS */}
          <div className="rounded-2xl border border-slate-800 bg-[#0B132B] p-5 space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <RotateCw className="size-4 text-[#A3E635]" />
              <span>Algoritmo de Rotatividade e Seleção Automática de LPS (Load Balancing)</span>
            </h3>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-sky-300 overflow-x-auto leading-relaxed">
{`Cliente Inicia Checkout (/api/v1/payments/checkout/select-lps)
          │
          ▼
Busca LPSs Ativos com garantia: (guarantee_balance - locked_guarantee >= valor)
          │
          ├─────────────────────────────────────────────────┐
          │ (Vários LPs Elegíveis Encontrados)               │ (Nenhum LPS com saldo)
          ▼                                                 ▼
Ordena por: Rating DESC, Garantia DESC, Latência ASC       Erro: NO_LIQUIDITY_AVAILABLE
          │                                                Notifica Pool de LPs
          ▼
Aloca LPS 1 e Bloqueia Caução em Escrow (SELECT ... FOR UPDATE)
          │
          ├─────────────────────────────────────────────────┐
          │ (Sucesso na Reserva)                            │ (Concorrência / Falha)
          ▼                                                 ▼
Retorna Dados Bancários com Timer 900s             Fallback imediato para LPS 2`}
            </pre>
          </div>
        </div>
      )}

      {/* 10. ENGENHARIA FINANCEIRA, RESILIÊNCIA EMIS E FISCAL AGT */}
      {activeSection === 'resilience' && (
        <div className="rounded-2xl border border-slate-800 bg-[#131E35] p-5 sm:p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="size-5 text-[#A3E635]" />
              <span>10. Engenharia Financeira, Monitor EMIS & Conformidade Fiscal AGT</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Padrões avançados de arquitetura financeira e operacional adotados no KwanzaPay para prevenir perdas por arredondamento, monitorar a rede interbancária angolana, alertar provedores em multicanal e cumprir os requisitos da Administração Geral Tributária (AGT).
            </p>
          </div>

          {/* 1. Cálculo em Inteiros / Centésimos de AOA */}
          <div className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#A3E635]" />
                1. Eliminação de Ponto Flutuante (Armazenamento em Centésimos de AOA)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#A3E635]/10 text-[#A3E635] border border-[#A3E635]/20 font-bold">
                1 Kz = 100 Centésimos
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Todas as operações de liquidação, comissão de 1% e taxas do gateway são calculadas em <strong>números inteiros</strong> (<code className="text-[#A3E635]">amountCents</code>). A rotina garante que nem 1 Kwanza ou fração seja perdido:
            </p>
            <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
{`// Rotina Atómica de Liquidação KwanzaPay:
1. amountCents = Math.round(amount * 100);
2. lpsCommissionCents = Math.ceil(amountCents * 0.010); // 1.0% Garantia Integral (nunca arredondada p/ baixo)
3. platformFeeCents = Math.floor(amountCents * 0.015);  // 1.5% Gateway (arredondamento conservador)
4. netMerchantCents = amountCents - platformFeeCents - lpsCommissionCents; // Resíduo absorvido pelo Gateway
5. ivaFeeCents = Math.round(platformFeeCents * 0.14);    // 14% IVA sobre a taxa do Gateway (Regime Geral AGT)

// Verificação de Integridade Estrita:
netMerchantCents + platformFeeCents + lpsCommissionCents === amountCents // Sempre VERDADEIRO (0% divergência)`}
            </pre>
          </div>

          {/* 2. Semáforo EMIS Multicaixa */}
          <div className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-400" />
                2. Health Check da Rede Multicaixa Express (Semáforo EMIS)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                Janela 01:00 - 04:30 WAT
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              O motor monitora a taxa de sucesso das últimas 10 transações via Multicaixa Express. Se a taxa cair abaixo de <strong>80%</strong> ou durante o período de manutenção noturna da EMIS (01:00 às 04:30), o Checkout ativa um alerta instantâneo e sugere ao cliente a alternativa de <strong>Transferência Bancária Direta (IBAN)</strong> ou <strong>Saldo Interno</strong> para prevenir atrito de cobrança.
            </p>
          </div>

          {/* 3. Notificações Híbridas Multicanal */}
          <div className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="size-2 rounded-full bg-sky-400" />
                3. Alertas Híbridos Multicanal para o Provedor de Liquidez (LPS)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 font-bold">
                &lt; 300ms Latência
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Para assegurar que o LPS não perca a janela de 30 minutos de verificação, o sistema despacha eventos simultaneamente via:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium text-center">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sky-300">
                ⚡ WebSockets (UI Ativa)
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[#A3E635]">
                🔔 Web Push Notification
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-blue-400">
                🤖 Bot Telegram (@KwanzaPayLpsBot)
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
                💬 WhatsApp Business API
              </div>
            </div>
          </div>

          {/* 4. Conformidade Fiscal AGT & IVA 14% */}
          <div className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="size-2 rounded-full bg-purple-400" />
                4. Módulo Fiscal & SAF-T (AO) - Regime Geral do IVA (14%)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
                Dec. Presidencial 7/19
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              O KwanzaPay atua como intermediário financeiro enquadrado no <strong>Regime Geral do IVA</strong> da Administração Geral Tributária (AGT). As taxas de gateway (1,5%) são faturadas com liquidação de 14% de IVA dedutível pela loja parceira, com suporte à exportação de arquivo <strong>SAF-T (AO) 1.01_01</strong> e relatórios de auditoria tributária.
            </p>
          </div>

          {/* 5. Sanitização em Sandbox OCR */}
          <div className="p-4 rounded-2xl bg-[#0B132B] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="size-2 rounded-full bg-rose-400" />
                5. Sanitização de Comprovativos em Sandbox de OCR (Anti-Bypass)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold">
                Proteção EXIF & Scripts
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Todo comprovativo passa por inspeção automatizada antes de ser apresentado ao LPS: verificação estrita de extensões (<code className="text-[#A3E635]">PDF, PNG, JPG &le; 5MB</code>), extração de metadados potencialmente maliciosos, cálculo de hash SHA-256 e validação de NUP único no registro central.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
