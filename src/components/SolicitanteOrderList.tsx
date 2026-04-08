"use client";

import React, { useState, useMemo } from 'react';
import { Eye, Clock, Search, Filter, CalendarDays, CheckCircle2, XCircle, DollarSign } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Order, OrderStatus } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/Table';

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const styles: Record<OrderStatus, string> = {
    Pendente: 'bg-amber-100 text-amber-700 border-amber-200',
    'Em Análise': 'bg-purple-100 text-purple-700 border-purple-200',
    Aprovado: 'bg-elis-green-light text-elis-green border-elis-green/30',
    Rejeitado: 'bg-elis-red-light text-elis-red border-elis-red/30',
  };
  const Icons: Record<OrderStatus, React.ElementType> = {
    Pendente: Clock, 'Em Análise': Search, Aprovado: CheckCircle2, Rejeitado: XCircle,
  };
  const Icon = Icons[status];
  return (<span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}><Icon className="w-3.5 h-3.5" />{status}</span>);
};

const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function SolicitanteOrderList({ solicitanteFilter }: { solicitanteFilter?: string }) {
  const { orders, isLoaded } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'Todos'>('Todos');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = searchQuery === '' ||
        order.items.some(i => i.nome_produto.toLowerCase().includes(searchQuery.toLowerCase())) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'Todos' || order.status === statusFilter;
      const matchesSolicitante = !solicitanteFilter || order.solicitante.toLowerCase() === solicitanteFilter.toLowerCase();
      const orderDate = new Date(order.data_criacao);
      const matchesDateFrom = !dateFrom || orderDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || orderDate <= new Date(dateTo + 'T23:59:59');
      return matchesSearch && matchesStatus && matchesSolicitante && matchesDateFrom && matchesDateTo;
    });
  }, [orders, searchQuery, statusFilter, solicitanteFilter, dateFrom, dateTo]);

  if (!isLoaded) return <div className="p-8 text-center text-slate-500 animate-pulse-subtle">Carregando...</div>;

  if (orders.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-slate-200 card-shadow">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-elis-teal-light mb-4 text-elis-teal"><Clock className="w-8 h-8" /></div>
        <h3 className="text-lg font-medium mb-1">Nenhum pedido encontrado</h3>
        <p className="text-slate-500">Crie um novo pedido para começar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 card-shadow p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Buscar por produto ou ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select className="h-10 pl-9 pr-4 rounded-md border border-slate-300 bg-white text-sm appearance-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'Todos')}>
              <option value="Todos">Todos Status</option>
              <option value="Pendente">Pendente</option>
              <option value="Em Análise">Em Análise</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Rejeitado">Rejeitado</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <CalendarDays className="w-4 h-4 text-slate-400 hidden sm:block" />
          <input type="date" className="h-9 px-3 rounded-md border border-slate-300 bg-white text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span className="text-xs text-slate-400">até</span>
          <input type="date" className="h-9 px-3 rounded-md border border-slate-300 bg-white text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          {(dateFrom || dateTo) && <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setDateFrom(''); setDateTo(''); }}>Limpar</Button>}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 card-shadow overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500"><p>Nenhum resultado.</p></div>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>ID</TableHead><TableHead>Depto.</TableHead><TableHead>Data</TableHead><TableHead>Itens</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs text-slate-500">{order.id.substring(0, 8)}</TableCell>
                  <TableCell>{order.departamento}</TableCell>
                  <TableCell>{format(new Date(order.data_criacao), "dd/MM/yy HH:mm")}</TableCell>
                  <TableCell>{order.total_itens}</TableCell>
                  <TableCell className="font-medium text-elis-teal">{formatCurrency(order.valor_total || 0)}</TableCell>
                  <TableCell><StatusBadge status={order.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-elis-teal" onClick={() => setSelectedOrder(order)}><Eye className="w-4 h-4 mr-1" />Detalhes</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl border border-slate-200 card-shadow p-4 space-y-2" onClick={() => setSelectedOrder(order)}>
            <div className="flex justify-between items-start">
              <p className="font-mono text-xs text-slate-500">#{order.id.substring(0, 8)} · {order.departamento}</p>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">{format(new Date(order.data_criacao), "dd/MM/yy")}</span>
              <span className="font-bold text-elis-teal">{formatCurrency(order.valor_total || 0)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Pedido #${selectedOrder?.id.substring(0, 8)}`}>
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="block text-slate-500">Departamento</span><span className="font-medium">{selectedOrder.departamento}</span></div>
              <div><span className="block text-slate-500">Status</span><StatusBadge status={selectedOrder.status} /></div>
              <div><span className="block text-slate-500">Data</span><span className="font-medium">{format(new Date(selectedOrder.data_criacao), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span></div>
              <div><span className="block text-slate-500">Valor Total</span><span className="font-bold text-elis-teal">{formatCurrency(selectedOrder.valor_total || 0)}</span></div>
            </div>
            {selectedOrder.justificativa && (<div className="text-sm"><span className="block text-slate-500 mb-1">Justificativa</span><p className="bg-slate-50 p-3 rounded-md">{selectedOrder.justificativa}</p></div>)}
            {selectedOrder.observacao && (<div className="text-sm"><span className="block text-slate-500 mb-1">Observação do Gestor</span><p className="bg-slate-50 p-3 rounded-md">{selectedOrder.observacao}</p></div>)}
            <div>
              <h4 className="font-semibold text-sm border-b pb-2 mb-2">Itens ({selectedOrder.total_itens})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedOrder.items.map((item, idx) => (
                  <div key={item.id} className="flex justify-between items-center text-sm p-2.5 bg-slate-50 rounded-md">
                    <div><span className="font-medium">{idx + 1}. {item.nome_produto}</span><span className="text-xs text-slate-400 ml-2">{item.categoria}</span></div>
                    <div className="text-right text-xs"><span className="block font-semibold">{formatCurrency((item.preco_unitario || 0) * item.quantidade)}</span><span className="text-slate-400">{item.quantidade}× {formatCurrency(item.preco_unitario || 0)}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
