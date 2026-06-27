import type { DocBlock, DocumentTemplateData } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface CartItemForBuilder {
  product: {
    name: string;
    sku: string;
    unit: string;
    photos?: { url: string; isMain?: boolean }[];
  };
  quantity: number;
  priceSnapshot: number;
  markupPercent: number | null;
}

interface ProposalFinance {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
}

interface BuildProposalBlocksParams {
  templateBlocks: DocBlock[];
  cartItems: CartItemForBuilder[];
  finance: ProposalFinance;
  clientMarkup?: number;
}

export function buildProposalBlocks({
  templateBlocks,
  cartItems,
  finance,
  clientMarkup,
}: BuildProposalBlocksParams): DocBlock[] {
  return templateBlocks.map((block) => {
    if (block.type === 'table') {
      return buildTableBlock(block, cartItems, finance, clientMarkup);
    }
    return { ...block };
  });
}

function buildTableBlock(
  block: DocBlock,
  cartItems: CartItemForBuilder[],
  finance: ProposalFinance,
  clientMarkup?: number
): DocBlock {
  const inlineRows = cartItems.map((item) => {
    const markup = clientMarkup ?? item.markupPercent ?? 0;
    const unitPrice = item.priceSnapshot * (1 + markup / 100);
    const total = unitPrice * item.quantity;

    return {
      // Резолвим основное фото из relation Product.photos (блок 1.2: photo-поле в registry).
      // Приоритет: isMain=true → первое попавшееся → null.
      photo: (item.product.photos?.find?.((p) => p.isMain)?.url
        ?? item.product.photos?.[0]?.url
        ?? null),
      name: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      unit: item.product.unit || 'шт',
      price: formatCurrency(unitPrice),
      total: formatCurrency(total),
    };
  });

  const footerRows: { label: string; value: string }[] = [];

  footerRows.push({
    label: 'Итого:',
    value: formatCurrency(finance.subtotal),
  });

  if (finance.discountPercent > 0) {
    footerRows.push({
      label: `Скидка ${finance.discountPercent}%:`,
      value: `−${formatCurrency(finance.discountAmount)}`,
    });
  }

  if (finance.vatRate > 0) {
    footerRows.push({
      label: `НДС (${finance.vatRate}%):`,
      value: formatCurrency(finance.vatAmount),
    });
  }

  footerRows.push({
    label: 'Всего к оплате:',
    value: formatCurrency(finance.grandTotal),
  });

  return {
    ...block,
    _inlineRows: inlineRows,
    _footerRows: footerRows,
  };
}

export function getTemplateBlocks(template: DocumentTemplateData | null): DocBlock[] {
  if (!template || !template.blocks) {
    return getDefaultBlocks();
  }
  return template.blocks;
}

function getDefaultBlocks(): DocBlock[] {
  return [
    {
      id: 'default-header',
      type: 'text',
      order: 0,
      title: 'Заголовок',
      content: 'КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ',
      settings: { align: 'center', fontSize: '18px' },
    },
    {
      id: 'default-table',
      type: 'table',
      order: 1,
      title: 'Товары',
      showLine: true,
    },
    {
      id: 'default-footer',
      type: 'text',
      order: 2,
      title: 'Подпись',
      content: 'Подпись: ___________________',
    },
  ];
}
