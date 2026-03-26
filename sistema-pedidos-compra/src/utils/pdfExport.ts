import { Order } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ELIS_LOGO_BASE64 } from './logoBase64';

const ELIS = {
  teal: [0, 165, 170] as [number, number, number],
  tealDark: [0, 138, 143] as [number, number, number],
  blue: [79, 101, 122] as [number, number, number],
  blueDark: [58, 77, 94] as [number, number, number],
  red: [227, 0, 11] as [number, number, number],
  dark: [30, 41, 59] as [number, number, number],
  medium: [100, 116, 139] as [number, number, number],
  light: [241, 245, 249] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  amber: [245, 158, 11] as [number, number, number],
  purple: [147, 51, 234] as [number, number, number],
};

const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const statusConfig: Record<string, { color: [number, number, number]; label: string }> = {
  Pendente: { color: ELIS.amber, label: 'PENDENTE' },
  'Em Análise': { color: ELIS.purple, label: 'EM ANÁLISE' },
  Aprovado: { color: ELIS.teal, label: 'APROVADO' },
  Rejeitado: { color: ELIS.red, label: 'REJEITADO' },
};

export const exportOrderToPDF = (order: Order) => {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;

  // Header
  doc.setFillColor(...ELIS.blueDark);
  doc.rect(0, 0, pageW, 44, 'F');
  doc.setFillColor(...ELIS.teal);
  doc.rect(0, 44, pageW, 3, 'F');
  try { doc.addImage(ELIS_LOGO_BASE64, 'PNG', 12, 6, 32, 32); } catch { /* fallback */ }
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ELIS.white);
  doc.text('elis', 50, 22);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...ELIS.teal);
  doc.text('CIRCULAR AT WORK', 50, 30);
  doc.setFontSize(8);
  doc.setTextColor(180, 196, 214);
  doc.text(`Pedido #${order.id.substring(0, 8)}`, pageW - 14, 22, { align: 'right' });

  // Title
  let y = 58;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ELIS.dark);
  doc.text('SOLICITAÇÃO DE COMPRA', pageW / 2, y, { align: 'center' });
  y += 4;
  doc.setFillColor(...ELIS.teal);
  doc.rect(pageW / 2 - 20, y, 40, 1.5, 'F');
  y += 10;

  // Info card
  doc.setFillColor(...ELIS.light);
  doc.roundedRect(14, y, pageW - 28, 42, 3, 3, 'F');
  const status = statusConfig[order.status] || { color: ELIS.medium, label: order.status };
  doc.setFillColor(...status.color);
  doc.roundedRect(pageW - 54, y + 4, 40, 10, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ELIS.white);
  doc.text(status.label, pageW - 34, y + 10.5, { align: 'center' });

  const fields = [
    { label: 'SOLICITANTE', value: order.solicitante },
    { label: 'DEPARTAMENTO', value: order.departamento },
    { label: 'DATA', value: format(new Date(order.data_criacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) },
    { label: 'VALOR TOTAL', value: formatCurrency(order.valor_total || 0) },
  ];
  const colW = (pageW - 28) / 2;
  fields.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const fx = 18 + col * colW;
    const fy = y + 8 + row * 16;
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...ELIS.teal);
    doc.text(f.label, fx, fy);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...ELIS.dark);
    doc.text(f.value, fx, fy + 6);
  });
  y += 48;

  // Justificativa
  if (order.justificativa) {
    doc.setFillColor(224, 245, 246);
    const lines = doc.splitTextToSize(order.justificativa, pageW - 38);
    const blockH = lines.length * 4.5 + 14;
    doc.roundedRect(14, y, pageW - 28, blockH, 2, 2, 'F');
    doc.setFillColor(...ELIS.teal);
    doc.rect(14, y, 2.5, blockH, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...ELIS.teal);
    doc.text('JUSTIFICATIVA', 22, y + 8);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...ELIS.dark);
    doc.text(lines, 22, y + 14);
    y += blockH + 6;
  }

  // Observação
  if (order.observacao) {
    const obsColor = status.color;
    const bgColor: [number, number, number] = [Math.min(255, obsColor[0] + 200), Math.min(255, obsColor[1] + 200), Math.min(255, obsColor[2] + 200)];
    doc.setFillColor(...bgColor);
    const lines = doc.splitTextToSize(order.observacao, pageW - 38);
    const blockH = lines.length * 4.5 + 14;
    doc.roundedRect(14, y, pageW - 28, blockH, 2, 2, 'F');
    doc.setFillColor(...obsColor);
    doc.rect(14, y, 2.5, blockH, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...obsColor);
    doc.text('OBSERVAÇÃO DO GESTOR', 22, y + 8);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...ELIS.dark);
    doc.text(lines, 22, y + 14);
    y += blockH + 6;
  }

  // Items table
  const tableData = order.items.map((item, i) => [
    String(i + 1),
    item.nome_produto,
    item.categoria || '-',
    String(item.quantidade),
    formatCurrency(item.preco_unitario || 0),
    formatCurrency((item.preco_unitario || 0) * item.quantidade),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'PRODUTO', 'CATEGORIA', 'QTD', 'PREÇO UN.', 'SUBTOTAL']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: ELIS.teal, textColor: ELIS.white, fontSize: 7, fontStyle: 'bold', halign: 'center', cellPadding: 3 },
    bodyStyles: { fontSize: 8, textColor: ELIS.dark, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { halign: 'center', cellWidth: 10 }, 3: { halign: 'center', cellWidth: 14 }, 4: { halign: 'right', cellWidth: 28 }, 5: { halign: 'right', cellWidth: 28, fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore - autoTable adds lastAutoTable
  y = (doc as any).lastAutoTable.finalY + 4;

  // Total summary
  doc.setFillColor(...ELIS.light);
  doc.roundedRect(pageW - 82, y, 68, 14, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ELIS.teal);
  doc.text('TOTAL:', pageW - 76, y + 9);
  doc.setFontSize(11);
  doc.setTextColor(...ELIS.dark);
  doc.text(formatCurrency(order.valor_total || 0), pageW - 18, y + 9.5, { align: 'right' });
  y += 20;

  // Signatures
  const leftX = 14;
  const rightX = 110;
  const lineW = 76;

  if (y + 45 > pageH - 20) { doc.addPage(); y = 30; }

  doc.setDrawColor(...ELIS.blue);
  doc.setLineWidth(0.5);
  doc.line(leftX, y + 15, leftX + lineW, y + 15);
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ELIS.dark);
  doc.text('Solicitante', leftX + lineW / 2, y + 21, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...ELIS.medium);
  doc.text('Assinatura / Data', leftX + lineW / 2, y + 26, { align: 'center' });

  if (order.assinatura) {
    const sig = order.assinatura;
    const accentColor = sig.acao === 'Aprovação' ? ELIS.teal : ELIS.red;
    doc.setDrawColor(...accentColor); doc.setLineWidth(1);
    doc.line(rightX, y, rightX + lineW, y);
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ELIS.dark);
    doc.text(sig.gestora, rightX + lineW / 2, y + 8, { align: 'center' });
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...accentColor);
    doc.text(sig.acao.toUpperCase(), rightX + lineW / 2, y + 13, { align: 'center' });
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...ELIS.medium);
    doc.text(format(new Date(sig.dataHora), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR }), rightX + lineW / 2, y + 18, { align: 'center' });
    doc.setFontSize(6); doc.setTextColor(...ELIS.blue);
    doc.text(`SHA-256: ${sig.hash}`, rightX + lineW / 2, y + 23, { align: 'center' });
    doc.setFontSize(7); doc.setTextColor(...ELIS.medium);
    doc.text('Assinatura Digital', rightX + lineW / 2, y + 28, { align: 'center' });
  } else {
    doc.line(rightX, y + 15, rightX + lineW, y + 15);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ELIS.dark);
    doc.text('Gestor Aprovador', rightX + lineW / 2, y + 21, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...ELIS.medium);
    doc.text('Assinatura / Data', rightX + lineW / 2, y + 26, { align: 'center' });
  }

  // Footer
  doc.setFillColor(...ELIS.teal);
  doc.rect(14, pageH - 18, pageW - 28, 0.8, 'F');
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...ELIS.medium);
  doc.text('Elis Service — Circular at work', 14, pageH - 12);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageW / 2, pageH - 12, { align: 'center' });
  doc.setTextColor(...ELIS.teal);
  doc.text('Documento confidencial', pageW - 14, pageH - 12, { align: 'right' });

  doc.save(`Pedido_Elis_${order.id.substring(0, 8)}.pdf`);
};

