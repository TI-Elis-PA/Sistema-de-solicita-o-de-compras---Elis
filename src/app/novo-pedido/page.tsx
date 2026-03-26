"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NovoPedidoRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/solicitante/novo-pedido');
  }, [router]);

  return (
    <div className="p-8 text-center text-slate-500 animate-pulse-subtle">
      Redirecionando...
    </div>
  );
}
