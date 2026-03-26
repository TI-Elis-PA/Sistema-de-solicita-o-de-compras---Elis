"use client";

import Link from 'next/link';
import { UserCircle2, ShieldCheck, ArrowRight, Package } from 'lucide-react';
import { ElisLogo } from '@/components/ElisLogo';
import { CircularBadge } from '@/components/ui/CircularBadge';

export default function Home() {
  const profiles = [
    {
      title: 'Solicitante',
      description: 'Crie pedidos de compra e acompanhe o status das suas solicitações.',
      icon: UserCircle2,
      href: '/solicitante',
      gradient: 'from-elis-teal to-elis-teal-dark',
      bgLight: 'bg-elis-teal-light',
      textColor: 'text-elis-teal',
      borderColor: 'border-elis-teal/20',
    },
    {
      title: 'Gestora',
      description: 'Gerencie pedidos: aprove, rejeite, edite, exclua e exporte relatórios.',
      icon: ShieldCheck,
      href: '/gestora',
      gradient: 'from-elis-blue to-elis-blue-dark',
      bgLight: 'bg-elis-blue-light',
      textColor: 'text-elis-blue',
      borderColor: 'border-elis-blue/20',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-10">
      <div className="text-center space-y-4">
        <ElisLogo size="lg" className="justify-center" />
        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Sistema de Solicitação de Compras
          </h1>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">
            Selecione seu perfil para acessar o sistema.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        {profiles.map((profile) => {
          const Icon = profile.icon;
          return (
            <Link
              key={profile.title}
              href={profile.href}
              className={`relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border ${profile.borderColor} card-shadow hover:-translate-y-2 transition-all duration-300 group p-8 flex flex-col items-center text-center`}
            >
              <div className={`p-4 rounded-2xl ${profile.bgLight} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-10 h-10 ${profile.textColor}`} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{profile.title}</h2>
              <p className="text-sm text-slate-500 mb-5 leading-relaxed">{profile.description}</p>
              <div className={`inline-flex items-center gap-2 text-sm font-medium ${profile.textColor} group-hover:gap-3 transition-all duration-300`}>
                Acessar <ArrowRight className="w-4 h-4" />
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${profile.gradient} rounded-b-2xl`} />
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Package className="w-3.5 h-3.5" />
        <span>Powered by Elis Service</span>
        <CircularBadge size="sm" />
      </div>
    </div>
  );
}
