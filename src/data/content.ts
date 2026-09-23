import { PaymentMethodItem, WorkflowStep, AdvantageItem, FaqItem } from '../types';

export const METRICS = [
  { value: '99,9%', label: 'disponibilidade' },
  { value: '< 300ms', label: 'resposta média' },
  { value: '4', label: 'métodos de pagamento' },
];

export const MARQUEE_ITEMS = [
  'Multicaixa Express (GPO)',
  'Pagamentos por Referência',
  'Débito Direto',
  'UNITEL Money',
  'Multicaixa Express (GPO)',
  'Pagamentos por Referência',
  'Débito Direto',
  'UNITEL Money',
];

export const PAYMENT_METHODS: PaymentMethodItem[] = [
  {
    id: 'multicaixa_express',
    title: 'Multicaixa Express (GPO)',
    description: 'Pagamentos móveis instantâneos com confirmação em tempo real.',
    iconName: 'smartphone',
    endpointPayload: {
      method: 'multicaixa_express',
      requestSnippet: `POST /v1/charges
{
  "amount": 12500,
  "currency": "AOA",
  "method": "multicaixa_express",
  "customer": {
    "phone": "+244 923 456 789"
  },
  "webhook_url": "https://loja.ao/hooks/pay"
}`,
      responseSnippet: `# 201 Created
{
  "id": "chg_9f2k71la8",
  "status": "pending",
  "reference": "001 882 441",
  "amount": 12500,
  "currency": "AOA",
  "expires_in": 300,
  "created_at": "2026-09-14T18:40:12Z"
}`
    }
  },
  {
    id: 'referencia',
    title: 'Pagamentos por Referência',
    description: 'Gere referências multibanco e receba notificações automáticas.',
    iconName: 'file-code-corner',
    endpointPayload: {
      method: 'multicaixa_reference',
      requestSnippet: `POST /v1/charges
{
  "amount": 45000,
  "currency": "AOA",
  "method": "multicaixa_reference",
  "customer": {
    "name": "Kwanza Comércio Lda",
    "email": "financeiro@cliente.ao"
  },
  "webhook_url": "https://loja.ao/hooks/pay"
}`,
      responseSnippet: `# 201 Created
{
  "id": "chg_ref48821a",
  "status": "pending",
  "entity": "00112",
  "reference": "921 445 109",
  "amount": 45000,
  "currency": "AOA",
  "valid_until": "2026-09-17T23:59:59Z"
}`
    }
  },
  {
    id: 'debito_direto',
    title: 'Débito Direto',
    description: 'Cobranças recorrentes autorizadas diretamente na conta do cliente.',
    iconName: 'repeat',
    endpointPayload: {
      method: 'direct_debit',
      requestSnippet: `POST /v1/charges
{
  "amount": 28000,
  "currency": "AOA",
  "method": "direct_debit",
  "mandate_id": "mnd_8831920",
  "customer": {
    "iban": "AO06.0040.0000.1234.5678.9012.3"
  },
  "webhook_url": "https://loja.ao/hooks/pay"
}`,
      responseSnippet: `# 201 Created
{
  "id": "chg_dd_1892",
  "status": "processing",
  "mandate_status": "authorized",
  "settlement_expected": "D+1",
  "amount": 28000,
  "currency": "AOA"
}`
    }
  },
  {
    id: 'unitel_money',
    title: 'UNITEL Money',
    description: 'Carteira móvel para cobranças rápidas em todo o país.',
    iconName: 'wallet',
    endpointPayload: {
      method: 'unitel_money',
      requestSnippet: `POST /v1/charges
{
  "amount": 5000,
  "currency": "AOA",
  "method": "unitel_money",
  "customer": {
    "phone": "+244 923 000 111"
  },
  "webhook_url": "https://loja.ao/hooks/pay"
}`,
      responseSnippet: `# 201 Created
{
  "id": "chg_um_77192",
  "status": "pending_push",
  "wallet_phone": "+244 923 000 111",
  "amount": 5000,
  "currency": "AOA"
}`
    }
  }
];

