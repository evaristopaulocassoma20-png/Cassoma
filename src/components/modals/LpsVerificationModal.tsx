import React, { useState } from 'react';
import { X, ShieldCheck, Building, FileText, CheckCircle2, AlertCircle, ArrowRight, UserCheck, Phone, CreditCard } from 'lucide-react';

interface LpsVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onVerifiedSuccess: () => void;
}

export const LpsVerificationModal: React.FC<LpsVerificationModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onVerifiedSuccess,
}) => {
  const [fullName, setFullName] = useState('Evaristo Paulo Cassoma');
  const [biNumber, setBiNumber] = useState('007894521LA042');
  const [phone, setPhone] = useState('+244 923 456 789');
  const [bank, setBank] = useState('BAI - Banco Angolano de Investimentos');
  const [iban, setIban] = useState('AO06.0040.0000.1234.5678.9012.3');
  const [intendedLiquidity, setIntendedLiquidity] = useState('500000');
  const [ibanProofFile, setIbanProofFile] = useState<File | null>(null);
  const [ibanProofName, setIbanProofName] = useState<string>('');
  const [ibanProofError, setIbanProofError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleIbanProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIbanProofError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação estrita de formato bancário (PDF apenas) e tamanho máximo 5MB
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setIbanProofError('Apenas comprovativos em formato PDF oficial emitidos pelo banco são aceites.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setIbanProofError('O arquivo excede o limite máximo de 5MB permitido.');
      e.target.value = '';
      return;
    }

    setIbanProofFile(file);
    setIbanProofName(file.name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) return;

    setIsSubmitting(true);
    setTimeout(() => {
      // Salva verificação no localStorage para o usuário
      const verificationRecord = {
        email: userEmail,
        fullName,
        biNumber,
        phone,
        bank,
        iban,
        intendedLiquidity,
        verifiedAt: new Date().toISOString(),
        status: 'verified',
      };
      localStorage.setItem(`kp_lps_verified_${userEmail}`, 'true');
      localStorage.setItem('kp_lps_verified', 'true');
      localStorage.setItem(`kp_lps_data_${userEmail}`, JSON.stringify(verificationRecord));

      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        onVerifiedSuccess();
        onClose();
      }, 1400);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="lps-verification-modal-card"
        className="relative w-full max-w-lg rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-2xl text-card-foreground max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Fechar"
        >
          <X className="size-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center animate-bounce">
              <CheckCircle2 className="size-10" />
            </div>
            <h3 className="text-2xl font-bold font-display text-foreground">
              Perfil Verificado com Sucesso!
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              O seu perfil de conformidade KYC foi validado. A sua conta agora está autorizada a atuar como <strong className="text-foreground">Provedor de Liquidez (LPS)</strong> na rede KwanzaPay.
            </p>
            <div className="rounded-2xl bg-secondary/70 border border-border p-4 text-xs font-mono text-left space-y-1 text-foreground">
              <p>• Titular: {fullName}</p>
              <p>• BI / NIF: {biNumber}</p>
              <p>• Banco: {bank}</p>
              <p>• Estado: <span className="text-primary font-bold">AUTORIZADO & ATIVO</span></p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-xs mb-3">
                <ShieldCheck className="size-4" />
                <span>Verificação de Perfil (KYC) • Acesso LPS</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
                Solicitar Verificação de Perfil
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Por exigência regulamentar do BNA e segurança do ecossistema P2P, apenas contas com perfil verificado podem fornecer liquidez e gerir reservas de custódia.
              </p>
            </div>

            {/* Aviso de Requisitos */}
            <div className="rounded-2xl bg-secondary/60 border border-border p-4 text-xs text-muted-foreground flex items-start gap-3">
              <AlertCircle className="size-4 shrink-0 text-primary mt-0.5" />
              <span>
                A verificação associa o seu NIF/BI e IBAN bancário à sua carteira KwanzaPay para garantir a liquidação imediata em caso de disputas.
              </span>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Nome Completo (Conforme BI)
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Nº do Bilhete de Identidade / NIF
                  </label>
                  <input
                    type="text"
                    required
                    value={biNumber}
                    onChange={(e) => setBiNumber(e.target.value)}
                    placeholder="000000000LA000"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Telemóvel / WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Banco Angolano Principal
                </label>
                <select
                  value={bank}
                  onChange={(e) => setBank(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="BAI - Banco Angolano de Investimentos">BAI - Banco Angolano de Investimentos</option>
                  <option value="BFA - Banco de Fomento Angola">BFA - Banco de Fomento Angola</option>
                  <option value="BIC - Banco BIC Angola">BIC - Banco BIC Angola</option>
                  <option value="Millennium Atlântico">Millennium Atlântico</option>
                  <option value="Standard Bank Angola">Standard Bank Angola</option>
                  <option value="BPC - Banco de Poupança e Crédito">BPC - Banco de Poupança e Crédito</option>
                  <option value="Banco Sol">Banco Sol</option>
                  <option value="Outro Banco Regulado EMIS">Outro Banco Regulado EMIS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  IBAN Angolano (para reconciliação bancária)
                </label>
                <input
                  type="text"
                  required
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-mono text-xs"
                />
              </div>

              {/* Conformidade Bancária: Comprovativo de Titularidade do IBAN (PDF do Banco) */}
              <div className="p-3.5 rounded-2xl border border-primary/30 bg-primary/5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-foreground flex items-center gap-1.5">
                    <FileText className="size-3.5 text-primary" />
                    <span>Comprovativo de Titularidade do IBAN (PDF Oficial) *</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                    PDF • Máx 5MB
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Para prevenir inconsistências entre o NIF e a titularidade da conta (mitigação de fraudes fiscais e laranjas), anexe a declaração de titularidade de IBAN emitida pelo seu banco (Internet Banking ou balcão).
                </p>
                <input
                  type="file"
                  required
                  accept="application/pdf,.pdf"
                  onChange={handleIbanProofChange}
                  className="w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer"
                />
                {ibanProofName && (
                  <p className="text-[11px] text-primary flex items-center gap-1 font-mono">
                    <CheckCircle2 className="size-3" />
                    Arquivo anexado: {ibanProofName}
                  </p>
                )}
                {ibanProofError && (
                  <p className="text-[11px] text-destructive flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    {ibanProofError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Montante Estimado de Reserva de Liquidez Inicial (AOA)
                </label>
                <input
                  type="number"
                  required
                  min="50000"
                  step="10000"
                  value={intendedLiquidity}
                  onChange={(e) => setIntendedLiquidity(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                />
              </div>

              {/* Declaração de Aceite */}
              <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer pt-1">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary"
                />
                <span>
                  Declaro que as informações prestadas são verídicas, possuo capacidade financeira para operar como Provedor de Liquidez e aceito os termos do Contrato de Custódia e Escrow da KwanzaPay.
                </span>
              </label>

              {/* Ações */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!termsAccepted || isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="size-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                      <span>A validar perfil...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="size-4" />
                      <span>Ativar e Verificar Perfil</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
