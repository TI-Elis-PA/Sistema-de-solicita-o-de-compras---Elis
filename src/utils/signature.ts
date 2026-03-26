import { AssinaturaDigital } from '@/types';

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function generateSignature(
  orderId: string,
  gestora: string,
  acao: 'Aprovação' | 'Rejeição' | 'Exclusão'
): Promise<AssinaturaDigital> {
  const dataHora = new Date().toISOString();
  const payload = `${orderId}|${gestora}|${acao}|${dataHora}|ELIS-SERVICE`;
  const fullHash = await sha256(payload);

  return {
    gestora,
    acao,
    dataHora,
    hash: fullHash.substring(0, 16).toUpperCase(),
  };
}
