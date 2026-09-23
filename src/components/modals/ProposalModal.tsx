import React, { useState } from 'react';
import { X, CheckCircle, Send, Building2, Phone, Mail, FileText, ArrowRight } from 'lucide-react';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    nif: '',
    contactName: '',
    email: '',
    phone: '',
    monthlyVolume: '5.000.000 - 20.000.000 AOA',
    methods: ['multicaixa_express', 'referencia'],
    message: ''
  });

  if (!isOpen) return null;

  const toggleMethod = (id: string) => {
    setFormData(prev => ({
      ...prev,
      methods: prev.methods.includes(id)
        ? prev.methods.filter(m => m !== id)
        : [...prev.methods, id]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="proposal-modal-card"
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-2xl text-card-foreground"
      >
        <button
          id="close-proposal-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Fechar"
        >
          <X className="size-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto size-16 rounded-full bg-accent text-primary flex items-center justify-center">
              <CheckCircle className="size-8" />
            </div>
            <h3 className="text-2xl font-bold font-display">Proposta Solicitada com Sucesso!</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
              Obrigado, <strong className="text-foreground">{formData.contactName || formData.companyName}</strong>. A nossa equipa comercial da KwanzaPay em Luanda entrará em contacto nas próximas 2 horas úteis através de <span className="text-primary font-mono">{formData.email || 'comercial@kwanzapay.ao'}</span>.
            </p>
            <div className="p-4 rounded-xl bg-secondary text-left text-xs space-y-1.5 text-muted-foreground font-mono">
              <p>• Empresa: {formData.companyName || 'Registada'}</p>
              <p>• NIF: {formData.nif || 'Consumidor Final / Lda'}</p>
              <p>• Métodos solicitados: {formData.methods.join(', ') || 'Todos os métodos'}</p>
              <p>• SLA Comercial: Resposta em &lt; 2 horas úteis</p>
            </div>
            <button
              id="confirm-proposal-done-btn"
              onClick={handleReset}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Concluir
            </button>
          </div>
        ) : (
          <div>
            <div className="pr-8">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                Comercial & Parcerias
              </span>
              <h2 className="mt-2 text-2xl font-bold font-display text-balance">
                Pedir Proposta Comercial KwanzaPay
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Receba taxas personalizadas de liquidação para o seu volume de vendas em Angola.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Nome da Empresa *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <input
                      required
                      type="text"
                      placeholder="Ex: Luanda Retail, Lda"
                      value={formData.companyName}
                      onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    NIF da Empresa *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <input
                      required
                      type="text"
                      placeholder="Ex: 5417009823"
                      value={formData.nif}
                      onChange={e => setFormData({ ...formData, nif: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Email Corporativo *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <input
                      required
                      type="email"
                      placeholder="financeiro@empresa.ao"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Contacto Telefónico (+244) *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                    <input
                      required
                      type="tel"
                      placeholder="+244 9XX XXX XXX"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Volume Mensal Estimado em Kwanzas (AOA)
                </label>
                <select
                  value={formData.monthlyVolume}
                  onChange={e => setFormData({ ...formData, monthlyVolume: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Ate 5.000.000 AOA">Até 5.000.000 AOA / mês</option>
                  <option value="5.000.000 - 20.000.000 AOA">5.000.000 a 20.000.000 AOA / mês</option>
                  <option value="20.000.000 - 100.000.000 AOA">20.000.000 a 100.000.000 AOA / mês</option>
                  <option value="+ 100.000.000 AOA">Superior a 100.000.000 AOA / mês (Enterprise)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Métodos de Pagamento Pretendidos
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'multicaixa_express', label: 'Multicaixa Express (GPO)' },
                    { id: 'referencia', label: 'Pagamentos por Referência' },
                    { id: 'debito_direto', label: 'Débito Direto' },
                    { id: 'unitel_money', label: 'UNITEL Money' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMethod(m.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                        formData.methods.includes(m.id)
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border bg-background text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      <div className={`size-4 rounded flex items-center justify-center border text-[10px] ${
                        formData.methods.includes(m.id)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-muted-foreground/40'
                      }`}>
                        {formData.methods.includes(m.id) && '✓'}
                      </div>
                      <span className="truncate">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Observações adicionais (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Integração com WooCommerce, ERP Primavera ou App móvel proprietária..."
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background p-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  id="submit-proposal-form-btn"
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 transition-transform hover:scale-[1.02]"
                >
                  <Send className="size-4" />
                  Enviar Pedido de Proposta
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
