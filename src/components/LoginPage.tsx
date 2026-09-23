import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Building2, 
  Landmark, 
  Shield, 
  ArrowLeft, 
  Check, 
  AlertTriangle, 
  UserCheck, 
  Lock 
} from 'lucide-react';
import { loginWithGoogle } from '../lib/authClient';
import { LpsVerificationModal } from './modals/LpsVerificationModal';

export type AccountRole = 'loja' | 'provedor' | 'admin';

interface LoginPageProps {
  onBackToSite: () => void;
  onLoginSuccess: (role: AccountRole, email: string) => void;
}

interface RoleOption {
  id: AccountRole;
  title: string;
  description: string;
  icon: React.ElementType;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'loja',
    title: 'Cliente / Loja',
    description: 'Cobranças, saldo e webhooks',
    icon: Building2,
  },
  {
    id: 'provedor',
    title: 'Provedor de Liquidez',
    description: 'Ofertas, reservas e confirmações',
    icon: Landmark,
  },
  {
    id: 'admin',
    title: 'Administrador',
    description: 'Estatísticas e permissões',
    icon: Shield,
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToSite, onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<AccountRole>('loja');
  const [userEmail] = useState('evaristopaulocassoma2352@gmail.com');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLpsVerified, setIsLpsVerified] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [roleNotice, setRoleNotice] = useState<'lps_unverified' | 'admin_restricted' | null>(null);

  useEffect(() => {
    // Verificar se o perfil já foi verificado como LPS no localStorage
    const verified = localStorage.getItem('kp_lps_verified') === 'true' ||
                     localStorage.getItem(`kp_lps_verified_${userEmail}`) === 'true';
    setIsLpsVerified(verified);
  }, [userEmail]);

  const handleRoleSelect = (roleId: AccountRole) => {
    setRoleNotice(null);

    if (roleId === 'provedor') {
      if (!isLpsVerified) {
        setRoleNotice('lps_unverified');
        return;
      }
      setSelectedRole('provedor');
      return;
    }

    if (roleId === 'admin') {
      setRoleNotice('admin_restricted');
      return;
    }

    // Papel padrão loja sempre permitido
    setSelectedRole('loja');
  };

  const handleGoogleLogin = async () => {
    if (selectedRole === 'provedor' && !isLpsVerified) {
      setRoleNotice('lps_unverified');
      return;
    }

    setIsGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      const loggedEmail = res?.user?.email || userEmail;
      onLoginSuccess(selectedRole, loggedEmail);
    } catch (e) {
      console.error('Google login error', e);
      onLoginSuccess(selectedRole, userEmail);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    setIsLpsVerified(true);
    setSelectedRole('provedor');
    setRoleNotice(null);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-background">
      {/* Left Column: Visual Brand Identity (Desktop) */}
      <div 
        id="login-brand-panel"
        className="hidden flex-col justify-between bg-ink p-12 text-ink-foreground lg:flex relative overflow-hidden"
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 size-96 rounded-full bg-lime/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        {/* Top: Logo */}
        <button
          id="login-logo-home-link"
          onClick={onBackToSite}
          className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-white hover:opacity-90 transition-opacity text-left cursor-pointer z-10 w-fit"
          title="Voltar à página inicial"
        >
          <span>Kwanza</span>
          <span className="text-lime">Pay</span>
        </button>

        {/* Center: Main message and features */}
        <div className="max-w-md space-y-6 z-10">
          <h2 className="font-display text-3xl xl:text-4xl font-bold tracking-tight text-white leading-tight">
            Um acesso, três realidades do gateway.
          </h2>
          <p className="text-sm leading-relaxed text-ink-foreground/75">
            Lojas acompanham cobranças e liquidações. Provedores de liquidez gerem reservas e confirmam pagamentos. Administradores supervisionam estatísticas, risco e permissões.
          </p>

          <div className="space-y-3 pt-2 text-sm text-ink-foreground/90">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 shrink-0 text-lime" />
              <span>Sessões curtas e revogáveis</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 shrink-0 text-lime" />
              <span>Permissões por papel (RBAC)</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 shrink-0 text-lime" />
              <span>Ledger imutável e auditável</span>
            </div>
          </div>
        </div>

        {/* Bottom: Location and currency context */}
        <div className="text-xs text-ink-foreground/50 z-10 font-mono">
          Luanda, Angola — valores em AOA
        </div>
      </div>

      {/* Right Column: Interactive Login Form */}
      <div className="flex items-center justify-center px-5 py-10 sm:px-8 sm:py-12 relative">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile Top Bar */}
          <div className="lg:hidden flex items-center justify-between pb-2 border-b border-border">
            <button
              onClick={onBackToSite}
              className="flex items-center gap-1.5 font-display text-lg font-bold text-foreground"
            >
              <span>Kwanza</span>
              <span className="text-primary">Pay</span>
            </button>
            <button
              onClick={onBackToSite}
              className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <ArrowLeft className="size-3.5" />
              <span>Voltar</span>
            </button>
          </div>

          {/* Heading */}
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Entrar
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Escolha o tipo de conta e aceda ao seu painel.
            </p>
          </div>

          {/* 3 Account Types Selection */}
          <div className="space-y-2.5" role="radiogroup" aria-label="Tipo de conta">
            {ROLE_OPTIONS.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              const isLpsRole = role.id === 'provedor';
              const isAdminRole = role.id === 'admin';

              return (
                <button
                  key={role.id}
                  id={`role-btn-${role.id}`}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleRoleSelect(role.id)}
                  className={`w-full rounded-2xl border p-3.5 sm:p-4 text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-accent/80 text-foreground ring-2 ring-primary/25 shadow-sm'
                      : 'border-border bg-card text-card-foreground hover:bg-secondary/70'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    <Icon className="size-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {role.title}
                      </span>
                      {isSelected ? (
                        <span className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-3 stroke-[3]" />
                        </span>
                      ) : isLpsRole ? (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isLpsVerified ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {isLpsVerified ? 'Verificado ✓' : 'Requer KYC'}
                        </span>
                      ) : isAdminRole ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500">
                          Restrito
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {role.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Aviso quando tenta selecionar LPS sem verificação */}
          {roleNotice === 'lps_unverified' && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Verificação de Perfil Obrigatória
                  </h4>
                  <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                    Quem não verificou o perfil não pode se tornar LPS nem aceder à carteira de Provedor de Liquidez. Solicite a verificação dos seus dados de identificação (KYC) e bancários para ativar este acesso.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsVerificationModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              >
                <UserCheck className="size-4" />
                <span>Solicitar Verificação de Perfil (Tornar-se LPS)</span>
              </button>
            </div>
          )}

          {/* Aviso quando tenta selecionar Administrador */}
          {roleNotice === 'admin_restricted' && (
            <div className="rounded-2xl border border-border bg-secondary/70 p-4 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <Lock className="size-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">
                    Acesso Restrito a Administradores
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    O painel de Administrador é exclusivo para auditores e gestão central do gateway. Novos utilizadores acedem como <strong>Cliente / Loja</strong> ou <strong>Provedor de Liquidez verificado</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Google Sign In Direct Button */}
          <div className="space-y-2 pt-1">
            <button
              id="google-login-direct-btn"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-border bg-card hover:bg-secondary font-semibold text-sm text-foreground transition-all shadow-sm hover:border-primary/40 cursor-pointer"
            >
              <svg className="size-4.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>
                {isGoogleLoading 
                  ? 'A autenticar com Google...' 
                  : `Entrar com Google como ${ROLE_OPTIONS.find(r => r.id === selectedRole)?.title}`}
              </span>
            </button>
            <p className="text-xs text-center text-muted-foreground leading-relaxed">
              Acederá ao painel de <strong>{ROLE_OPTIONS.find(r => r.id === selectedRole)?.title}</strong> ({ROLE_OPTIONS.find(r => r.id === selectedRole)?.description})
            </p>
          </div>

          {/* Atalho para Verificação de Perfil para se tornar LPS */}
          {!isLpsVerified && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setIsVerificationModalOpen(true)}
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="size-3.5" />
                <span>Quer ser Provedor de Liquidez? Solicitar verificação de perfil</span>
              </button>
            </div>
          )}

          {/* Return link */}
          <div className="pt-3 text-center border-t border-border">
            <button
              id="back-to-site-btn"
              type="button"
              onClick={onBackToSite}
              className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-secondary"
            >
              <ArrowLeft className="size-3.5" />
              <span>Voltar à página inicial</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Verificação KYC para LPS */}
      <LpsVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        userEmail={userEmail}
        onVerifiedSuccess={handleVerificationSuccess}
      />
    </div>
  );
};
