import React from 'react';
import { ArrowUpRight, QrCode } from 'lucide-react';

interface BannerCTAProps {
  onOpenDocs: () => void;
  onOpenProposal: () => void;
}

export const BannerCTA: React.FC<BannerCTAProps> = ({ onOpenDocs, onOpenProposal }) => {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-primary-foreground sm:px-12 sm:py-16 shadow-xl shadow-primary/20">
        <QrCode className="absolute -right-8 -bottom-8 size-48 opacity-10 pointer-events-none" />

        <h2 className="font-display max-w-xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Transforme a experiência de pagamento dos seus clientes
        </h2>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            id="banner-docs-btn"
            onClick={onOpenDocs}
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-ink-foreground transition-transform hover:scale-[1.03]"
          >
            Documentação API
            <ArrowUpRight className="size-4" />
          </button>

          <button
            id="banner-proposal-btn"
            onClick={onOpenProposal}
            className="inline-flex items-center gap-2 rounded-xl border border-primary-foreground/30 px-5 py-3 text-sm font-semibold transition-colors hover:bg-primary-foreground/10"
          >
            Pedir proposta comercial
          </button>
        </div>
      </div>
    </section>
  );
};
