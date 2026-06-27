export type UserRole = 'admin' | 'manager' | 'production' | 'storekeeper' | 'accountant' | 'viewer';

export interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
}

export type DocBlockType = 'text' | 'table' | 'separator';

export interface DocBlockSettings {
  padding?: string;
  fontSize?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DocTextColumn {
  id: string;
  content: string;
  width?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  color?: string;
}

export interface DocBlock {
  id: string;
  type: DocBlockType;
  order: number;
  page?: number;
  title?: string;
  content?: string;
  columns?: DocTextColumn[];
  tableTemplateId?: string;
  height?: number;
  showLine?: boolean;
  settings?: DocBlockSettings;
  _inlineRows?: Record<string, unknown>[];
  _footerRows?: { label: string; value: string }[];
}

export interface DocumentTemplateData {
  id: string;
  name: string;
  description?: string;
  docType: string;
  pageSize?: string;
  backgroundImage?: string;
  backgroundOpacity?: number;
  organizationId?: string;
  isDefault?: boolean;
  blocks: DocBlock[];
  createdAt: string;
  updatedAt: string;
}

// ========================================
// ШАБЛОНЫ ТАБЛИЦ — v4.0 совместимость
// ========================================

/**
 * Колонка шаблона таблицы в стиле v4.0:
 * Каждая колонка знает источник данных (tableName) и поле (fieldName).
 * При рендере документа данные подставляются автоматически.
 */
export interface TableColumn {
  id: string;
  /** Откуда брать данные (products, items, services, finance) */
  tableName: string;
  /** Какое поле из источника (name, sku, unitPrice, quantity...) */
  fieldName: string;
  /** Заголовок колонки (по умолчанию = лейбл поля из реестра) */
  label: string;
  /** Ширина колонки (CSS: "100px", "20%", "auto") */
  width?: string;
  /** Тип данных для форматирования (image — рендер URL как <img> в preview, doc.addImage в PDF) */
  type?: 'text' | 'number' | 'date' | 'currency' | 'image';
  /** Порядок сортировки */
  order: number;
  /** Показать/скрыть колонку */
  visible?: boolean;
  /** Выравнивание содержимого */
  align?: 'left' | 'center' | 'right';
}
