"use client";

import React, { useState, useMemo } from 'react';
import { Download, Eye, CheckCircle2, XCircle, Clock, Search, Filter, Trash2, MessageSquare, Pencil, ShieldCheck, Fingerprint, CalendarDays, History, DollarSign } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { useAuditLog } from '@/hooks/useAuditLog';
import Link from 'next/link';
import { exportOrderToPDF } from '@/utils/pdfExport';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Order, OrderStatus, AuditEntry } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { showToast } from '@/hooks/useToast';
import { generateSignature } from '@/utils/signature';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const styles: Record<OrderStatus, string> = {
    Pendente: 'bg-amber-100 text-amber-700 border-amber-200',
    'Em Análise': 'bg-purple-100 text-purple-700 border-purple-200',
    Aprovado: 'bg-elis-green-light text-elis-green border-elis-green/30',
    Rejeitado: 'bg-elis-red-light text-elis-red border-elis-red/30',
  };
  const Icons: Record<OrderStatus, React.ElementType> = {
    Pendente: Clock,
    'Em Análise': Search,
    Aprovado: CheckCircle2,
    Rejeitado: XCircle,
  };
  const Icon = Icons[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
};

const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function OrderList() {
  const { orders, isLoaded, updateOrderStatus, deleteOrder } = useOrders();
  const { addEntry, getEntriesByOrderId } = useAuditLog();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'Todos'>('Todos');
  const [departamentoFilter, setDepartamentoFilter] = useState<string>('Todos');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [observacao, setObservacao] = useState('');
  const [gestoraName, setGestoraName] = useState('');
  const [deleteGestoraName, setDeleteGestoraName] = useState('');
  const [showObsField, setShowObsField] = useState<'aprovar' | 'rejeitar' | 'analise' | null>(null);
  const [showDeleteAuth, setShowDeleteAuth] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);

  const departamentos = useMemo(() => {
    const deps = new Set(orders.map(o => o.departamento));
    return ['Todos', ...Array.from(deps)];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = searchQuery === '' ||
        order.solicitante.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(item => item.nome_produto.toLowerCase().includes(searchQuery.toLowerCase())) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'Todos' || order.status === statusFilter;
      const matchesDepartamento = departamentoFilter === 'Todos' || order.departamento === departamentoFilter;
      const orderDate = new Date(order.data_criacao);
      const matchesDateFrom = !dateFrom || orderDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || orderDate <= new Date(dateTo + 'T23:59:59');
      return matchesSearch && matchesStatus && matchesDepartamento && matchesDateFrom && matchesDateTo;
    });
  }, [orders, searchQuery, statusFilter, departamentoFilter, dateFrom, dateTo]);

  const handleApproveReject = async (action: 'Aprovado' | 'Rejeitado' | 'Em Análise') => {
    if (!selectedOrder) return;
    if (action !== 'Em Análise' && !gestoraName.trim()) {
      showToast('Informe o nome da gestora para assinar.', 'error');
      return;
    }

    let assinatura;
    if (action !== 'Em Análise') {
      const acao = action === 'Aprovado' ? 'Aprovação' : 'Rejeição';
      assinatura = await generateSignature(selectedOrder.id, gestoraName.trim(), acao as 'Aprovação' | 'Rejeição');
    }

    updateOrderStatus(selectedOrder.id, action, observacao || undefined, assinatura);
    const acaoLog = action === 'Em Análise' ? 'Em Análise' : (action === 'Aprovado' ? 'Aprovação' : 'Rejeição');
    addEntry({
      order_id: selectedOrder.id,
      acao: acaoLog as AuditEntry['acao'],
      responsavel: gestoraName.trim() || 'Gestora',
      detalhes: observacao || undefined,
    });

    setSelectedOrder({ ...selectedOrder, status: action, observacao: observacao || undefined, assinatura });
    const msgs: Record<string, [string, 'success' | 'error' | 'info']> = {
      'Aprovado': ['Pedido aprovado com sucesso!', 'success'],
      'Rejeitado': ['Pedido rejeitado.', 'error'],
      'Em Análise': ['Pedido marcado como "Em Análise".', 'info'],
    };
    showToast(msgs[action][0], msgs[action][1]);
    setShowObsField(null);
    setObservacao('');
    setGestoraName('');
  };

  const handleDeleteRequest = (order: Order) => {
    setDeleteTarget(order);
    setDeleteGestoraName('');
    setShowDeleteAuth(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget || !deleteGestoraName.trim()) {
      showToast('Informe o nome da gestora.', 'error');
      return;
    }
    const assinatura = await generateSignature(deleteTarget.id, deleteGestoraName.trim(), 'Exclusão');
    addEntry({ order_id: deleteTarget.id, acao: 'Exclusão', responsavel: deleteGestoraName.trim(), detalhes: `Hash: ${assinatura.hash}` });
    deleteOrder(deleteTarget.id);
    showToast('Pedido excluído.', 'info');
    setDeleteTarget(null);
    setShowDeleteAuth(false);
    setDeleteGestoraName('');
    if (selectedOrder?.id === deleteTarget.id) setSelectedOrder(null);
  };

  const openAuditLog = (orderId: string) => {
    setAuditEntries(getEntriesByOrderId(orderId));
    setShowAuditLog(true);
  };

  if (!isLoaded) return <div className="p-8 text-center text-slate-500 animate-pulse-subtle">Carregando...</div>;

  if (orders.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-12 text-center rounded-xl border border-slate-200 dark:border-slate-700 card-shadow">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-elis-teal-light mb-4 text-elis-teal">
          <Clock className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">Nenhum pedido encontrado</h3>
        <p className="text-slate-500">Nenhum pedido foi registrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 card-shadow p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Buscar por solicitante, produto ou ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select className="h-10 pl-9 pr-4 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 text-sm appearance-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'Todos')}>
                <option value="Todos">Todos Status</option>
                <option value="Pendente">Pendente</option>
                <option value="Em Análise">Em Análise</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Rejeitado">Rejeitado</option>
              </select>
            </div>
            <select className="h-10 px-3 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 text-sm appearance-none" value={departamentoFilter} onChange={(e) => setDepartamentoFilter(e.target.value)}>
              {departamentos.map(dep => (<option key={dep} value={dep}>{dep === 'Todos' ? 'Todos Deptos.' : dep}</option>))}
            </select>
          </div>
        </div>
        {/* Date filter */}
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <CalendarDays className="w-4 h-4 text-slate-400 hidden sm:block" />
          <span className="text-xs text-slate-500 hidden sm:block">Período:</span>
          <input type="date" className="h-9 px-3 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span className="text-xs text-slate-400">até</span>
          <input type="date" className="h-9 px-3 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setDateFrom(''); setDateTo(''); }}>Limpar</Button>
          )}
        </div>
        {(searchQuery || statusFilter !== 'Todos' || departamentoFilter !== 'Todos' || dateFrom || dateTo) && (
          <p className="text-xs text-slate-500">{filteredOrders.length} resultado(s)</p>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 card-shadow overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500"><Search className="w-8 h-8 mx-auto mb-2 text-slate-300" /><p>Nenhum resultado.</p></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Solicitante</TableHead>
                <TableHead>Depto.</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs text-slate-500">{order.id.substring(0, 8)}</TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-slate-100">{order.solicitante}</TableCell>
                  <TableCell>{order.departamento}</TableCell>
                  <TableCell>{format(new Date(order.data_criacao), "dd/MM/yy", { locale: ptBR })}</TableCell>
                  <TableCell className="font-medium text-elis-teal">{formatCurrency(order.valor_total || 0)}</TableCell>
                  <TableCell><StatusBadge status={order.status} /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/gestora/editar/${order.id}`}><Button variant="ghost" size="icon" className="text-slate-400 hover:text-elis-blue hover:bg-elis-blue-light"><Pencil className="w-4 h-4" /></Button></Link>
                      <Button variant="ghost" size="sm" className="text-elis-teal hover:text-elis-teal-dark hover:bg-elis-teal-light" onClick={() => { setSelectedOrder(order); setShowObsField(null); setObservacao(''); setGestoraName(''); }}>
                        <Eye className="w-4 h-4 mr-1" /> Ver
                      </Button>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-elis-red hover:bg-elis-red-light" onClick={() => handleDeleteRequest(order)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-xl card-shadow"><Search className="w-8 h-8 mx-auto mb-2 text-slate-300" /><p>Nenhum resultado.</p></div>
        ) : filteredOrders.map((order) => (
          <div key={order.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 card-shadow p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{order.solicitante}</p>
                <p className="text-xs text-slate-500 font-mono">#{order.id.substring(0, 8)} · {order.departamento}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">{format(new Date(order.data_criacao), "dd/MM/yy HH:mm")}</span>
              <span className="font-bold text-elis-teal">{formatCurrency(order.valor_total || 0)}</span>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <Button variant="ghost" size="sm" className="flex-1 text-elis-teal" onClick={() => { setSelectedOrder(order); setShowObsField(null); setObservacao(''); setGestoraName(''); }}>
                <Eye className="w-4 h-4 mr-1" /> Ver
              </Button>
              <Link href={`/gestora/editar/${order.id}`} className="flex-1"><Button variant="ghost" size="sm" className="w-full text-elis-blue"><Pencil className="w-4 h-4 mr-1" /> Editar</Button></Link>
              <Button variant="ghost" size="sm" className="text-elis-red" onClick={() => handleDeleteRequest(order)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => { setSelectedOrder(null); setShowObsField(null); setObservacao(''); setGestoraName(''); }} title={`Pedido #${selectedOrder?.id.substring(0, 8)}`}>
        {selectedOrder && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="block text-slate-500">Solicitante</span><span className="font-medium">{selectedOrder.solicitante}</span></div>
              <div><span className="block text-slate-500">Departamento</span><span className="font-medium">{selectedOrder.departamento}</span></div>
              <div><span className="block text-slate-500">Data</span><span className="font-medium">{format(new Date(selectedOrder.data_criacao), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span></div>
              <div><span className="block text-slate-500">Status</span><StatusBadge status={selectedOrder.status} /></div>
              <div><span className="block text-slate-500">Valor Total</span><span className="font-bold text-elis-teal text-lg">{formatCurrency(selectedOrder.valor_total || 0)}</span></div>
            </div>
            {selectedOrder.justificativa && (<div className="text-sm"><span className="block text-slate-500 mb-1">Justificativa</span><p className="text-slate-700 bg-slate-50 dark:bg-slate-700 p-3 rounded-md">{selectedOrder.justificativa}</p></div>)}
            {selectedOrder.observacao && (<div className="text-sm"><span className="block text-slate-500 mb-1">Observação</span><p className="text-slate-700 bg-slate-50 dark:bg-slate-700 p-3 rounded-md flex items-start gap-2"><MessageSquare className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />{selectedOrder.observacao}</p></div>)}

            {selectedOrder.assinatura && (
              <div className="text-sm bg-elis-blue-light/50 dark:bg-slate-700 border border-elis-blue/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2"><Fingerprint className="w-4 h-4 text-elis-blue" /><span className="font-semibold text-elis-blue">Assinatura Digital</span></div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-slate-500 block">Gestora</span><span className="font-medium">{selectedOrder.assinatura.gestora}</span></div>
                  <div><span className="text-slate-500 block">Ação</span><span className="font-medium">{selectedOrder.assinatura.acao}</span></div>
                  <div><span className="text-slate-500 block">Data</span><span className="font-medium">{format(new Date(selectedOrder.assinatura.dataHora), "dd/MM/yy HH:mm:ss")}</span></div>
                  <div><span className="text-slate-500 block">Hash</span><span className="font-mono text-xs text-elis-blue bg-white dark:bg-slate-800 px-2 py-0.5 rounded">{selectedOrder.assinatura.hash}</span></div>
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-sm border-b pb-2 mb-2">Itens ({selectedOrder.total_itens})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedOrder.items.map((item, idx) => (
                  <div key={item.id} className="flex justify-between items-center text-sm p-2.5 bg-slate-50 dark:bg-slate-700 rounded-md">
                    <div>
                      <span className="font-medium">{idx + 1}. {item.nome_produto}</span>
                      <span className="text-xs text-slate-400 ml-2">{item.categoria || ''}</span>
                    </div>
                    <div className="text-right text-xs">
                      <span className="block font-semibold">{formatCurrency((item.preco_unitario || 0) * item.quantidade)}</span>
                      <span className="text-slate-400">{item.quantidade}× {formatCurrency(item.preco_unitario || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {showObsField && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                {showObsField !== 'analise' && (
                  <div><label className="text-sm font-medium flex items-center gap-1.5 mb-1"><ShieldCheck className="w-4 h-4 text-elis-blue" />Nome da Gestora</label><Input placeholder="Nome completo..." value={gestoraName} onChange={(e) => setGestoraName(e.target.value)} /></div>
                )}
                <div><label className="text-sm font-medium mb-1 block">Observação {showObsField === 'rejeitar' ? '(motivo)' : '(opcional)'}</label>
                  <textarea className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm min-h-[70px] resize-none focus:ring-2 focus:ring-elis-teal outline-none" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button className={`flex-1 ${showObsField === 'aprovar' ? 'bg-elis-teal hover:bg-elis-teal-dark' : showObsField === 'analise' ? 'bg-purple-600 hover:bg-purple-700' : ''}`} variant={showObsField === 'rejeitar' ? 'destructive' : 'default'} onClick={() => handleApproveReject(showObsField === 'aprovar' ? 'Aprovado' : showObsField === 'analise' ? 'Em Análise' : 'Rejeitado')} disabled={showObsField !== 'analise' && !gestoraName.trim()}>
                    <Fingerprint className="w-4 h-4 mr-2" />{showObsField === 'aprovar' ? 'Assinar e Aprovar' : showObsField === 'analise' ? 'Marcar Em Análise' : 'Assinar e Rejeitar'}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowObsField(null); setObservacao(''); setGestoraName(''); }}>Cancelar</Button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
              {(selectedOrder.status === 'Pendente' || selectedOrder.status === 'Em Análise') && !showObsField && (
                <>
                  {selectedOrder.status === 'Pendente' && <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={() => setShowObsField('analise')}><Search className="w-4 h-4 mr-1" />Em Análise</Button>}
                  <Button size="sm" className="flex-1 bg-elis-teal hover:bg-elis-teal-dark" onClick={() => setShowObsField('aprovar')}><CheckCircle2 className="w-4 h-4 mr-1" />Aprovar</Button>
                  <Button size="sm" variant="destructive" className="flex-1" onClick={() => setShowObsField('rejeitar')}><XCircle className="w-4 h-4 mr-1" />Rejeitar</Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={() => exportOrderToPDF(selectedOrder)}><Download className="w-4 h-4 mr-1" />PDF</Button>
              <Button variant="outline" size="sm" onClick={() => openAuditLog(selectedOrder.id)}><History className="w-4 h-4 mr-1" />Histórico</Button>
              <Button variant="ghost" size="sm" className="text-elis-red" onClick={() => handleDeleteRequest(selectedOrder)}><Trash2 className="w-4 h-4 mr-1" />Excluir</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Audit Log Modal */}
      <Modal isOpen={showAuditLog} onClose={() => setShowAuditLog(false)} title="Histórico de Ações">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {auditEntries.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Nenhum registro encontrado.</p>
          ) : auditEntries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm">
              <div className="p-1.5 rounded-full bg-elis-teal-light flex-shrink-0"><History className="w-3.5 h-3.5 text-elis-teal" /></div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <span className="font-medium">{entry.acao}</span>
                  <span className="text-xs text-slate-400">{format(new Date(entry.dataHora), "dd/MM/yy HH:mm:ss")}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">por {entry.responsavel}</p>
                {entry.detalhes && <p className="text-xs text-slate-400 mt-1">{entry.detalhes}</p>}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteAuth} onClose={() => { setShowDeleteAuth(false); setDeleteTarget(null); setDeleteGestoraName(''); }} title="Confirmar Exclusão">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-elis-red-light flex-shrink-0"><Trash2 className="w-5 h-5 text-elis-red" /></div>
            <p className="text-sm text-slate-700 dark:text-slate-300">Excluir pedido <strong>#{deleteTarget?.id.substring(0, 8)}</strong>? Esta ação não pode ser desfeita.</p>
          </div>
          <div><label className="text-sm font-medium flex items-center gap-1.5 mb-1"><ShieldCheck className="w-4 h-4 text-elis-blue" />Nome da Gestora</label><Input placeholder="Nome completo..." value={deleteGestoraName} onChange={(e) => setDeleteGestoraName(e.target.value)} /></div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setShowDeleteAuth(false); setDeleteTarget(null); setDeleteGestoraName(''); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!deleteGestoraName.trim()}><Fingerprint className="w-4 h-4 mr-2" />Assinar e Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
