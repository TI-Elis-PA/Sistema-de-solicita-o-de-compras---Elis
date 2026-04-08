"use client";

import React from 'react';
import { Package, Clock, CheckCircle2, XCircle, ArrowUpRight, DollarSign, Search } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';

export function Dashboard() {
  const { orders, isLoaded } = useOrders();

  if (!isLoaded) return null;

  const total = orders.length;
  const pendentes = orders.filter(o => o.status === 'Pendente').length;
  const emAnalise = orders.filter(o => o.status === 'Em Análise').length;
  const aprovados = orders.filter(o => o.status === 'Aprovado').length;
  const rejeitados = orders.filter(o => o.status === 'Rejeitado').length;
  const valorAprovado = orders.filter(o => o.status === 'Aprovado').reduce((acc, o) => acc + (o.valor_total || 0), 0);
  const valorTotal = orders.reduce((acc, o) => acc + (o.valor_total || 0), 0);

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const cards = [
    {
      label: 'Total de Pedidos',
      value: total,
      icon: Package,
      gradient: 'from-[#4f657a] to-[#3a4d5e]',
      bgLight: 'bg-elis-blue-light',
      textColor: 'text-elis-blue',
      borderColor: 'border-elis-blue/20',
    },
    {
      label: 'Pendentes',
      value: pendentes,
      icon: Clock,
      gradient: 'from-amber-500 to-amber-600',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-200',
    },
    {
      label: 'Em Análise',
      value: emAnalise,
      icon: Search,
      gradient: 'from-purple-500 to-purple-600',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200',
    },
    {
      label: 'Aprovados',
      value: aprovados,
      icon: CheckCircle2,
      gradient: 'from-[#2e7d32] to-[#1b5e20]',
      bgLight: 'bg-elis-green-light',
      textColor: 'text-elis-green',
      borderColor: 'border-elis-green/20',
    },
    {
      label: 'Rejeitados',
      value: rejeitados,
      icon: XCircle,
      gradient: 'from-[#e3000b] to-[#c50009]',
      bgLight: 'bg-elis-red-light',
      textColor: 'text-elis-red',
      borderColor: 'border-elis-red/20',
    },
    {
      label: 'Valor Aprovado',
      value: formatCurrency(valorAprovado),
      icon: DollarSign,
      gradient: 'from-[#00a5aa] to-[#008a8f]',
      bgLight: 'bg-elis-teal-light',
      textColor: 'text-elis-teal',
      borderColor: 'border-elis-teal/20',
      isWide: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label}
            className={`relative overflow-hidden bg-white rounded-xl border ${card.borderColor} card-shadow hover:-translate-y-1 transition-all duration-300 group cursor-default`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${card.bgLight}`}>
                  <Icon className={`w-4 h-4 ${card.textColor}`} />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-elis-teal transition-all duration-300" />
              </div>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{card.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
            </div>
            <div className={`h-1 bg-gradient-to-r ${card.gradient} rounded-b-xl`} />
          </div>
        );
      })}
    </div>
  );
}