export const WORKFLOW_PIPELINE = [
  'Cliente',
  'Loja',
  'PAY',
  'LP',
  'Pagamento confirmado',
  'Liquidação',
  'Loja recebe saldo'
];

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    stepNumber: '01',
    actor: 'Cliente',
    title: 'Cliente inicia o pagamento',
    description: 'O cliente inicia um pagamento na loja, escolhendo o método que preferir.',
    iconName: 'smartphone'
  },
  {
    stepNumber: '02',
    actor: 'Loja',
    title: 'Loja envia a operação ao PAY',
    description: 'A loja chama a API do PAY, que cria a operação e gera um código único.',
    iconName: 'store'
  },
  {
    stepNumber: '03',
    actor: 'PAY',
    title: 'PAY reserva a liquidez',
    description: 'O PAY encontra um Provedor de Liquidez (LP) disponível e reserva o valor necessário.',
    iconName: 'zap'
  },
  {
    stepNumber: '04',
    actor: 'LP',
    title: 'LP fornece os dados de pagamento',
    description: 'O LP fornece o método e os dados para o cliente efetuar o pagamento.',
    iconName: 'wallet'
  },
  {
    stepNumber: '05',
    actor: 'LP',
    title: 'Pagamento confirmado',
    description: 'O cliente realiza o pagamento e o LP verifica e confirma que recebeu o dinheiro.',
    iconName: 'circle-check'
  },
  {
    stepNumber: '06',
    actor: 'PAY',
    title: 'PAY liquida a operação',
    description: 'O PAY liquida a operação e adiciona o valor ao saldo da Loja.',
    iconName: 'credit-card'
  },
  {
    stepNumber: '07',
    actor: 'Loja',
    title: 'Loja recebe a confirmação',
    description: 'A loja recebe a confirmação através da API ou webhook, em tempo real.',
    iconName: 'store'
  }
];

export const ADVANTAGES: AdvantageItem[] = [
  {
    number: '01',
    title: 'Flexibilidade na integração',
    description: 'A integração via API oferece maior flexibilidade na implementação do fluxo de cobrança para os diferentes métodos de pagamento disponíveis, dentro da sua loja ou software de gestão.',
    iconName: 'layers'
  },
  {
    number: '02',
    title: 'Autonomia para os developers',
    description: 'Documentação clara, ambiente de testes e SDKs para que a sua equipa construa o fluxo de pagamento ideal sem depender de terceiros.',
    iconName: 'code-xml'
  },
  {
    number: '03',
    title: 'Automatização de processos',
    description: 'Webhooks, reconciliação automática e notificações em tempo real para eliminar tarefas manuais e reduzir erros operacionais.',
    iconName: 'workflow'
  }
];

export const FAQS: FaqItem[] = [
  {
    question: 'Como funciona a integração com a rede Multicaixa (EMIS)?',
    answer: 'A nossa infraestrutura está conectada aos protocolos oficiais do sistema de pagamentos de Angola (GPO/EMIS). Ao chamar a API KwanzaPay, tratamos da comunicação com a rede bancária angolana de forma transparente, permitindo aceitar Multicaixa Express e gerar referências válidas em todos os caixas automáticos e internet banking do país.',
    category: 'Técnico'
  },
  {
    question: 'Quais são os prazos de liquidação para a minha conta bancária?',
    answer: 'Para Multicaixa Express e UNITEL Money, a confirmação é instantânea e a liquidação em conta comercial ocorre em D+0 ou D+1 conforme o plano acordado com a sua empresa. Referências multibanco liquidam assim que compensadas pela rede interbancária.',
    category: 'Comercial'
  },
  {
    question: 'Existe ambiente de testes (Sandbox) para desenvolvimento?',
    answer: 'Sim! Disponibilizamos chaves de API para o ambiente Sandbox com números de telefone de teste para Multicaixa Express e gerador de referências fictícias para validação completa dos seus webhooks antes de ir para produção.',
    category: 'Técnico'
  },
  {
    question: 'Como são processados os Webhooks e confirmações em tempo real?',
    answer: 'Assim que o pagamento for concluído pelo cliente no telemóvel ou no Multicaixa, o PAY dispara uma requisição POST HTTPS assinada digitalmente com HMAC-SHA256 para o seu `webhook_url`. Em caso de falha de conexão com o seu servidor, temos política de retry exponencial por até 48 horas.',
    category: 'Técnico'
  },
  {
    question: 'A KwanzaPay opera em conformidade com o Banco Nacional de Angola (BNA)?',
    answer: 'Sim. A arquitetura da KwanzaPay segue rigorosamente as diretrizes regulatórias do BNA para Instituições Prestadoras de Serviços de Pagamentos (IPSP), normas de prevenção ao branqueamento de capitais e padrões internacionais de segurança de dados PCI-DSS.',
    category: 'Geral'
  }
];
