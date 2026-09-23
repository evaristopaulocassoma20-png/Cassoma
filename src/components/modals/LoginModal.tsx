import React, { useState } from 'react';
import { X, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProposal: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onOpenProposal }) => {
  const [email, setEmail] = useState('demo@kwanzapay.ao');
  const [password, setPassword] = useState('••••••••••••');
  const [isLogged, setIsLogged] = useState(false);
  const [envMode, setEnvMode] = useState<'sandbox' | 'production'>('sandbox');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogged(true);
  };

  const handleClose = () => {
    setIsLogged(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="login-modal-card"
        className="relative w-full max-w-md rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-2xl text-card-foreground"
      >
        <button
          id="close-login-modal-btn"
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Fechar"
        >
          <X className="size-5" />
        </button>

        {isLogged ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto size-14 rounded-full bg-accent text-primary flex items-center justify-center">
              <CheckCircle className="size-7" />
            </div>
            <h3 className="text-xl font-bold font-display">Bem-vindo ao Portal KwanzaPay</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Autenticado em <strong className="text-foreground uppercase">{envMode}</strong>. O painel unificado de liquidação e gestão de chaves de API para comerciantes angolanos está operacional.
            </p>
            <div className="rounded-xl bg-secondary p-3 text-left font-mono text-xs text-muted-foreground space-y-1">
              <p>• Comerciante: Loja Demo Luanda</p>
              <p>• Saldo Liquidado: 4.850.200 AOA</p>
              <p>• Webhook: Ativo (HTTP 200)</p>
            </div>
            <button
              onClick={handleClose}
              className="mt-2 w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90"
            >
              Fechar Painel Demo
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Lock className="size-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Portal do Comerciante
              </span>
            </div>

            <h2 className="text-2xl font-bold font-display">Entrar na KwanzaPay</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Aceda ao seu dashboard de transações, extratos EMIS e chaves de API.
            </p>

            <div className="flex rounded-xl bg-secondary p-1 my-5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setEnvMode('sandbox')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  envMode === 'sandbox' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Ambiente Sandbox (Testes)
              </button>
              <button
                type="button"
                onClick={() => setEnvMode('production')}
                className={`flex-1 py-1.5 rounded-lg transition-colors ${
                  envMode === 'production' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Produção (Live)
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Palavra-passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="size-3.5 text-primary" /> Protegido com 2FA
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProposal();
                  }}
                  className="text-primary hover:underline font-semibold"
                >
                  Criar conta de comerciante
                </button>
              </div>

              <button
                type="submit"
                className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 transition-transform hover:scale-[1.01]"
              >
                <span>Aceder ao Painel</span>
                <ArrowRight className="size-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
