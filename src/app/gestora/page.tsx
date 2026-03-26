"use client";

import { Dashboard } from '@/components/Dashboard';
import { OrderList } from '@/components/OrderList';
import { GestoraAuth } from '@/components/GestoraAuth';
import { useOrders } from '@/hooks/useOrders';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PackageSearch, Trash2, FileBarChart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { showToast } from '@/hooks/useToast';
import { exportGeneralReport } from '@/utils/pdfExport';

export default function GestoraPage() {
  const { orders, clearAllOrders } = useOrders();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearAll = () => {
    clearAllOrders();
    showToast('Todos os pedidos foram removidos.', 'info');
    setShowClearConfirm(false);
  };

  const handleExportReport = () => {
    if (orders.length === 0) {
      showToast('Nenhum pedido para exportar.', 'error');
      return;
    }
    exportGeneralReport(orders, 'Relatório Geral de Compras');
    showToast('Relatório PDF gerado!', 'success');
  };

  return (
    <GestoraAuth>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <PackageSearch className="w-6 h-6 text-elis-teal" />
              Painel da Gestora
            </h1>
            <p className="text-slate-500 mt-1">Gerencie todas as solicitações de compra.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleExportReport}
            >
              <FileBarChart className="w-4 h-4" /> Relatório PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-elis-red hover:bg-elis-red-light"
              onClick={() => setShowClearConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Limpar Todos
            </Button>
          </div>
        </div>

        <Dashboard />
        <OrderList />
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAll}
        title="Limpar Todos os Pedidos"
        message="Esta ação irá remover permanentemente todos os pedidos. Deseja continuar?"
        confirmLabel="Limpar Tudo"
        variant="danger"
      />
    </GestoraAuth>
  );
}
