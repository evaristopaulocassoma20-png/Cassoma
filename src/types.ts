export type PaymentMethodId = 'multicaixa_express' | 'referencia' | 'debito_direto' | 'unitel_money';

export interface PaymentMethodItem {
  id: PaymentMethodId;
  title: string;
  tag?: string;
  description: string;
  iconName: 'smartphone' | 'file-code-corner' | 'repeat' | 'wallet';
  endpointPayload: {
    method: string;
    requestSnippet: string;
    responseSnippet: string;
  };
}

export interface WorkflowStep {
  stepNumber: string;
  actor: 'Cliente' | 'Loja' | 'PAY' | 'LP';
  title: string;
  description: string;
  iconName: 'smartphone' | 'store' | 'zap' | 'wallet' | 'circle-check' | 'credit-card';
}

export interface AdvantageItem {
  number: string;
  title: string;
  description: string;
  iconName: 'layers' | 'code-xml' | 'workflow';
}

export interface FaqItem {
  question: string;
  answer: string;
  category: 'Geral' | 'Técnico' | 'Comercial';
}