// ─── General Report Export ───────────────────────────────────
export const exportGeneralReport = (orders: Order[], title: string = 'Relatório Geral') => {
  const doc = new jsPDF('landscape');
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;

  // Header
  doc.setFillColor(...ELIS.blueDark);
  doc.rect(0, 0, pageW, 30, 'F');
  doc.setFillColor(...ELIS.teal);
  doc.rect(0, 30, pageW, 2, 'F');
  try { doc.addImage(ELIS_LOGO_BASE64, 'PNG', 10, 3, 24, 24); } catch { /* fallback */ }
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ELIS.white);
  doc.text(title, 40, 18);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 196, 214);
  doc.text(`${orders.length} pedidos | Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 40, 25);

  // Summary
  let y = 40;
  const aprovados = orders.filter(o => o.status === 'Aprovado');
  const totalGeral = orders.reduce((a, o) => a + (o.valor_total || 0), 0);
  const totalAprovado = aprovados.reduce((a, o) => a + (o.valor_total || 0), 0);

  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...ELIS.dark);
  doc.text(`Total Geral: ${formatCurrency(totalGeral)}`, 14, y);
  doc.setTextColor(...ELIS.teal);
  doc.text(`Aprovado: ${formatCurrency(totalAprovado)}`, 100, y);
  doc.setTextColor(...ELIS.medium);
  doc.text(`Pendentes: ${orders.filter(o => o.status === 'Pendente').length} | Em Análise: ${orders.filter(o => o.status === 'Em Análise').length} | Aprovados: ${aprovados.length} | Rejeitados: ${orders.filter(o => o.status === 'Rejeitado').length}`, 180, y);
  y += 8;

  // Table
  const tableData = orders.map(o => [
    o.id.substring(0, 8),
    o.solicitante,
    o.departamento,
    format(new Date(o.data_criacao), "dd/MM/yy"),
    String(o.total_itens),
    formatCurrency(o.valor_total || 0),
    o.status,
    o.assinatura?.gestora || '-',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['ID', 'SOLICITANTE', 'DEPTO.', 'DATA', 'ITENS', 'VALOR', 'STATUS', 'GESTORA']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: ELIS.teal, textColor: ELIS.white, fontSize: 7, fontStyle: 'bold', halign: 'center', cellPadding: 2.5 },
    bodyStyles: { fontSize: 7, textColor: ELIS.dark, cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 22 }, 5: { halign: 'right', fontStyle: 'bold' }, 6: { halign: 'center' } },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const val = data.cell.raw as string;
        if (val === 'Aprovado') data.cell.styles.textColor = ELIS.teal;
        else if (val === 'Rejeitado') data.cell.styles.textColor = ELIS.red;
        else if (val === 'Em Análise') data.cell.styles.textColor = ELIS.purple;
        else data.cell.styles.textColor = ELIS.amber;
      }
    },
  });

  // Footer
  doc.setFillColor(...ELIS.teal);
  doc.rect(14, pageH - 14, pageW - 28, 0.8, 'F');
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...ELIS.medium);
  doc.text('Elis Service — Relatório Consolidado', 14, pageH - 8);
  doc.setTextColor(...ELIS.teal);
  doc.text('Documento confidencial', pageW - 14, pageH - 8, { align: 'right' });

  doc.save(`Relatorio_Elis_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
};
