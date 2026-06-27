import { describe, it, expect } from 'vitest';
import {
  buildProposalBlocks,
  getTemplateBlocks,
} from '../proposal-block-builder';
import type { DocBlock, DocumentTemplateData } from '@/types';

// ===== Test fixtures =====

function makeTableBlock(id = 'tbl-1'): DocBlock {
  return { id, type: 'table', order: 1, title: 'Товары', showLine: true };
}

function makeTextBlock(id = 'txt-1'): DocBlock {
  return {
    id,
    type: 'text',
    order: 0,
    title: 'Заголовок',
    content: 'КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ',
    settings: { align: 'center', fontSize: '18px' },
  };
}

function makeProduct(overrides: Partial<{
  name: string;
  sku: string;
  unit: string;
  photoUrl: string | null;
  isMain: boolean;
  markupPercent: number | null;
}> = {}) {
  const photos = overrides.photoUrl === undefined
    ? undefined
    : overrides.photoUrl === null
      ? []
      : [{ url: overrides.photoUrl, isMain: overrides.isMain }];
  return {
    product: {
      name: overrides.name ?? 'Стол офисный',
      sku: overrides.sku ?? 'SKU-001',
      unit: overrides.unit ?? 'шт',
      ...(photos !== undefined ? { photos } : {}),
    },
    quantity: 2,
    priceSnapshot: 5000,
    markupPercent: 'markupPercent' in overrides ? overrides.markupPercent! : 10,
  };
}

const baseFinance = {
  subtotal: 11000,
  discountPercent: 0,
  discountAmount: 0,
  vatRate: 0,
  vatAmount: 0,
  grandTotal: 11000,
};

// ===== getTemplateBlocks =====

describe('getTemplateBlocks', () => {
  it('должен вернуть default blocks (3 шт.) если template = null', () => {
    const result = getTemplateBlocks(null);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('default-header');
    expect(result[1].id).toBe('default-table');
    expect(result[2].id).toBe('default-footer');
  });

  it('должен вернуть default blocks если template.blocks отсутствует', () => {
    const tpl = { name: 'Шаблон без блоков' } as DocumentTemplateData;
    const result = getTemplateBlocks(tpl);
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('text');
  });

  it('должен вернуть template.blocks если они есть', () => {
    const blocks: DocBlock[] = [makeTextBlock('h1'), makeTableBlock('t1')];
    const tpl = { name: 'T', blocks } as DocumentTemplateData;
    const result = getTemplateBlocks(tpl);
    expect(result).toBe(blocks);
    expect(result).toHaveLength(2);
  });
});

// ===== buildProposalBlocks: non-table passthrough =====

