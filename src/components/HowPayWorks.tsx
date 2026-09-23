import React from 'react';
import {
  Smartphone,
  Store,
  Zap,
  Wallet,
  CheckCircle,
  CreditCard,
  ArrowRight,
  ArrowDown,
  ShieldCheck
} from 'lucide-react';
import { WORKFLOW_PIPELINE, WORKFLOW_STEPS } from '../data/content';

export const HowPayWorks: React.FC = () => {
  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case 'smartphone':
        return <Smartphone className="size-5" />;
      case 'store':
        return <Store className="size-5" />;
      case 'zap':
        return <Zap className="size-5" />;
      case 'wallet':
        return <Wallet className="size-5" />;
      case 'circle-check':
        return <CheckCircle className="size-5" />;
      case 'credit-card':
        return <CreditCard className="size-5" />;
      default:
        return <Zap className="size-5" />;
    }
  };

  return (
    <section id="como-funciona" className="bg-secondary/50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        {/* Header */}
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Como funciona o PAY
          </p>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            PAY é um Gateway de Pagamentos que conecta Cliente, Loja e Provedor de Liquidez.
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Desde o momento em que o cliente inicia o pagamento até à loja receber o saldo, o PAY gere pagamentos, liquidez, verificação e liquidação — tudo numa única API.
          </p>
        </div>

        {/* Pipeline Process Flow */}
        <div className="mt-10 flex flex-wrap items-center gap-2 text-xs font-semibold sm:text-sm">
          {WORKFLOW_PIPELINE.map((item, index) => (
            <span key={`${item}-${index}`} className="flex items-center gap-2">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-primary">
                {item}
              </span>
              {index < WORKFLOW_PIPELINE.length - 1 && (
                <ArrowRight className="size-3.5 text-muted-foreground" />
              )}
            </span>
          ))}
        </div>

        {/* 7 Workflow Step Cards */}
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WORKFLOW_STEPS.map((step, idx) => (
            <li
              key={step.stepNumber}
              id={`workflow-step-${step.stepNumber}`}
              className="relative rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  {getStepIcon(step.iconName)}
                </span>
                <span className="font-display text-3xl font-bold text-primary/20">
                  {step.stepNumber}
                </span>
              </div>

              <p className="mt-4 text-xs font-bold uppercase tracking-widest text-primary">
                {step.actor}
              </p>

              <h3 className="font-display mt-1 font-bold text-foreground">
                {step.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>

              {/* Mobile indicator for next step */}
              {idx < WORKFLOW_STEPS.length - 1 && (
                <ArrowDown className="absolute -bottom-3 left-1/2 size-5 -translate-x-1/2 text-primary/40 lg:hidden" />
              )}
            </li>
          ))}
        </ol>

        {/* Bottom Callout banner */}
        <div className="mt-10 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <ShieldCheck className="size-6 shrink-0 text-primary" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">PAY</span> conecta pagamentos, liquidez, verificação e liquidação — para que a sua loja receba o dinheiro de forma rápida, segura e automática.
          </p>
        </div>
      </div>
    </section>
  );
};
