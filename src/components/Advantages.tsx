import React from 'react';
import { Layers, CodeXml, Workflow, ArrowRight } from 'lucide-react';
import { ADVANTAGES } from '../data/content';

interface AdvantagesProps {
  onOpenFaq: () => void;
}

export const Advantages: React.FC<AdvantagesProps> = ({ onOpenFaq }) => {
  const getAdvantageIcon = (iconName: string) => {
    switch (iconName) {
      case 'layers':
        return <Layers className="size-5" />;
      case 'code-xml':
        return <CodeXml className="size-5" />;
      case 'workflow':
        return <Workflow className="size-5" />;
      default:
        return <Layers className="size-5" />;
    }
  };

  return (
    <section id="vantagens" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        {/* Left Column */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Vantagens da integração via API
          </p>

          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl text-foreground">
            Construída para equipas que querem controlar tudo.
          </h2>

          <p className="mt-4 leading-relaxed text-muted-foreground">
            Tem dúvidas sobre a integração via API? Consulte as questões frequentes ou fale com a nossa equipa comercial.
          </p>

          <button
            id="advantages-faq-btn"
            onClick={onOpenFaq}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            Consultar questões frequentes
            <ArrowRight className="size-4" />
          </button>
        </div>

        {/* Right Column: Advantages list */}
        <div className="space-y-4">
          {ADVANTAGES.map((item) => (
            <div
              key={item.number}
              className="flex gap-5 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40 shadow-sm"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                {getAdvantageIcon(item.iconName)}
              </span>

              <div>
                <h3 className="font-display font-bold text-foreground">
                  <span className="mr-2 text-primary">{item.number}</span>
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