describe('buildProposalBlocks: не-table блоки', () => {
  it('должен clone-ить non-table блоки (не подменять)', () => {
    const textA = makeTextBlock('h1');
    const textB = makeTextBlock('h2');
    const result = buildProposalBlocks({
      templateBlocks: [textA, textB],
      cartItems: [makeProduct()],
      finance: baseFinance,
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(textA);
    expect(result[1]).toEqual(textB);
    // убеждаемся что не тот же reference (clone via spread)
    expect(result[0]).not.toBe(textA);
  });

  it('должен сохранять исходный порядок non-table блоков', () => {
    const result = buildProposalBlocks({
      templateBlocks: [makeTextBlock('a'), makeTableBlock('b'), makeTextBlock('c')],
      cartItems: [makeProduct()],
      finance: baseFinance,
    });
    expect(result.map((b) => b.id)).toEqual(['a', 'b', 'c']);
  });
});

// ===== buildProposalBlocks: table block — inline rows =====

describe('buildProposalBlocks: table block — inline rows', () => {
  it('должен смапить cartItems в inline rows с правильными ценами (markupPercent=10 → unitPrice=5500)', () => {
    const result = buildProposalBlocks({
      templateBlocks: [makeTableBlock('t')],
      cartItems: [makeProduct({ name: 'Стол', sku: 'S-1' })],
      finance: baseFinance,
    });
    const rows = (result[0] as DocBlock & { _inlineRows?: unknown[] })._inlineRows;
    expect(rows).toHaveLength(1);
    const row = (rows as Array<{ name: string; sku: string; quantity: number; price: string; total: string }>)[0];
    expect(row.name).toBe('Стол');
    expect(row.sku).toBe('S-1');
    expect(row.quantity).toBe(2);
    expect(row.price.replace(/\u00A0/g, ' ')).toBe('5 500 ₽'); // 5000 * 1.10
    expect(row.total.replace(/\u00A0/g, ' ')).toBe('11 000 ₽'); // 5500 * 2
  });

  it('clientMarkup должен ОВЕРРАЙДИТЬ per-item markupPercent', () => {
    const item = makeProduct({ name: 'X' }); // markupPercent=10
    const result = buildProposalBlocks({
      templateBlocks: [makeTableBlock('t')],
      cartItems: [item],
      finance: baseFinance,
      clientMarkup: 20, // доминирует
    });
    const row = ((result[0] as DocBlock & { _inlineRows?: Array<{ price: string }> })._inlineRows)![0];
    expect(row.price.replace(/\u00A0/g, ' ')).toBe('6 000 ₽'); // 5000 * 1.20
  });

  it('должен фолбэчить на markupPercent=0 если clientMarkup и item.markupPercent = undefined и null', () => {
    const itemWithNull = makeProduct({ markupPercent: null });
    const result = buildProposalBlocks({
      templateBlocks: [makeTableBlock('t')],
      cartItems: [itemWithNull],
      finance: baseFinance,
    });
    const row = ((result[0] as DocBlock & { _inlineRows?: Array<{ price: string }> })._inlineRows)![0];
    expect(row.price.replace(/\u00A0/g, ' ')).toBe('5 000 ₽'); // markup=0
  });

  it('должен фолбэчить unit на «шт» если product.unit пустой', () => {
    const item = makeProduct({ unit: '' }); // unit=''
    const result = buildProposalBlocks({
      templateBlocks: [makeTableBlock('t')],
      cartItems: [item],
      finance: baseFinance,
    });
    const row = ((result[0] as DocBlock & { _inlineRows?: Array<{ unit: string }> })._inlineRows)![0];
    expect(row.unit).toBe('шт');
  });

  it('должен выбирать фото с isMain=true в приоритете над первым попавшемся', () => {
    const item = makeProduct(); // с photos=[]
    // inject custom photos
    item.product.photos = [
      { url: 'first-not-main.jpg', isMain: false },
      { url: 'main-photo.jpg', isMain: true },
    ];
    const result = buildProposalBlocks({
      templateBlocks: [makeTableBlock('t')],
      cartItems: [item],
      finance: baseFinance,
    });
    const row = ((result[0] as DocBlock & { _inlineRows?: Array<{ photo: string | null }> })._inlineRows)![0];
    expect(row.photo).toBe('main-photo.jpg');
  });

  it('должен фолбэчить на ПЕРВОЕ фото если нет isMain=true', () => {
    const item = makeProduct();
    item.product.photos = [
      { url: 'first.jpg', isMain: false },
      { url: 'second.jpg', isMain: false },
    ];
    const result = buildProposalBlocks({
      templateBlocks: [makeTableBlock('t')],
      cartItems: [item],
      finance: baseFinance,
    });
    const row = ((result[0] as DocBlock & { _inlineRows?: Array<{ photo: string | null }> })._inlineRows)![0];
    expect(row.photo).toBe('first.jpg');
  });

  it('должен записать photo=null если photos отсутствуют', () => {
    const item = makeProduct();
    delete item.product.photos;
    const result = buildProposalBlocks({
      templateBlocks: [makeTableBlock('t')],
      cartItems: [item],
      finance: baseFinance,
    });
    const row = ((result[0] as DocBlock & { _inlineRows?: Array<{ photo: string | null }> })._inlineRows)![0];
    expect(row.photo).toBeNull();
  });

  it('должен НЕ модифицировать исходный cartItems (immutability)', () => {
    const item = makeProduct();
    const before = JSON.parse(JSON.stringify(item));
    buildProposalBlocks({
      templateBlocks: [makeTableBlock('t')],
      cartItems: [item],
      finance: baseFinance,
    });
    expect(item).toEqual(before);
  });
});

// ===== buildProposalBlocks: footer rows =====

describe('buildProposalBlocks: footer rows', () => {
  it('должен показать «Итого» + «Всего к оплате» если нет discount и нет VAT', () => {
    // Implementation always pushes 2 baseline rows (Итого + Всего к оплате);
    // Скидка/НДС rows только при >0.
    const result = buildProposalBlocks({
      templateBlocks: [makeTableBlock()],
      cartItems: [makeProduct()],
      finance: baseFinance,
    });
    const footer = (result[0] as DocBlock & { _footerRows?: Array<{ label: string; value: string }> })._footerRows!;
    expect(footer).toHaveLength(2);
    expect(footer[0].label).toBe('Итого:');
    expect(footer[0].value.replace(/\u00A0/g, ' ')).toBe('11 000 ₽');
    expect(footer[1].label).toBe('Всего к оплате:');
    expect(footer[1].value.replace(/\u00A0/g, ' ')).toBe('11 000 ₽');
  });

  it('должен добавить «Скидка X%» строку если discountPercent > 0', () => {
    const result = buildProposalBlocks({
      templateBlocks: [makeTableBlock()],
      cartItems: [makeProduct()],
      finance: { ...baseFinance, discountPercent: 10, discountAmount: 1100, grandTotal: 9900 },
    });
    const footer = (result[0] as DocBlock & { _footerRows?: Array<{ label: string; value: string }> })._footerRows!;
    expect(footer).toHaveLength(3);
    expect(footer[0].label).toBe('Итого:');
    expect(footer[0].value.replace(/\u00A0/g, ' ')).toBe('11 000 ₽');
    expect(footer[1].label).toBe('Скидка 10%:');
    expect(footer[1].value.replace(/\u00A0/g, ' ')).toBe('−1 100 ₽');
    expect(footer[2].label).toBe('Всего к оплате:');
    expect(footer[2].value.replace(/\u00A0/g, ' ')).toBe('9 900 ₽');
  });

  it('должен добавить «НДС (X%)» строку если vatRate > 0', () => {
    const result = buildProposalBlocks({
      templateBlocks: [makeTableBlock()],
      cartItems: [makeProduct()],
      finance: { ...baseFinance, vatRate: 20, vatAmount: 1833, grandTotal: 11000 },
    });
    const footer = (result[0] as DocBlock & { _footerRows?: Array<{ label: string; value: string }> })._footerRows!;
    expect(footer).toHaveLength(3);
    expect(footer[0].label).toBe('Итого:');
    expect(footer[0].value.replace(/\u00A0/g, ' ')).toBe('11 000 ₽');
    expect(footer[1].label).toBe('НДС (20%):');
    expect(footer[1].value.replace(/\u00A0/g, ' ')).toContain('1 833');
    expect(footer[2].label).toBe('Всего к оплате:');
    expect(footer[2].value.replace(/\u00A0/g, ' ')).toBe('11 000 ₽');
  });

  it('должен показать ВСЕ 4 строки когда discount AND VAT оба активны', () => {
    const result = buildProposalBlocks({
      templateBlocks: [makeTableBlock()],
      cartItems: [makeProduct()],
      finance: {
        subtotal: 11000,
        discountPercent: 10,
        discountAmount: 1100,
        vatRate: 20,
        vatAmount: 1500,
        grandTotal: 9900,
      },
    });
    const footer = (result[0] as DocBlock & { _footerRows?: Array<{ label: string }> })._footerRows!;
    expect(footer).toHaveLength(4);
    expect(footer.map((r) => r.label)).toEqual([
      'Итого:',
      'Скидка 10%:',
      'НДС (20%):',
      'Всего к оплате:',
    ]);
  });
});

// ===== buildProposalBlocks: multiple table blocks =====

describe('buildProposalBlocks: несколько table блоков', () => {
  it('должен обработать КАЖДЫЙ table блок независимо (каждый получает свои _inlineRows)', () => {
    const result = buildProposalBlocks({
      templateBlocks: [makeTableBlock('tbl-A'), makeTableBlock('tbl-B')],
      cartItems: [makeProduct({ name: 'X' })],
      finance: baseFinance,
    });
    const inlineA = (result[0] as DocBlock & { _inlineRows?: unknown[] })._inlineRows;
    const inlineB = (result[1] as DocBlock & { _inlineRows?: unknown[] })._inlineRows;
    expect(inlineA).toBeDefined();
    expect(inlineB).toBeDefined();
    expect(inlineA).not.toBe(inlineB); // разные references
    expect(inlineA).toHaveLength(1);
    expect(inlineB).toHaveLength(1);
  });

  it('должен вернуть пустые _footerRows если cartItems=[] (но Vash computed будет короче)', () => {
    const result = buildProposalBlocks({
      templateBlocks: [makeTableBlock()],
      cartItems: [],
      finance: baseFinance,
    });
    const inlineRows = (result[0] as DocBlock & { _inlineRows?: unknown[] })._inlineRows;
    expect(inlineRows).toEqual([]);
  });
});
