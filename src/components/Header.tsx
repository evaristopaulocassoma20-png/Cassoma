import React, { useState } from 'react';
import { Zap, BookOpen, Menu, X } from 'lucide-react';

interface HeaderProps {
  onOpenDocs: () => void;
  onOpenProposal: () => void;
  onOpenLogin: () => void;
  onOpenInfo: (type: 'about' | 'terms') => void;
  onOpenCheckout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDocs,
  onOpenProposal,
  onOpenLogin,
  onOpenInfo,
  onOpenCheckout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.location.hash) {
      window.history.pushState(null, '', window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <a href="#topo" onClick={handleLogoClick} className="flex items-center gap-2 group cursor-pointer">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
            <Zap className="size-4" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            Kwanza<span className="text-primary">Pay</span>
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground lg:flex">
          <a href="#metodos" className="transition-colors hover:text-foreground">
            Métodos
          </a>
          <a href="#como-funciona" className="transition-colors hover:text-foreground">
            Como funciona
          </a>
          <a href="#vantagens" className="transition-colors hover:text-foreground">
            Vantagens
          </a>
          {onOpenCheckout && (
            <button
              onClick={onOpenCheckout}
              className="transition-colors hover:text-foreground text-left flex items-center gap-1 text-primary font-semibold"
            >
              <span>Demo Checkout</span>
            </button>
          )}
          <button
            onClick={onOpenDocs}
            className="transition-colors hover:text-foreground text-left"
          >
            Documentação
          </button>
          <button
            onClick={() => onOpenInfo('about')}
            className="transition-colors hover:text-foreground text-left"
          >
            Saber mais
          </button>
          <button
            onClick={() => onOpenInfo('terms')}
            className="transition-colors hover:text-foreground text-left"
          >
            Termos
          </button>
        </nav>

        {/* Desktop Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="header-docs-api-btn"
            onClick={onOpenDocs}
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:inline-flex border border-border/60 hover:border-primary/40 shadow-xs"
            title="Acessar Documentação da API e Dev Dashboard com Conta Google"
          >
            <BookOpen className="size-4 text-primary" />
            <span>Docs API</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold flex items-center gap-1">
              <svg className="size-2.5 inline" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Dev
            </span>
          </button>

          <button
            id="header-login-btn"
            onClick={onOpenLogin}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Entrar
          </button>

          <button
            id="header-proposal-btn"
            onClick={onOpenProposal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            Pedir proposta
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary lg:hidden"
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-background px-4 py-5 lg:hidden animate-in slide-in-from-top-2">
          <div className="flex flex-col gap-3 text-sm font-medium">
            <a
              href="#metodos"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 text-muted-foreground hover:text-foreground"
            >
              Métodos
            </a>
            <a
              href="#como-funciona"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 text-muted-foreground hover:text-foreground"
            >
              Como funciona
            </a>
            <a
              href="#vantagens"
              onClick={() => setMobileMenuOpen(false)}
              className="px-2 py-1.5 text-muted-foreground hover:text-foreground"
            >
              Vantagens
            </a>
            {onOpenCheckout && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenCheckout();
                }}
                className="text-left px-2 py-1.5 text-primary font-semibold hover:text-foreground"
              >
                Demo Checkout
              </button>
            )}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenDocs();
              }}
              className="text-left px-2 py-1.5 text-muted-foreground hover:text-foreground flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="size-4 text-primary" /> Documentação API
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">Login Google</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenInfo('about');
              }}
              className="text-left px-2 py-1.5 text-muted-foreground hover:text-foreground"
            >
              Saber mais
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenInfo('terms');
              }}
              className="text-left px-2 py-1.5 text-muted-foreground hover:text-foreground"
            >
              Termos
            </button>
            <div className="pt-2 border-t border-border flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="w-full text-center py-2 text-sm font-medium border border-border rounded-xl"
              >
                Entrar no Portal
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenProposal();
                }}
                className="w-full text-center py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl"
              >
                Pedir proposta comercial
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
