import React, { useState } from 'react';
import { X, ChevronDown, HelpCircle, MessageSquare } from 'lucide-react';
import { FAQS } from '../../data/content';

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProposal: () => void;
}

export const FaqModal: React.FC<FaqModalProps> = ({ isOpen, onClose, onOpenProposal }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [selectedFilter, setSelectedFilter] = useState<'Todos' | 'Técnico' | 'Comercial' | 'Geral'>('Todos');

  if (!isOpen) return null;

  const filteredFaqs = selectedFilter === 'Todos' 
    ? FAQS 
    : FAQS.filter(f => f.category === selectedFilter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="faq-modal-card"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-2xl text-card-foreground"
      >
        <button
          id="close-faq-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Fechar"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
            <HelpCircle className="size-5" />
          </span>
          <div>
            <h2 className="text-2xl font-bold font-display tracking-tight">
              Questões Frequentes (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Tudo sobre integração, homologação EMIS, taxas e prazos de liquidação.
            </p>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 mt-6 pb-2 border-b border-border">
          {(['Todos', 'Técnico', 'Comercial', 'Geral'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                selectedFilter === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-4 divide-y divide-border">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={faq.question} className="py-3.5">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left gap-4 font-display font-semibold text-sm sm:text-base text-foreground hover:text-primary transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`size-4 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} />
                </button>
                {isOpen && (
                  <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed animate-in fade-in duration-150">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-4 rounded-2xl bg-secondary flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="size-5 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground">
              Não encontrou a resposta que procurava? Fale com a equipa técnica ou comercial.
            </span>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenProposal();
            }}
            className="shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95"
          >
            Falar com Especialista
          </button>
        </div>
      </div>
    </div>
  );
};
