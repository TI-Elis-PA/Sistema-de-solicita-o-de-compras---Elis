"use client";

import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { LayoutDashboard, PlusCircle, Home, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { ElisLogo } from '@/components/ElisLogo';
import { CircularBadge } from '@/components/ui/CircularBadge';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { toasts, removeToast } = useToast();
  const pathname = usePathname();

  const isSolicitante = pathname.startsWith('/solicitante');
  const isGestora = pathname.startsWith('/gestora');
  const isHome = pathname === '/';

  return (
    <html lang="pt-BR">
      <head>
        <title>Elis - Sistema de Solicitação de Compras</title>
        <meta name="description" content="Sistema interno de solicitação de compras — Elis Service" />
      </head>
      <body className={`${inter.className} bg-[var(--background)] text-slate-900 min-h-screen flex flex-col`}>
        <header className="bg-white border-b-2 border-elis-teal/30 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <ElisLogo size="sm" />
              <span className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400 border-l border-slate-200 pl-3 ml-1">
                Solicitação de Compras
                <CircularBadge size="sm" className="animate-float" />
              </span>
            </Link>
            <nav className="flex gap-1 sm:gap-2 items-center">
              {isSolicitante && (
                <>
                  <Link href="/solicitante" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-elis-blue hover:text-elis-teal hover:bg-elis-teal/5 transition-colors">
                    <LayoutDashboard className="w-4 h-4" /><span className="hidden sm:inline">Meus Pedidos</span>
                  </Link>
                  <Link href="/solicitante/novo-pedido" className="flex items-center gap-2 px-3 py-2 rounded-md bg-elis-teal text-sm font-medium text-white hover:bg-elis-teal/90 transition-all shadow-sm hover:shadow-md active:scale-[0.97]">
                    <PlusCircle className="w-4 h-4" /><span>Novo Pedido</span>
                  </Link>
                </>
              )}
              {isGestora && (
                <Link href="/gestora" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-elis-blue hover:text-elis-teal hover:bg-elis-teal/5 transition-colors">
                  <ShieldCheck className="w-4 h-4" /><span className="hidden sm:inline">Painel Gestora</span>
                </Link>
              )}
              {!isHome && (
                <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                  <Home className="w-4 h-4" /><span className="hidden sm:inline">Trocar Perfil</span>
                </Link>
              )}
            </nav>
          </div>
        </header>
        
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="bg-white border-t border-slate-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ElisLogo size="sm" variant="icon" />
              <CircularBadge size="md" />
            </div>
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Elis Service — Circular at work
            </p>
          </div>
        </footer>

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </body>
    </html>
  );
}
