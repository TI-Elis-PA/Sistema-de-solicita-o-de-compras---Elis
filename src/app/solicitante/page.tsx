"use client";

import { Dashboard } from '@/components/Dashboard';
import { SolicitanteOrderList } from '@/components/SolicitanteOrderList';
import { PackageSearch, PlusCircle, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useState } from 'react';

export default function SolicitantePage() {
  const [nomeFilter, setNomeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PackageSearch className="w-6 h-6 text-elis-teal" />
            Meus Pedidos
          </h1>
          <p className="text-slate-500 mt-1">Acompanhe o status das suas solicitações de compra.</p>
        </div>
        <Link href="/solicitante/novo-pedido">
          <Button className="gap-2 bg-elis-teal hover:bg-elis-teal-dark">
            <PlusCircle className="w-4 h-4" /> Novo Pedido
          </Button>
        </Link>
      </div>

      {/* Advanced search by name */}
      <div className="bg-white rounded-xl border border-slate-200 card-shadow p-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <UserCircle2 className="w-3.5 h-3.5" /> Filtrar por meu nome
            </label>
            <Input
              placeholder="Digite seu nome para ver apenas seus pedidos..."
              value={nomeFilter}
              onChange={(e) => setNomeFilter(e.target.value)}
            />
          </div>
          <Button
            variant={activeFilter ? 'default' : 'outline'}
            size="sm"
            className={activeFilter ? 'bg-elis-teal hover:bg-elis-teal-dark' : ''}
            onClick={() => setActiveFilter(nomeFilter.trim())}
          >
            Filtrar
          </Button>
          {activeFilter && (
            <Button variant="ghost" size="sm" onClick={() => { setActiveFilter(''); setNomeFilter(''); }}>Limpar</Button>
          )}
        </div>
        {activeFilter && <p className="text-xs text-elis-teal mt-2">Filtrando pedidos de: <strong>{activeFilter}</strong></p>}
      </div>

      <Dashboard />
      <SolicitanteOrderList solicitanteFilter={activeFilter || undefined} />
    </div>
  );
}
