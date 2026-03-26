"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Save, ArrowLeft, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useOrders } from '@/hooks/useOrders';
import { useAuditLog } from '@/hooks/useAuditLog';
import { showToast } from '@/hooks/useToast';
import { Order, OrderItem, ProductCategory } from '@/types';
import Link from 'next/link';
import { GestoraAuth } from '@/components/GestoraAuth';

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'TI', label: 'TI' },
  { value: 'Material de Escritório', label: 'Material de Escritório' },
  { value: 'Infraestrutura', label: 'Infraestrutura' },
  { value: 'Serviços', label: 'Serviços' },
  { value: 'Outros', label: 'Outros' },
];

export default function EditarPedidoPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const { orders, isLoaded, updateOrder } = useOrders();
  const { addEntry } = useAuditLog();

  const [solicitante, setSolicitante] = useState('');
  const [departamento, setDepartamento] = useState('TI');
  const [justificativa, setJustificativa] = useState('');
  const [items, setItems] = useState<Partial<OrderItem>[]>([]);
  const [loaded, setLoaded] = useState(false);

  const valorTotal = useMemo(() => items.reduce((acc, item) => acc + (item.quantidade || 0) * (item.preco_unitario || 0), 0), [items]);
  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  useEffect(() => {
    if (isLoaded && !loaded) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSolicitante(order.solicitante);
        setDepartamento(order.departamento);
        setJustificativa(order.justificativa || '');
        setItems(order.items.map(item => ({ ...item })));
        setLoaded(true);
      }
    }
  }, [isLoaded, orders, orderId, loaded]);

  const handleAddItem = () => {
    setItems([...items, { id: uuidv4(), nome_produto: '', quantidade: 1, preco_unitario: 0, categoria: 'TI' }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof OrderItem, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitante.trim()) { showToast('Preencha o nome.', 'error'); return; }
    const validItems = items.filter(i => i.nome_produto?.trim() && (i.quantidade || 0) > 0);
    if (validItems.length === 0) { showToast('Adicione pelo menos um item.', 'error'); return; }
    const originalOrder = orders.find(o => o.id === orderId);
    if (!originalOrder) return;

    const builtItems = validItems.map(item => ({
      id: item.id!, order_id: orderId, nome_produto: item.nome_produto!, quantidade: item.quantidade!,
      preco_unitario: item.preco_unitario || 0, categoria: (item.categoria || 'Outros') as ProductCategory,
    }));

    const updatedOrder: Order = {
      ...originalOrder, solicitante, departamento,
      justificativa: justificativa.trim() || undefined,
      total_itens: builtItems.reduce((a, c) => a + c.quantidade, 0),
      valor_total: builtItems.reduce((a, c) => a + c.quantidade * c.preco_unitario, 0),
      items: builtItems,
    };

    updateOrder(updatedOrder);
    addEntry({ order_id: orderId, acao: 'Edição', responsavel: 'Gestora', detalhes: `Pedido editado — ${builtItems.length} itens — R$ ${updatedOrder.valor_total.toFixed(2)}` });
    showToast('Pedido atualizado!', 'success');
    router.push('/gestora');
  };

  if (!isLoaded || !loaded) return <div className="p-8 text-center text-slate-500 animate-pulse-subtle">Carregando...</div>;

  return (
    <GestoraAuth>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/gestora"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar Pedido #{orderId.substring(0, 8)}</h1>
            <p className="text-slate-500 mt-1">Altere os dados do pedido.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-slate-900 p-6 rounded-xl card-shadow border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome Completo</label>
              <Input value={solicitante} onChange={(e) => setSolicitante(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Departamento</label>
              <select className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:ring-2 focus:ring-elis-teal outline-none" value={departamento} onChange={(e) => setDepartamento(e.target.value)}>
                <option value="TI">TI</option><option value="RH">RH</option><option value="Financeiro">Financeiro</option><option value="Marketing">Marketing</option><option value="Operações">Operações</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Justificativa</label>
            <textarea className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm min-h-[80px] resize-none focus:ring-2 focus:ring-elis-teal outline-none" value={justificativa} onChange={(e) => setJustificativa(e.target.value)} />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Itens</h2>
              <Button type="button" onClick={handleAddItem} variant="outline" size="sm"><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
            </div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-12 sm:col-span-4 space-y-1">
                    {index === 0 && <label className="text-xs font-medium text-slate-500">Produto</label>}
                    <Input value={item.nome_produto} onChange={(e) => handleItemChange(item.id!, 'nome_produto', e.target.value)} />
                  </div>
                  <div className="col-span-4 sm:col-span-2 space-y-1">
                    {index === 0 && <label className="text-xs font-medium text-slate-500">Categoria</label>}
                    <select className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-2 text-xs focus:ring-2 focus:ring-elis-teal outline-none" value={item.categoria || 'TI'} onChange={(e) => handleItemChange(item.id!, 'categoria', e.target.value)}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3 sm:col-span-2 space-y-1">
                    {index === 0 && <label className="text-xs font-medium text-slate-500">Preço (R$)</label>}
                    <Input type="number" min="0" step="0.01" value={item.preco_unitario || ''} onChange={(e) => handleItemChange(item.id!, 'preco_unitario', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-3 sm:col-span-2 space-y-1">
                    {index === 0 && <label className="text-xs font-medium text-slate-500">Qtd</label>}
                    <Input type="number" min="1" value={item.quantidade} onChange={(e) => handleItemChange(item.id!, 'quantidade', parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-2 sm:col-span-2 space-y-1 flex items-center">
                    {index === 0 && <label className="text-xs font-medium text-slate-500 block w-full">Sub.</label>}
                    <span className="text-sm font-medium">{formatCurrency((item.quantidade || 0) * (item.preco_unitario || 0))}</span>
                    <Button type="button" variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 ml-1" onClick={() => handleRemoveItem(item.id!)} disabled={items.length === 1}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <DollarSign className="w-5 h-5 text-elis-teal" />
              <span className="text-sm text-slate-500">Total:</span>
              <span className="text-xl font-bold">{formatCurrency(valorTotal)}</span>
            </div>
          </div>

          <div className="pt-6 border-t flex justify-end">
            <Button type="submit" size="lg" className="gap-2 bg-elis-teal hover:bg-elis-teal-dark w-full md:w-auto">
              <Save className="h-4 w-4" /> Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </GestoraAuth>
  );
}
