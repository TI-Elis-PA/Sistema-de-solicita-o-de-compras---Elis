"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Save, FileText, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useOrders } from '@/hooks/useOrders';
import { useAuditLog } from '@/hooks/useAuditLog';
import { showToast } from '@/hooks/useToast';
import { Order, OrderItem, ProductCategory } from '@/types';

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'TI', label: 'TI' },
  { value: 'Material de Escritório', label: 'Material de Escritório' },
  { value: 'Infraestrutura', label: 'Infraestrutura' },
  { value: 'Serviços', label: 'Serviços' },
  { value: 'Outros', label: 'Outros' },
];

export function OrderForm({ redirectTo = '/' }: { redirectTo?: string }) {
  const router = useRouter();
  const { addOrder } = useOrders();
  const { addEntry } = useAuditLog();
  
  const [solicitante, setSolicitante] = useState('');
  const [departamento, setDepartamento] = useState('TI');
  const [justificativa, setJustificativa] = useState('');
  
  const [items, setItems] = useState<Partial<OrderItem>[]>([
    { id: uuidv4(), nome_produto: '', quantidade: 1, preco_unitario: 0, categoria: 'TI' }
  ]);

  const valorTotal = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.quantidade || 0) * (item.preco_unitario || 0), 0);
  }, [items]);

  const handleAddItem = () => {
    setItems([...items, { id: uuidv4(), nome_produto: '', quantidade: 1, preco_unitario: 0, categoria: 'TI' }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof OrderItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!solicitante.trim()) {
      showToast('Preencha o nome do solicitante.', 'error');
      return;
    }
    
    const validItems = items.filter(i => i.nome_produto?.trim() && (i.quantidade || 0) > 0);
    if (validItems.length === 0) {
      showToast('Adicione pelo menos um item válido com quantidade maior que zero.', 'error');
      return;
    }

    const orderId = uuidv4();
    const builtItems = validItems.map(item => ({
      id: item.id!,
      order_id: orderId,
      nome_produto: item.nome_produto!,
      quantidade: item.quantidade!,
      preco_unitario: item.preco_unitario || 0,
      categoria: (item.categoria || 'Outros') as ProductCategory,
    }));

    const newOrder: Order = {
      id: orderId,
      solicitante,
      departamento,
      data_criacao: new Date().toISOString(),
      status: 'Pendente',
      total_itens: builtItems.reduce((acc, curr) => acc + curr.quantidade, 0),
      valor_total: builtItems.reduce((acc, curr) => acc + curr.quantidade * curr.preco_unitario, 0),
      justificativa: justificativa.trim() || undefined,
      items: builtItems,
    };

    addOrder(newOrder);
    addEntry({ order_id: orderId, acao: 'Criação', responsavel: solicitante, detalhes: `Pedido criado com ${builtItems.length} itens — R$ ${newOrder.valor_total.toFixed(2)}` });
    showToast('Pedido criado com sucesso!', 'success');
    router.push(redirectTo);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-slate-900 p-6 rounded-xl card-shadow border border-slate-200 dark:border-slate-700">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">Dados do Solicitante</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome Completo</label>
            <Input 
              placeholder="Digite seu nome" 
              value={solicitante}
              onChange={(e) => setSolicitante(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Departamento</label>
            <select 
              className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-elis-teal focus-visible:ring-offset-2"
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
            >
              <option value="TI">Tecnologia (TI)</option>
              <option value="RH">Recursos Humanos (RH)</option>
              <option value="Financeiro">Financeiro</option>
              <option value="Marketing">Marketing</option>
              <option value="Operações">Operações</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" />
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Justificativa da Compra</label>
        </div>
        <textarea
          className="flex w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-elis-teal focus-visible:ring-offset-2 min-h-[100px] resize-none"
          placeholder="Descreva o motivo da solicitação..."
          value={justificativa}
          onChange={(e) => setJustificativa(e.target.value)}
        />
        <p className="text-xs text-slate-400">Opcional, mas recomendado para aprovação mais rápida.</p>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight">Itens do Pedido</h2>
          <Button type="button" onClick={handleAddItem} variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Adicionar Item
          </Button>
        </div>
        
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-start animate-in fade-in slide-in-from-bottom-2">
              <div className="col-span-12 sm:col-span-4 space-y-1">
                {index === 0 && <label className="text-xs font-medium text-slate-500">Produto</label>}
                <Input 
                  placeholder="Ex: Notebook Dell..." 
                  value={item.nome_produto}
                  onChange={(e) => handleItemChange(item.id!, 'nome_produto', e.target.value)}
                />
              </div>
              <div className="col-span-4 sm:col-span-2 space-y-1">
                {index === 0 && <label className="text-xs font-medium text-slate-500">Categoria</label>}
                <select
                  className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 px-2 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-elis-teal"
                  value={item.categoria || 'TI'}
                  onChange={(e) => handleItemChange(item.id!, 'categoria', e.target.value)}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-3 sm:col-span-2 space-y-1">
                {index === 0 && <label className="text-xs font-medium text-slate-500">Preço Un. (R$)</label>}
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={item.preco_unitario || ''}
                  onChange={(e) => handleItemChange(item.id!, 'preco_unitario', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-3 sm:col-span-2 space-y-1">
                {index === 0 && <label className="text-xs font-medium text-slate-500">Qtd</label>}
                <Input 
                  type="number" 
                  min="1"
                  value={item.quantidade}
                  onChange={(e) => handleItemChange(item.id!, 'quantidade', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-2 sm:col-span-2 space-y-1">
                {index === 0 && <label className="text-xs font-medium text-slate-500">Subtotal</label>}
                <div className="h-10 flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                  {formatCurrency((item.quantidade || 0) * (item.preco_unitario || 0))}
                </div>
              </div>
              <div className={`col-span-12 sm:col-span-0 ${index === 0 ? 'sm:mt-5' : 'sm:mt-0'} flex justify-end sm:hidden`}>
                <Button 
                  type="button" variant="ghost" size="sm"
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                  onClick={() => handleRemoveItem(item.id!)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Remover
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <DollarSign className="w-5 h-5 text-elis-teal" />
          <span className="text-sm font-medium text-slate-500">Valor Total:</span>
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(valorTotal)}</span>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end">
        <Button type="submit" size="lg" className="gap-2 bg-elis-teal hover:bg-elis-teal-dark w-full md:w-auto">
          <Save className="h-4 w-4" /> Enviar Pedido
        </Button>
      </div>
    </form>
  );
}
