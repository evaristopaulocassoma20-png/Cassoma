import React from 'react';
import { X, Shield, Globe, Award, CheckCircle2 } from 'lucide-react';

interface InfoModalProps {
  type: 'about' | 'terms' | null;
  onClose: () => void;
  onOpenProposal: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ type, onClose, onOpenProposal }) => {
  if (!type) return null;

  const isAbout = type === 'about';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="info-modal-card"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-2xl text-card-foreground"
      >
        <button
          id="close-info-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Fechar"
        >
          <X className="size-5" />
        </button>

        {isAbout ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
                <Globe className="size-5" />
              </span>
              <div>
                <h2 className="text-2xl font-bold font-display">Saber Mais sobre a KwanzaPay</h2>
                <p className="text-xs text-muted-foreground">
                  A infraestrutura moderna de pagamentos digitais para Angola
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              A <strong className="text-foreground">KwanzaPay</strong> nasceu com o propósito de unificar e modernizar o ecossistema de transações comerciais em Angola. Tradicionalmente, as empresas angolanas enfrentavam integrações fragmentadas, demoradas e complexas para conectar Multicaixa Express, referências bancárias e carteiras móveis como UNITEL Money.
            </p>

            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-2xl bg-secondary/80 border border-border space-y-1.5">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <Award className="size-4" />
                  <span>Uma Única API Unificada</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Elimine a necessidade de contratos múltiplos e integrações isoladas com cada banco ou operadora de telecomunicação.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-secondary/80 border border-border space-y-1.5">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <Shield className="size-4" />
                  <span>Conexão Segura à Rede EMIS</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tratamento de liquidez e liquidação em conformidade com as normas do Banco Nacional de Angola (BNA).
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Sede e Operação em Luanda:</p>
              <p>Av. de Portugal, Ingombota, Luanda — Angola</p>
              <p>Contacto comercial: comercial@kwanzapy.ao • Suporte técnico 24/7</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  onClose();
                  onOpenProposal();
                }}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-95"
              >
                Pedir Proposta Comercial
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
                <Shield className="size-5" />
              </span>
              <div>
                <h2 className="text-2xl font-bold font-display">Termos de Utilização & Segurança</h2>
                <p className="text-xs text-muted-foreground">
                  Conformidade regulatória, PCI-DSS e proteção de dados
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <div className="flex gap-2">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground">Regulamentação BNA:</strong> Operações de facilitação de pagamentos estruturadas de acordo com as diretrizes do Banco Nacional de Angola relativas aos Sistemas de Pagamentos de Angola (SPA).
                </div>
              </div>

              <div className="flex gap-2">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground">Criptografia e Chaves de API:</strong> Todas as transmissões utilizam TLS 1.3 de ponta a ponta. As chaves secretas de produção nunca expiram sem rotação autorizada e são geradas com padrões criptográficos de alta entropia.
                </div>
              </div>

              <div className="flex gap-2">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground">Liquidação e Saldos dos Comerciantes:</strong> Os fundos recebidos são geridos através de contas segregadas em bancos angolanos de primeira linha e repassados de acordo com os ciclos de liquidação acordados (D+0 a D+1).
                </div>
              </div>

              <div className="flex gap-2">
                <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground">Proteção Anti-Fraude e Webhooks:</strong> Todos os eventos de pagamento são validados por assinatura de payload digital, prevenindo injeções ou notificações forjadas.
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-xl bg-secondary px-5 py-2 text-xs font-semibold text-foreground hover:bg-border transition-colors"
              >
                Compreendi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
