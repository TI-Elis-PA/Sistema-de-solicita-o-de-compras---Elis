export type OrderStatus = 'Pendente' | 'Em Análise' | 'Aprovado' | 'Rejeitado';

export type ProductCategory = 'TI' | 'Material de Escritório' | 'Infraestrutura' | 'Serviços' | 'Outros';

export interface OrderItem {
  id: string;
  order_id: string;
  nome_produto: string;
  quantidade: number;
  preco_unitario: number; // R$
  categoria: ProductCategory;
}

export interface AssinaturaDigital {
  gestora: string;
  acao: 'Aprovação' | 'Rejeição' | 'Exclusão';
  dataHora: string;
  hash: string;
}

export interface AuditEntry {
  id: string;
  order_id: string;
  acao: 'Criação' | 'Aprovação' | 'Rejeição' | 'Edição' | 'Exclusão' | 'Em Análise';
  responsavel: string;
  dataHora: string;
  detalhes?: string;
}

export interface Order {
  id: string;
  solicitante: string;
  departamento: string;
  data_criacao: string;
  status: OrderStatus;
  total_itens: number;
  valor_total: number; // R$
  items: OrderItem[];
  justificativa?: string;
  observacao?: string;
  assinatura?: AssinaturaDigital;
}
