"use client";

import { OrderForm } from '@/components/OrderForm';
import { FileEdit } from 'lucide-react';

export default function SolicitanteNovoPedidoPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <FileEdit className="w-6 h-6 text-elis-teal" />
          Nova Solicitação de Compra
        </h1>
        <p className="text-slate-500 mt-1">
          Preencha os dados e os itens que você deseja solicitar.
        </p>
      </div>

      <OrderForm redirectTo="/solicitante" />
    </div>
  );
}
