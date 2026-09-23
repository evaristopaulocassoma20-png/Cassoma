import React from 'react';
import { Smartphone, QrCode, Repeat, Wallet, ArrowUpRight } from 'lucide-react';
import { PAYMENT_METHODS } from '../data/content';

interface PaymentMethodsProps {
  onSelectMethod: (methodId: string) => void;
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({ onSelectMethod }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'smartphone':
        return <Smartphone className="size-5" />;
      case 'file-code-corner':
        return <QrCode className="size-5" />;
      case 'repeat':
        return <Repeat className="size-5" />;
      case 'wallet':
        return <Wallet className="size-5" />;
      default:
        return <Smartphone className="size-5" />;
    }
  };

  return (
    <section id="metodos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          Integração com vários métodos de pagamento
        </p>
        <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          A nossa API permite integrar todos os métodos de pagamento disponíveis.
        </h2>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PAYMENT_METHODS.map((method) => (
          <div
            key={method.id}
            id={`payment-method-card-${method.id}`}
            onClick={() => onSelectMethod(method.id)}
            className="group relative cursor-pointer rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {getIcon(method.iconName)}
              </span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                <ArrowUpRight className="size-4" />
              </span>
            </div>

            <h3 className="font-display mt-4 font-bold text-foreground">
              {method.title}
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {method.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
