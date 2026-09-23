import React, { useState } from 'react';
import { Zap, Check, Copy } from 'lucide-react';

interface FooterProps {
  onOpenDocs: () => void;
  onOpenProposal: () => void;
  onOpenFaq: () => void;
  onOpenInfo: (type: 'about' | 'terms') => void;
  onSelectMethod: (methodId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenDocs,
  onOpenProposal,
  onOpenFaq,
  onOpenInfo,
  onSelectMethod
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedTel, setCopiedTel] = useState(false);

  const copyContact = (type: 'email' | 'tel', text: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedTel(true);
      setTimeout(() => setCopiedTel(false), 2000);
    }
  };

  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_repeat(4,1fr)]">
        {/* Brand Column */}
        <div>
          <a href="/" className="flex items-center gap-2 group">
            <span className="flex size-8 items-center justify-center rounded-lg bg-lime text-lime-foreground transition-transform group-hover:scale-105">
              <Zap className="size-4" />
            </span>
            <span className="font-display text-lg font-bold">
              Kwanza<span className="text-lime">Pay</span>
            </span>
          </a>

          <div className="mt-4 text-sm leading-relaxed text-ink-foreground/60 space-y-1">
            <p 
              onClick={() => copyContact('email', 'comercial@kwanzapy.ao')}
              className="cursor-pointer hover:text-lime transition-colors flex items-center gap-1.5"
              title="Clique para copiar"
            >
              <span>email: comercial@kwanzapy.ao</span>
              {copiedEmail && <span className="text-[10px] text-lime font-mono">(copiado!)</span>}
            </p>
            <p 
              onClick={() => copyContact('tel', '+244 923 000 000')}
              className="cursor-pointer hover:text-lime transition-colors flex items-center gap-1.5"
              title="Clique para copiar"
            >
              <span>tel.: +244 9XX XXX XXX</span>
              {copiedTel && <span className="text-[10px] text-lime font-mono">(copiado!)</span>}
            </p>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-ink-foreground/60">
            Av. de Portugal, Ingombota,
            <br />
            Luanda | Angola
          </p>
        </div>

        {/* Empresa */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-ink-foreground/50">
            Empresa
          </h4>
          <ul className="mt-4 space-y-2.5">
            <li>
              <button
                onClick={() => onOpenInfo('about')}
                className="text-sm text-ink-foreground/75 transition-colors hover:text-lime text-left"
              >
                Sobre nós
              </button>
            </li>
            <li>
              <button
                onClick={onOpenProposal}
                className="text-sm text-ink-foreground/75 transition-colors hover:text-lime text-left"
              >
                Contactos
              </button>
            </li>
            <li>
              <a
                href="mailto:talentos@kwanzapay.ao"
                className="text-sm text-ink-foreground/75 transition-colors hover:text-lime"
              >
                Trabalhar connosco
              </a>
            </li>
            <li>
              <button
                onClick={() => onOpenInfo('terms')}
                className="text-sm text-ink-foreground/75 transition-colors hover:text-lime text-left"
              >
                Segurança e Termos de utilização
              </button>
            </li>
          </ul>
        </div>

        {/* Métodos de pagamento */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-ink-foreground/50">
            Métodos de pagamento
          </h4>
          <ul className="mt-4 space-y-2.5">
            <li>
              <button
                onClick={() => {
                  onSelectMethod('multicaixa_express');
                  const el = document.getElementById('metodos');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm text-ink-foreground/75 transition-colors hover:text-lime text-left"
              >
                Multicaixa Express
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  onSelectMethod('referencia');
                  const el = document.getElementById('metodos');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm text-ink-foreground/75 transition-colors hover:text-lime text-left"
              >
                Pagamentos por referência
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  onSelectMethod('debito_direto');
                  const el = document.getElementById('metodos');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm text-ink-foreground/75 transition-colors hover:text-lime text-left"
              >
                Débito Direto
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  onSelectMethod('unitel_money');
                  const el = document.getElementById('metodos');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-sm text-ink-foreground/75 transition-colors hover:text-lime text-left"
              >
                UNITEL Money
              </button>
            </li>
          </ul>
        </div>

        {/* Produtos */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-ink-foreground/50">
            Produtos
          </h4>
          <ul className="mt-4 space-y-2.5">
            <li>
              <button
                onClick={onOpenDocs}
                className="text-sm text-ink-foreground/75 transition-colors hover:text-lime text-left"
              >
                Pay by Link
              </button>
            </li>
            <li>
              <button
                onClick={onOpenDocs}
                className="text-sm text-ink-foreground/75 transition-colors hover:text-lime text-left"
              >
                Código QR
              </button>
            </li>
            <li>
              <button
                onClick={onOpenProposal}
                className="text-sm text-ink-foreground/75 transition-colors hover:text-lime text-left"
              >
                Checkout
              </button>
            </li>
            <li>
              <button
                onClick={onOpenProposal}
                className="text-sm text-ink-foreground/75 transition-colors hover:text-lime text-left"
              >
                Gateway marca branca
              </button>
            </li>
            <li>
              <button
                onClick={onOpenProposal}
                className="text-sm text-ink-foreground/75 transition-colors hover:text-lime text-left"
              >
                mPOS
              </button>
            </li>
          </ul>
        </div>

        {/* Ajuda */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-ink-foreground/50">
            Ajuda
          </h4>
          <ul className="mt-4 space-y-2.5">
            <li>
              <button
                onClick={onOpenProposal}
                className="text-sm text-ink-foreground/75 transition-colors hover:text-lime text-left"
              >
                Preços
              </button>
            </li>
            <li>
              <button
                onClick={onOpenFaq}
                className="text-sm text-ink-foreground/75 transition-colors hover:text-lime text-left"
              >
                Questões frequentes
              </button>
            </li>
            <li>
              <button
                onClick={onOpenDocs}
                className="text-sm text-ink-foreground/75 transition-colors hover:text-lime text-left"
              >
                Documentação para developers
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-ink-foreground/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-ink-foreground/40 sm:px-6">
          © 2026 KwanzaPay, S.A. — Todos os direitos reservados
        </p>
      </div>
    </footer>
  );
};
