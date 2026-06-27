/**
 * table-template-data.ts — Система источников данных для шаблонов таблиц
 *
 * В v4.0 каждая колонка шаблона таблицы знала:
 *   - tableName: откуда брать данные (products, items, services)
 *   - fieldName: какое поле из источника показывать
 *
 * Этот файл — реестр всех доступных источников и их полей.
 */

export interface DataField {
  name: string;        // fieldName — техническое имя
  label: string;       // человекочитаемый заголовок
  type: 'text' | 'number' | 'date' | 'currency' | 'image';
  defaultWidth?: string;
  align?: 'left' | 'center' | 'right';
  format?: string;     // опциональный формат (напр. "0.00")
}

export interface DataSource {
  name: string;        // tableName
  label: string;       // отображаемое название источника
  fields: DataField[];
}

/**
 * Реестр источников данных.
 *
 * При добавлении нового источника данных (например, "services"),
 * нужно добавить его сюда и указать все поля.
 */
export const DATA_SOURCES: Record<string, DataSource> = {
  products: {
    name: 'products',
    label: 'Товары',
    fields: [
      { name: 'rowNumber',  label: '№',          type: 'number',   defaultWidth: '40px',  align: 'center' },
      { name: 'photo',      label: 'Фотография', type: 'image',    defaultWidth: '60px',  align: 'center' },
      { name: 'name',       label: 'Наименование', type: 'text',    defaultWidth: '200px', align: 'left' },
      { name: 'sku',        label: 'Артикул',     type: 'text',    defaultWidth: '100px', align: 'left' },
      { name: 'unit',       label: 'Ед. изм.',    type: 'text',    defaultWidth: '60px',  align: 'center' },
      { name: 'quantity',   label: 'Количество',  type: 'number',  defaultWidth: '80px',  align: 'center' },
      { name: 'unitPrice',  label: 'Цена',        type: 'currency', defaultWidth: '100px', align: 'right' },
      { name: 'markupPercent', label: 'Наценка %',type: 'number',  defaultWidth: '80px',  align: 'center' },
      { name: 'total',      label: 'Сумма',       type: 'currency', defaultWidth: '120px', align: 'right' },
    ],
  },
  items: {
    name: 'items',
    label: 'Позиции документа',
    fields: [
      { name: 'rowNumber',  label: '№',          type: 'number',   defaultWidth: '40px',  align: 'center' },
      { name: 'photo',      label: 'Фотография', type: 'image',    defaultWidth: '60px',  align: 'center' },
      { name: 'name',       label: 'Наименование', type: 'text',    defaultWidth: '200px', align: 'left' },
      { name: 'quantity',   label: 'Количество',  type: 'number',  defaultWidth: '80px',  align: 'center' },
      { name: 'unit',       label: 'Ед. изм.',    type: 'text',    defaultWidth: '60px',  align: 'center' },
      { name: 'unitPrice',  label: 'Цена',        type: 'currency', defaultWidth: '100px', align: 'right' },
      { name: 'total',      label: 'Сумма',       type: 'currency', defaultWidth: '120px', align: 'right' },
    ],
  },
  services: {
    name: 'services',
    label: 'Услуги',
    fields: [
      { name: 'rowNumber',  label: '№',          type: 'number',   defaultWidth: '40px',  align: 'center' },
      { name: 'name',       label: 'Наименование', type: 'text',    defaultWidth: '250px', align: 'left' },
      { name: 'quantity',   label: 'Объём',       type: 'number',  defaultWidth: '80px',  align: 'center' },
      { name: 'unit',       label: 'Ед.',         type: 'text',    defaultWidth: '60px',  align: 'center' },
      { name: 'unitPrice',  label: 'Цена',        type: 'currency', defaultWidth: '100px', align: 'right' },
      { name: 'total',      label: 'Сумма',       type: 'currency', defaultWidth: '120px', align: 'right' },
    ],
  },
  finance: {
    name: 'finance',
    label: 'Финансовые итоги',
    fields: [
      { name: 'label',      label: 'Наименование', type: 'text',    defaultWidth: '200px', align: 'left' },
      { name: 'value',      label: 'Значение',    type: 'currency', defaultWidth: '120px', align: 'right' },
    ],
  },
};

// ───────────────────────────────────────────────────────────────
// Цветовые классы для бейджей источников (CSS-переменные из globals.css)
// Визуальная дифференциация колонок в редакторе шаблонов таблиц
// ───────────────────────────────────────────────────────────────
export const SOURCE_COLORS: Record<string, string> = {
  products: 'bg-[var(--status-info-bg)]    text-[var(--status-info-text)]',
  items:    'bg-[var(--status-emerald-bg)] text-[var(--status-emerald-text)]',
  services: 'bg-[var(--status-violet-bg)]  text-[var(--status-violet-text)]',
  finance:  'bg-[var(--status-amber-bg)]   text-[var(--status-amber-text)]',
};

const SOURCE_COLOR_FALLBACK = 'bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)]';

export function getSourceColor(tableName: string): string {
  return SOURCE_COLORS[tableName] || SOURCE_COLOR_FALLBACK;
}

/**
 * v4.0-стиль: колонка знает источник и поле
 */
export interface TableTemplateColumnV4 {
  id: string;
  tableName: string;      // источник данных (products, items, ...)
  fieldName: string;       // поле из источника (name, sku, ...)
  label: string;           // заголовок колонки
  width?: string;          // CSS ширина (напр. "100px", "20%")
  type?: 'text' | 'number' | 'date' | 'currency' | 'image';
  order: number;           // порядок сортировки
  visible?: boolean;       // показать/скрыть
  align?: 'left' | 'center' | 'right';
  bold?: boolean;          // жирный шрифт колонки
  italic?: boolean;        // курсив колонки
}

/**
 * Получить информацию о поле из реестра
 */
export function getFieldInfo(tableName: string, fieldName: string): DataField | null {
  const source = DATA_SOURCES[tableName];
  if (!source) return null;
  return source.fields.find((f) => f.name === fieldName) || null;
}

/**
 * Получить лейбл поля из реестра или вернуть fieldName как fallback
 */
export function getFieldLabel(tableName: string, fieldName: string): string {
  const field = getFieldInfo(tableName, fieldName);
  return field?.label || fieldName;
}

/**
 * Список доступных источников для выпадающего списка
 */
export function getDataSourceOptions(): { value: string; label: string }[] {
  return Object.values(DATA_SOURCES).map((ds) => ({
    value: ds.name,
    label: ds.label,
  }));
}

/**
 * Поля источника для выпадающего списка
 */
export interface FieldOption {
  value: string;
  label: string;
  type: string;
  align?: 'left' | 'center' | 'right';
}

export function getFieldOptions(tableName: string): FieldOption[] {
  const source = DATA_SOURCES[tableName];
  if (!source) return [];
  return source.fields.map((f) => ({
    value: f.name,
    label: f.label,
    type: f.type,
    align: f.align,
  }));
}
