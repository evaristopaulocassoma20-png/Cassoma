import React, { useState } from 'react';
import { Braces, ArrowRight, Copy, Check } from 'lucide-react';
import { METRICS, MARQUEE_ITEMS, PAYMENT_METHODS } from '../data/content';
import { PaymentMethodId } from '../types';

interface HeroProps {
  onOpenDocs: () => void;
  onOpenProposal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenDocs, onOpenProposal }) => {
  const [selectedMethodId, setSelectedMethodId] = useState<PaymentMethodId>('multicaixa_express');
  const [copied, setCopied] = useState(false);

  const activeMethod = PAYMENT_METHODS.find(m => m.id === selectedMethodId) || PAYMENT_METHODS[0];

  const codeDisplay = activeMethod.id === 'multicaixa_express' 
    ? `POST /v1/charges
{
  "amount": 12500,
  "currency": "AOA",
  "method": "multicaixa_express",
  "customer": {
    "phone": "+244 9XX XXX XXX"
  },
  "webhook_url": "https://loja.ao/hooks/pay"
}

# 201 Created
{
  "id": "chg_9f2k...",
  "status": "pending",
  "reference": "001 882 441"
}`
    : `${activeMethod.endpointPayload.requestSnippet}\n\n${activeMethod.endpointPayload.responseSnippet}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(codeDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative overflow-hidden bg-ink text-ink-foreground">
      {/* Background radial glowing effects */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 60% 50% at 20% 0%, rgba(5, 150, 105, 0.45), transparent), radial-gradient(ellipse 40% 40% at 90% 80%, rgba(132, 204, 22, 0.2), transparent)',
        }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center">
        {/* Left Column */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-lime">
            <Braces className="size-3.5" />
            API para mais flexibilidade
          </span>

          <h1 className="font-display mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Todos os pagamentos de Angola,{' '}
            <span className="text-lime">uma única API.</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-foreground/70 sm:text-lg">
            Disponibilizamos uma API para que consiga, com a maior facilidade, integrar todos os métodos de pagamento com os seus serviços.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              id="hero-docs-btn"
              onClick={onOpenDocs}
              className="inline-flex items-center gap-2 rounded-xl bg-lime px-5 py-3 text-sm font-bold text-lime-foreground transition-transform hover:scale-[1.03]"
            >
              Documentação API
              <ArrowRight className="size-4" />
            </button>

            <button
              id="hero-proposal-btn"
              onClick={onOpenProposal}
              className="inline-flex items-center gap-2 rounded-xl border border-ink-foreground/20 px-5 py-3 text-sm font-semibold transition-colors hover:bg-ink-foreground/10"
            >
              Pedir proposta comercial
            </button>
          </div>

          {/* Metrics */}
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
            {METRICS.map(metric => (
              <div key={metric.label}>
                <p className="font-display text-2xl font-bold text-lime">
                  {metric.value}
                </p>
                <p className="text-xs uppercase tracking-widest text-ink-foreground/50">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Code Window */}
        <div className="animate-float-slow">
          <div className="overflow-hidden rounded-2xl border border-ink-foreground/10 bg-ink shadow-2xl shadow-black/60">
            {/* Terminal Top Bar */}
            <div className="flex items-center justify-between border-b border-ink-foreground/10 px-4 py-3 bg-black/40">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-red-500/80" />
                <span className="size-3 rounded-full bg-yellow-500/80" />
                <span className="size-3 rounded-full bg-emerald-500/80" />
                <span className="font-mono-code ml-2 text-xs text-ink-foreground/60">
                  cobranca.http
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-ink-foreground/60 hover:text-ink-foreground font-mono transition-colors"
                  title="Copiar código"
                >
                  {copied ? <Check className="size-3 text-lime" /> : <Copy className="size-3" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Quick tabs for methods */}
            <div className="flex border-b border-ink-foreground/10 bg-black/20 overflow-x-auto text-[11px] font-mono">
              {[
                { id: 'multicaixa_express', label: 'Express' },
                { id: 'referencia', label: 'Referência' },
                { id: 'debito_direto', label: 'Débito' },
                { id: 'unitel_money', label: 'UNITEL' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedMethodId(tab.id as PaymentMethodId)}
                  className={`px-3 py-1.5 whitespace-nowrap transition-colors border-b-2 ${
                    selectedMethodId === tab.id
                      ? 'border-lime text-lime font-bold bg-lime/10'
                      : 'border-transparent text-ink-foreground/50 hover:text-ink-foreground/80'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code Block */}
            <pre className="font-mono-code overflow-x-auto p-5 text-xs leading-relaxed text-lime/90 sm:text-sm bg-black/50 select-all">
              {codeDisplay}
            </pre>
          </div>
        </div>
      </div>

      {/* Infinite Marquee of Payment Methods */}
      <div className="relative border-t border-ink-foreground/10 py-4 bg-black/20">
        <div className="flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-8 pr-8">
            {MARQUEE_ITEMS.map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="flex items-center gap-3 whitespace-nowrap text-sm font-semibold text-ink-foreground/60 hover:text-lime transition-colors cursor-default"
              >
                <span className="size-1.5 rounded-full bg-lime" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
