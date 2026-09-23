import React from 'react';
import { ShieldCheck, CreditCard, BookOpen } from 'lucide-react';

interface ReadySectionProps {
  onOpenDocs: () => void;
  onOpenProposal: () => void;
}

export const ReadySection: React.FC<ReadySectionProps> = ({
  onOpenDocs,
  onOpenProposal,
}) => {
  return (
    <section id="docs" className="border-t border-border bg-secondary/50">
      <div
        id="proposta"
        className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-20"
      >
        <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary shadow-sm">
          <ShieldCheck className="size-8" />
        </div>

        <h2 className="font-display max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl text-foreground">
          Pronto para começar a aceitar pagamentos?
        </h2>

        <p className="max-w-xl leading-relaxed text-muted-foreground">
          Fale connosco para uma proposta comercial à medida do seu negócio, ou explore a documentação e comece a integrar hoje mesmo.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            id="ready-proposal-btn"
            onClick={onOpenProposal}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.03] shadow-md shadow-primary/20"
          >
            <CreditCard className="size-4" />
            Pedir proposta comercial
          </button>

          <button
            id="ready-docs-btn"
            onClick={onOpenDocs}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            <BookOpen className="size-4" />
            Documentação para developers
          </button>
        </div>
      </div>
    </section>
  );
};
