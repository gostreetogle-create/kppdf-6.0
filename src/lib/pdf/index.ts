/**
 * pdf/index.ts — Генерация PDF документов
 *
 * Использует jsPDF + jspdf-autotable для создания
 * профессиональных PDF с таблицами.
 */

// jsPDF и jspdf-autotable импортируются динамически через getPdfLibs()
// чтобы не раздувать основной бандл (эти библиотеки нужны только при скачивании PDF)
import type jsPDFType from 'jspdf';

let _jsPDF: typeof jsPDFType | null = null;
let _autoTable: ((doc: jsPDFType, options: Record<string, unknown>) => void) | null = null;

async function getPdfLibs() {
  if (!_jsPDF || !_autoTable) {
    const [{ jsPDF }, { autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);
    _jsPDF = jsPDF;
    _autoTable = autoTable;
  }
  return { jsPDF: _jsPDF, autoTable: _autoTable };
}

// ─── Cyrillic font loader ────────────────────────────────────────────────────

const ROBOTO_FONT_URL = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf';

let fontBase64: string | null = null;
let fontRetries = 0;

async function ensureCyrillicFont(doc: jsPDFType): Promise<void> {
  // Fetch once, retry up to 3 times on failure, register on every new doc
  if (!fontBase64 && fontRetries < 3) {
    try {
      const res = await fetch(ROBOTO_FONT_URL);
      if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`);
      const fontData = await res.arrayBuffer();
      const bytes = new Uint8Array(fontData);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      fontBase64 = btoa(binary);
    } catch {
      fontRetries++;
      console.warn(`Failed to load Cyrillic PDF font (attempt ${fontRetries}/3)`);
    }
  }
  if (fontBase64) {
    doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'bold');
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProposalPdfData {
  number: string;
  title: string;
  status: string;
  client?: {
    lastName: string;
    firstName: string;
    patronymic?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  organization?: {
    name: string;
    shortName?: string;
    legalForm?: string;
    inn?: string;
    kpp?: string;
    ogrn?: string;
    legalAddress?: string;
    phone?: string;
    email?: string;
    bankName?: string;
    bankBik?: string;
    bankAccount?: string;
    signerName?: string;
    signerPosition?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    markupPercent?: number;
    total: number;
  }>;
  /**
   * Блок 1.2b/c: data-driven columns (если заданы). Используются превью и PDF autoTable
   * для рендера image/text/number/currency колонок. Если не заданы — fallback
   * на стандартный набор колонок в обоих consumers.
   */
  columns?: Array<{
    id: string;
    tableName: string;
    fieldName: string;
    label: string;
    width?: string;
    type?: 'text' | 'number' | 'date' | 'currency' | 'image';
    order: number;
    visible?: boolean;
    align?: 'left' | 'center' | 'right';
  }>;
  markupPercent?: number;
  notes?: string;
  validUntil?: string;
  createdAt: string;
  discountPercent?: number;
  discountAmount?: number;
  vatRate?: number;
  vatAmount?: number;
  grandTotal?: number;
}

export interface ContractPdfData {
  number: string;
  title: string;
  status: string;
  client?: {
    lastName: string;
    firstName: string;
    patronymic?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  organization?: {
    name: string;
    shortName?: string;
    legalForm?: string;
    inn?: string;
    kpp?: string;
    ogrn?: string;
    legalAddress?: string;
    phone?: string;
    email?: string;
    bankName?: string;
    bankBik?: string;
    bankAccount?: string;
    signerName?: string;
    signerPosition?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    total: number;
  }>;
  columns?: Array<{
    id: string;
    tableName: string;
    fieldName: string;
    label: string;
    width?: string;
    type?: 'text' | 'number' | 'date' | 'currency' | 'image';
    order: number;
    visible?: boolean;
    align?: 'left' | 'center' | 'right';
  }>;
  totalAmount: number;
  signedAt?: string;
  expiresAt?: string;
  notes?: string;
  createdAt: string;
}

export interface InvoicePdfData {
  number: string;
  title: string;
  status: string;
  client?: {
    lastName: string;
    firstName: string;
    patronymic?: string;
    phone?: string;
  };
  organization?: {
    name: string;
    shortName?: string;
    inn?: string;
    kpp?: string;
    legalAddress?: string;
    phone?: string;
    email?: string;
    bankName?: string;
    bankBik?: string;
    bankAccount?: string;
    signerName?: string;
    signerPosition?: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    total: number;
  }>;
  columns?: Array<{
    id: string;
    tableName: string;
    fieldName: string;
    label: string;
    width?: string;
    type?: 'text' | 'number' | 'date' | 'currency' | 'image';
    order: number;
    visible?: boolean;
    align?: 'left' | 'center' | 'right';
  }>;
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

export function formatPrice(amount: number): string {
  return amount.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' ₽';
}

export function formatDate(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function formatDateShort(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// ─── PDF Generation ──────────────────────────────────────────────────────────

const MARGIN = 4;
const PAGE_W = 210;
const PAGE_H = 297; // A4 height in mm — для overflow check и page-break

// Минимальный тип для параметра didDrawPage hook jspdf-autotable (нет public export).
interface AutoTablePageData {
  pageNumber: number;
  pageCount: number;
  cursor: { x: number; y: number };
  settings: Record<string, unknown>;
}

/** Сгенерировать PDF для КП */
export async function generateProposalPdf(data: ProposalPdfData): Promise<jsPDFType> {
  const { jsPDF } = await getPdfLibs();
  const doc = new jsPDF('p', 'mm', 'a4');
  await ensureCyrillicFont(doc);
  const contentW = PAGE_W - MARGIN * 2;
  let y = MARGIN;

  // Organisation info header
  if (data.organization) {
    const org = data.organization;
    doc.setFontSize(14);
    doc.setFont('Roboto', 'bold');
    doc.text(org.name, MARGIN, y);
    y += 6;

    doc.setFontSize(8);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(100, 100, 100);
    if (org.inn) {
      doc.text(`ИНН ${org.inn}${org.kpp ? ` ／ КПП ${org.kpp}` : ''}`, MARGIN, y);
      y += 4;
    }
    if (org.legalAddress) {
      const addrLines = doc.splitTextToSize(org.legalAddress, contentW);
      // Defensive: if address overflows page bottom, push to next page.
      if (y + addrLines.length * 3.5 > PAGE_H - MARGIN * 2) {
        doc.addPage();
        y = MARGIN;
      }
      doc.text(addrLines, MARGIN, y);
      y += addrLines.length * 3.5;
    }
    if (org.phone || org.email) {
      doc.text(`Тел: ${org.phone || '—'}  Email: ${org.email || '—'}`, MARGIN, y);
      y += 4;
    }
    doc.setTextColor(0);
    y += 3;
  }

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 5;

  // Title
  doc.setFontSize(16);
  doc.setFont('Roboto', 'bold');
  doc.text('КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ', PAGE_W / 2, y, { align: 'center' });
  y += 7;

  doc.setFontSize(10);
  doc.setFont('Roboto', 'normal');
  doc.text(`№ ${data.number} от ${formatDateShort(data.createdAt)}`, PAGE_W / 2, y, { align: 'center' });
  y += 4;

  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 5;

  // Client info
  if (data.client) {
    const cl = data.client;
    doc.setFontSize(9);
    doc.text(`Клиент: ${cl.lastName} ${cl.firstName}${cl.patronymic ? ' ' + cl.patronymic : ''}`, MARGIN, y);
    y += 4;
    if (cl.phone) {
      doc.text(`Тел: ${cl.phone}`, MARGIN, y);
      y += 4;
    }
    if (cl.email) {
      doc.text(`Email: ${cl.email}`, MARGIN, y);
      y += 4;
    }
    y += 2;
  }

  // Title
  doc.setFontSize(11);
  doc.setFont('Roboto', 'bold');
  doc.text(data.title, MARGIN, y);
  y += 5;

  // Items table
  if (data.items && data.items.length > 0) {
    const head = [['№', 'Наименование', 'Кол-во', 'Ед.', 'Цена', 'Сумма']];
    const body = data.items.map((item, i) => [
      String(i + 1),
      item.name,
      String(item.quantity),
      item.unit || 'шт',
      formatPrice(item.unitPrice),
      formatPrice(item.total),
    ]);

    const { autoTable } = await getPdfLibs();
    autoTable(doc, {
      startY: y,
      head,
      body,
      margin: { top: 10, bottom: MARGIN, left: MARGIN, right: MARGIN },
      showHead: 'everyPage',
      didDrawPage: (data: AutoTablePageData) => {
        // На стр. 2+ рисую баннер «Продолжение таблицы» сверху страницы.
        if (data.pageNumber > 1) {
          doc.setFontSize(8);
          doc.setFont('Roboto', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(
            `Продолжение таблицы (стр. ${data.pageNumber})`,
            PAGE_W - MARGIN,
            MARGIN + 3,
            { align: 'right' },
          );
          doc.setTextColor(0);
        }
      },
      styles: {
        fontSize: 8,
        cellPadding: 1.5,
        lineColor: [200, 200, 200],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [41, 98, 255],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'right' },
        5: { halign: 'right' },
      },
      foot: [[
        '',
        'ИТОГО:',
        '',
        '',
        '',
        formatPrice(data.items.reduce((s, i) => s + i.total, 0)),
      ]],
      footStyles: {
        fillColor: [240, 240, 240],
        fontStyle: 'bold',
        fontSize: 8,
      },
    });

    const docAT = doc as unknown as { lastAutoTable: { finalY: number } };
    y = docAT.lastAutoTable.finalY + 5;


    // Financial summary
    const total = data.items.reduce((s, i) => s + i.total, 0);
    const discount = data.discountAmount || 0;
    const vatRate = data.vatRate || 20;
    const vat = data.vatAmount || Math.round((total - discount) * vatRate / (100 + vatRate));
    const grandTotal = data.grandTotal || total - discount;

    const finRows: { label: string; value: string; bold?: boolean }[] = [
      { label: 'Сумма:', value: formatPrice(total) },
    ];
    if (discount > 0) {
      finRows.push({ label: `Скидка (${data.discountPercent}%):`, value: `−${formatPrice(discount)}` });
    }
    finRows.push({ label: `НДС (${vatRate}%):`, value: formatPrice(vat) });
    finRows.push({ label: 'Всего к оплате:', value: formatPrice(grandTotal), bold: true });

    finRows.forEach((row) => {
      doc.setFontSize(row.bold ? 11 : 9);
      doc.setFont('Roboto', row.bold ? 'bold' : 'normal');
      doc.text(`${row.label}  ${row.value}`, PAGE_W - MARGIN, y, { align: 'right' });
      y += row.bold ? 5 : 4;
    });
  }

  y += 3;

  // Notes
  if (data.notes) {
    doc.setDrawColor(200, 200, 200);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 4;
    doc.setFontSize(9);
    doc.setFont('Roboto', 'bold');
    doc.text('Примечания:', MARGIN, y);
    y += 4;
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const noteLines = doc.splitTextToSize(data.notes, contentW);
    doc.text(noteLines, MARGIN, y);
    y += noteLines.length * 3.5 + 3;
    doc.setTextColor(0);
  }

  // Valid until
  if (data.validUntil) {
    doc.setFontSize(9);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Действительно до: ${formatDate(data.validUntil)}`, MARGIN, y);
    y += 4;
    doc.setTextColor(0);
  }

  // Markup
  if (data.markupPercent && data.markupPercent > 0) {
    doc.setFontSize(9);
    doc.text(`Наценка: ${data.markupPercent}%`, MARGIN, y);
    y += 4;
  }

  // Signature
  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont('Roboto', 'normal');
  doc.text('Подпись: ___________________', MARGIN, y);
  y += 5;
  if (data.organization?.signerName) {
    doc.setFontSize(9);
    doc.text(
      `${data.organization.signerPosition || ''} ${data.organization.signerName}`,
      MARGIN, y,
    );
  }

  return doc;
}

/** Сгенерировать PDF для договора */
export async function generateContractPdf(data: ContractPdfData): Promise<jsPDFType> {
  const { jsPDF, autoTable } = await getPdfLibs();
  const doc = new jsPDF('p', 'mm', 'a4');
  await ensureCyrillicFont(doc);
  let y = MARGIN;

  if (data.organization) {
    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    doc.text(data.organization.name, MARGIN, y);
    y += 5;
    if (data.organization.inn) {
      doc.text(`ИНН: ${data.organization.inn}  КПП: ${data.organization.kpp || '—'}`, MARGIN, y);
      y += 5;
    }
    if (data.organization.legalAddress) {
      const addrLines = doc.splitTextToSize(`Адрес: ${data.organization.legalAddress}`, PAGE_W - MARGIN * 2);
      if (y + addrLines.length * 3.5 > PAGE_H - MARGIN * 2) {
        doc.addPage();
        y = MARGIN;
      }
      doc.text(addrLines, MARGIN, y);
      y += addrLines.length * 3.5;
    }
    y += 5;
  }

  doc.setFontSize(16);
  doc.setFont('Roboto', 'bold');
  doc.text('ДОГОВОР', PAGE_W / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(12);
  doc.setFont('Roboto', 'normal');
  doc.text(`№ ${data.number}`, PAGE_W / 2, y, { align: 'center' });
  y += 5;
  doc.text(`от ${formatDateShort(data.createdAt)}`, PAGE_W / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(10);
  doc.setFont('Roboto', 'bold');
  doc.text(`Наименование: ${data.title}`, MARGIN, y);
  y += 8;

  if (data.client) {
    doc.setFont('Roboto', 'normal');
    doc.text('Заказчик:', MARGIN, y);
    y += 5;
    doc.text(`${data.client.lastName} ${data.client.firstName} ${data.client.patronymic || ''}`, MARGIN, y);
    y += 5;
    if (data.client.phone) {
      doc.text(`Тел: ${data.client.phone}`, MARGIN, y);
      y += 5;
    }
    y += 3;
  }

  // Items table
  if (data.items && data.items.length > 0) {
    const head = [['№', 'Наименование', 'Кол-во', 'Ед.', 'Сумма']];
    const body = data.items.map((item, i) => [
      String(i + 1),
      item.name,
      String(item.quantity),
      item.unit || 'шт',
      formatPrice(item.total),
    ]);

    autoTable(doc, {
      startY: y,
      head,
      body,
      margin: { top: 10, bottom: MARGIN, left: MARGIN, right: MARGIN },
      showHead: 'everyPage',
      didDrawPage: (data: AutoTablePageData) => {
        if (data.pageNumber > 1) {
          doc.setFontSize(8);
          doc.setFont('Roboto', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(
            `Продолжение таблицы (стр. ${data.pageNumber})`,
            PAGE_W - MARGIN,
            MARGIN + 5,
            { align: 'right' },
          );
          doc.setTextColor(0, 0, 0);
        }
      },
      styles: { fontSize: 8, cellPadding: 1.5, lineColor: [200, 200, 200], lineWidth: 0.3 },
      headStyles: { fillColor: [41, 98, 255], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'right' },
      },
      foot: [[
        '', 'ИТОГО:', '', '',
        formatPrice(data.totalAmount),
      ]],
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', fontSize: 8 },
    });

    const docAT = doc as unknown as { lastAutoTable: { finalY: number } };
    y = docAT.lastAutoTable.finalY + 5;

  }

  if (data.signedAt) {
    doc.setFontSize(10);
    doc.text(`Дата подписания: ${formatDateShort(data.signedAt)}`, MARGIN, y);
    y += 6;
  }
  if (data.expiresAt) {
    doc.text(`Действует до: ${formatDateShort(data.expiresAt)}`, MARGIN, y);
    y += 6;
  }

  if (data.notes) {
    doc.text('Примечания:', MARGIN, y);
    y += 4;
    doc.setFontSize(8);
    const noteLines = doc.splitTextToSize(data.notes, PAGE_W - MARGIN * 2);
    doc.text(noteLines, MARGIN, y);
    y += noteLines.length * 3.5 + 3;
  }

  y += 10;
  doc.setFontSize(10);
  doc.text('ЗАКАЗЧИК:', MARGIN, y);
  doc.text('ИСПОЛНИТЕЛЬ:', PAGE_W / 2, y);
  y += 8;
  doc.text('___________________', MARGIN, y);
  doc.text('___________________', PAGE_W / 2, y);
  y += 5;
  if (data.client) {
    doc.text(`${data.client.lastName} ${data.client.firstName}`, MARGIN, y);
  }
  if (data.organization?.signerName) {
    doc.text(data.organization.signerName, PAGE_W / 2, y);
  }

  return doc;
}

/** Сгенерировать PDF для счёта */
export async function generateInvoicePdf(data: InvoicePdfData): Promise<jsPDFType> {
  const { jsPDF, autoTable } = await getPdfLibs();
  const doc = new jsPDF('p', 'mm', 'a4');
  await ensureCyrillicFont(doc);
  let y = MARGIN;

  if (data.organization) {
    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    doc.text(data.organization.name, MARGIN, y);
    y += 5;
    if (data.organization.inn) {
      doc.text(`ИНН: ${data.organization.inn}  КПП: ${data.organization.kpp || '—'}`, MARGIN, y);
      y += 5;
    }
    if (data.organization.legalAddress) {
      const addrLines = doc.splitTextToSize(`Адрес: ${data.organization.legalAddress}`, PAGE_W - MARGIN * 2);
      if (y + addrLines.length * 3.5 > PAGE_H - MARGIN * 2) {
        doc.addPage();
        y = MARGIN;
      }
      doc.text(addrLines, MARGIN, y);
      y += addrLines.length * 3.5;
    }
    if (data.organization.phone || data.organization.email) {
      doc.text(`Тел: ${data.organization.phone || '—'}  Email: ${data.organization.email || '—'}`, MARGIN, y);
      y += 5;
    }
    y += 5;
  }

  doc.setFontSize(16);
  doc.setFont('Roboto', 'bold');
  doc.text('СЧЁТ-ФАКТУРА', PAGE_W / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(12);
  doc.setFont('Roboto', 'normal');
  doc.text(`№ ${data.number}`, PAGE_W / 2, y, { align: 'center' });
  y += 5;
  doc.text(`от ${formatDateShort(data.createdAt)}`, PAGE_W / 2, y, { align: 'center' });
  y += 10;

  if (data.client) {
    doc.setFontSize(10);
    doc.text('Покупатель:', MARGIN, y);
    y += 5;
    doc.text(`${data.client.lastName} ${data.client.firstName} ${data.client.patronymic || ''}`, MARGIN, y);
    y += 5;
    if (data.client.phone) {
      doc.text(`Тел: ${data.client.phone}`, MARGIN, y);
      y += 5;
    }
    y += 3;
  }

  if (data.items && data.items.length > 0) {
    const head = [['№', 'Наименование', 'Кол-во', 'Ед.', 'Цена', 'Сумма']];
    const body = data.items.map((item, i) => [
      String(i + 1),
      item.name,
      String(item.quantity),
      item.unit || 'шт',
      formatPrice(item.unitPrice),
      formatPrice(item.total),
    ]);

    autoTable(doc, {
      startY: y,
      head,
      body,
      margin: { top: 10, bottom: MARGIN, left: MARGIN, right: MARGIN },
      showHead: 'everyPage',
      didDrawPage: (data: AutoTablePageData) => {
        if (data.pageNumber > 1) {
          doc.setFontSize(8);
          doc.setFont('Roboto', 'normal');
          doc.setTextColor(100, 100, 100);
          doc.text(
            `Продолжение таблицы (стр. ${data.pageNumber})`,
            PAGE_W - MARGIN,
            MARGIN + 5,
            { align: 'right' },
          );
          doc.setTextColor(0, 0, 0);
        }
      },
      styles: { fontSize: 8, cellPadding: 1.5, lineColor: [200, 200, 200], lineWidth: 0.3 },
      headStyles: { fillColor: [41, 98, 255], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'right' },
        5: { halign: 'right' },
      },
      foot: [[
        '', 'ИТОГО:', '', '', '',
        formatPrice(data.totalAmount),
      ]],
      footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', fontSize: 8 },
    });

    const docAT = doc as unknown as { lastAutoTable: { finalY: number } };
    y = docAT.lastAutoTable.finalY + 5;

  }

  // Bank details
  if (data.organization?.bankName) {
    y += 3;
    doc.setFontSize(10);
    doc.setFont('Roboto', 'bold');
    doc.text('Реквизиты для оплаты:', MARGIN, y);
    y += 5;
    doc.setFont('Roboto', 'normal');
    doc.text(`Банк: ${data.organization.bankName}`, MARGIN, y);
    y += 5;
    if (data.organization.bankBik) {
      doc.text(`БИК: ${data.organization.bankBik}`, MARGIN, y);
      y += 5;
    }
    if (data.organization.bankAccount) {
      doc.text(`Счёт: ${data.organization.bankAccount}`, MARGIN, y);
      y += 5;
    }
    if (data.organization.inn) {
      doc.text(`ИНН: ${data.organization.inn}`, MARGIN, y);
      y += 5;
    }
    y += 3;
  }

  if (data.notes) {
    doc.setFontSize(10);
    doc.text('Примечания:', MARGIN, y);
    y += 4;
    doc.setFontSize(8);
    const noteLines = doc.splitTextToSize(data.notes, PAGE_W - MARGIN * 2);
    doc.text(noteLines, MARGIN, y);
    y += noteLines.length * 3.5 + 3;
  }

  y += 10;
  doc.setFontSize(10);
  doc.text('Подпись: ___________________', MARGIN, y);
  y += 6;
  if (data.organization?.signerName) {
    doc.text(`${data.organization.signerPosition || ''} ${data.organization.signerName}`, MARGIN, y);
  }

  return doc;
}

/** Сгенерировать PDF из HTML элемента (через html2canvas) */
export async function generatePdfFromHtml(elementId: string): Promise<jsPDFType> {
  const { jsPDF } = await getPdfLibs();
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pdfWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 10;

  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  return pdf;
}

/** Скачать PDF */
export function downloadPdf(doc: jsPDFType, filename: string): void {
  doc.save(filename);
}

/** Открыть PDF в новой вкладке */
export function openPdfInline(doc: jsPDFType): void {
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/** Получить blob для отправки на сервер */
export function getPdfBlob(doc: jsPDFType): Blob {
  return doc.output('blob');
}
