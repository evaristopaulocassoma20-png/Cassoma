import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { PaymentMethods } from './components/PaymentMethods';
import { HowPayWorks } from './components/HowPayWorks';
import { BannerCTA } from './components/BannerCTA';
import { Advantages } from './components/Advantages';
import { ReadySection } from './components/ReadySection';
import { Footer } from './components/Footer';

import { ProposalModal } from './components/modals/ProposalModal';
import { DocsModal } from './components/modals/DocsModal';
import { FaqModal } from './components/modals/FaqModal';
import { InfoModal } from './components/modals/InfoModal';
import { LoginPage, AccountRole } from './components/LoginPage';
import { DashboardPage } from './components/DashboardPage';
import { LPWalletDashboard } from './components/LPWalletDashboard';
import { LojaWalletDashboard } from './components/LojaWalletDashboard';
import { UnifiedDashboard, DashboardTab } from './components/UnifiedDashboard';
import { CheckoutPage } from './components/CheckoutPage';
import { loginWithGoogle } from './lib/authClient';

export type AppView = 'landing' | 'login' | 'dashboard' | 'checkout';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [activeRole, setActiveRole] = useState<AccountRole>('loja');
  const [userEmail, setUserEmail] = useState('evaristopaulocassoma2352@gmail.com');
  const [checkoutToken, setCheckoutToken] = useState<string>('');
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
  const [isAuthenticatingGoogle, setIsAuthenticatingGoogle] = useState(false);

  const [isProposalOpen, setIsProposalOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [infoType, setInfoType] = useState<'about' | 'terms' | null>(null);

  // Sync with window hash on load and popstate
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace('#', '');
      if (rawHash === 'login' || rawHash === 'entrar') {
        setCurrentView('login');
      } else if (rawHash === 'painel' || rawHash === 'dashboard') {
        setCurrentView('dashboard');
      } else if (rawHash.startsWith('checkout')) {
        setCurrentView('checkout');
        const queryPart = rawHash.includes('?') ? rawHash.split('?')[1] : '';
        const params = new URLSearchParams(queryPart);
        const token = params.get('token') || '';
        setCheckoutToken(token);
      } else if (!rawHash) {
        setCurrentView('landing');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view: AppView, token?: string) => {
    setCurrentView(view);
    if (view === 'login') {
      window.location.hash = 'login';
    } else if (view === 'dashboard') {
      window.location.hash = 'painel';
    } else if (view === 'checkout') {
      setCheckoutToken(token || '');
      window.location.hash = token ? `checkout?token=${token}` : 'checkout';
    } else {
      if (window.location.hash) {
        window.history.pushState(null, '', window.location.pathname);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (role: AccountRole, email: string) => {
    const isVerified = localStorage.getItem('kp_lps_verified') === 'true' || 
                       localStorage.getItem(`kp_lps_verified_${email}`) === 'true';

    // Se o usuário tentar entrar como provedor sem ter perfil verificado, vai para Cliente / Loja
    if (role === 'provedor' && !isVerified) {
      setActiveRole('loja');
    } else {
      setActiveRole(role);
    }
    setUserEmail(email);
    setActiveTab('dashboard');
    navigateTo('dashboard');
  };

  const handleChangeRole = (newRole: AccountRole) => {
    const isVerified = localStorage.getItem('kp_lps_verified') === 'true' || 
                       localStorage.getItem(`kp_lps_verified_${userEmail}`) === 'true';
    if (newRole === 'provedor' && !isVerified) {
      setActiveRole('loja');
      return;
    }
    setActiveRole(newRole);
  };

  const handleOpenDocsWithGoogle = async (targetTab: DashboardTab = 'documentacao') => {
    setIsAuthenticatingGoogle(true);
    try {
      const res = await loginWithGoogle();
      if (res?.user?.email) {
        setUserEmail(res.user.email);
        setActiveRole('loja');
      }
    } catch (err) {
      console.error('Google auth error', err);
    } finally {
      setIsAuthenticatingGoogle(false);
      setActiveTab(targetTab);
      navigateTo('dashboard');
    }
  };

  const handleSelectMethod = (methodId: string) => {
    setIsDocsOpen(true);
  };

  // If in Checkout view
  if (currentView === 'checkout') {
    return (
      <CheckoutPage
        initialToken={checkoutToken}
        onBackToSite={() => navigateTo('landing')}
      />
    );
  }

  // If in Login view
  if (currentView === 'login') {
    return (
      <LoginPage
        onBackToSite={() => navigateTo('landing')}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // If in Dashboard view
  if (currentView === 'dashboard') {
    if (activeRole === 'provedor') {
      return (
        <LPWalletDashboard
          userEmail={userEmail}
          onLogout={() => navigateTo('login')}
          onBackToSite={() => navigateTo('landing')}
          onChangeRole={handleChangeRole}
        />
      );
    }

    if (activeRole === 'admin') {
      return (
        <DashboardPage
          role="admin"
          userEmail={userEmail}
          onLogout={() => navigateTo('login')}
          onBackToSite={() => navigateTo('landing')}
          onChangeRole={handleChangeRole}
        />
      );
    }

    return (
      <UnifiedDashboard
        userEmail={userEmail}
        initialSection={activeTab}
        onLogout={() => {
          setActiveTab('dashboard');
          navigateTo('login');
        }}
        onBackToSite={() => navigateTo('landing')}
        onOpenCheckoutWithToken={(token) => navigateTo('checkout', token)}
        onChangeRole={handleChangeRole}
      />
    );
  }

  // Landing Page View
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-lime selection:text-ink relative">
      {/* Loading Modal while authenticating Google */}
      {isAuthenticatingGoogle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 max-w-sm text-center">
            <div className="size-12 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
            <div>
              <h3 className="text-base font-bold text-foreground">A autenticar com Google...</h3>
              <p className="text-xs text-muted-foreground mt-1">
                A carregar a documentação da API e o painel de desenvolvedor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Header
        onOpenDocs={() => handleOpenDocsWithGoogle('documentacao')}
        onOpenProposal={() => setIsProposalOpen(true)}
        onOpenLogin={() => navigateTo('login')}
        onOpenInfo={(type) => setInfoType(type)}
        onOpenCheckout={() => navigateTo('checkout')}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <Hero
          onOpenDocs={() => handleOpenDocsWithGoogle('documentacao')}
          onOpenProposal={() => setIsProposalOpen(true)}
        />

        {/* Payment Methods Section */}
        <PaymentMethods
          onSelectMethod={handleSelectMethod}
        />

        {/* How PAY Works Pipeline */}
        <HowPayWorks />

        {/* Banner CTA */}
        <BannerCTA
          onOpenDocs={() => handleOpenDocsWithGoogle('documentacao')}
          onOpenProposal={() => setIsProposalOpen(true)}
        />

        {/* Advantages Section */}
        <Advantages
          onOpenFaq={() => setIsFaqOpen(true)}
        />

        {/* Ready to Accept Payments Section */}
        <ReadySection
          onOpenDocs={() => handleOpenDocsWithGoogle('documentacao')}
          onOpenProposal={() => setIsProposalOpen(true)}
        />
      </main>

      {/* Footer */}
      <Footer
        onOpenDocs={() => handleOpenDocsWithGoogle('documentacao')}
        onOpenProposal={() => setIsProposalOpen(true)}
        onOpenFaq={() => setIsFaqOpen(true)}
        onOpenInfo={(type) => setInfoType(type)}
        onSelectMethod={handleSelectMethod}
      />

      {/* Modals & Dialogs */}
      <ProposalModal
        isOpen={isProposalOpen}
        onClose={() => setIsProposalOpen(false)}
      />

      <DocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />

      <FaqModal
        isOpen={isFaqOpen}
        onClose={() => setIsFaqOpen(false)}
        onOpenProposal={() => setIsProposalOpen(true)}
      />

      <InfoModal
        type={infoType}
        onClose={() => setInfoType(null)}
        onOpenProposal={() => setIsProposalOpen(true)}
      />
    </div>
  );
}
