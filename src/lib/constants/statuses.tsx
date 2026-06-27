// ========================================
// Unified Status maps — единый источник истины
// Все компоненты и страницы импортируют отсюда.
//
// Цветовые токены — CSS-переменные из src/app/globals.css
// (--status-*-bg / --status-*-text). Tailwind JIT синтаксис
// bg-[var(--X)] — позволяет использовать переменные динамически
// и автоматически срабатывает на тему через [data-theme="dark"].
// Преимущества:
//   - Одна правка в globals.css → меняет всю палитру
//   - Dark theme работает без Tailwind dark:variant в каждом мапе
//   - Меньше символов в .map (NEUTRAL/SUCCESS/... константы)
// ========================================

import type React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

export interface StatusConfig {
  label: string;
  className: string;
  icon?: React.ElementType;
}

export type StatusMap = Record<string, StatusConfig>;

// ── Палитра цветовых пар (CSS переменные из globals.css) ──
const NEUTRAL = 'bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)]';
const SUCCESS = 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]';
const WARNING = 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]';
const DANGER  = 'bg-[var(--status-danger-bg)]  text-[var(--status-danger-text)]';
const INFO    = 'bg-[var(--status-info-bg)]    text-[var(--status-info-text)]';
const PURPLE  = 'bg-[var(--status-purple-bg)]  text-[var(--status-purple-text)]';
const CYAN    = 'bg-[var(--status-cyan-bg)]    text-[var(--status-cyan-text)]';
const ORANGE  = 'bg-[var(--status-orange-bg)]  text-[var(--status-orange-text)]';
const EMERALD = 'bg-[var(--status-emerald-bg)] text-[var(--status-emerald-text)]';
const INDIGO  = 'bg-[var(--status-indigo-bg)]  text-[var(--status-indigo-text)]';

// ── Proposal ─────────────────────────
// draft → sent → accepted/rejected → converted
export const PROPOSAL_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: NEUTRAL },
  sent: { label: 'Отправлено', className: INFO },
  accepted: { label: 'Принято', className: SUCCESS },
  rejected: { label: 'Отклонено', className: DANGER },
  converted: { label: 'Конвертировано', className: PURPLE },
};

// ── Contract ─────────────────────────
// draft → active → completed / cancelled
export const CONTRACT_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: NEUTRAL },
  active: { label: 'Активно', className: SUCCESS },
  completed: { label: 'Завершено', className: INFO },
  cancelled: { label: 'Отменено', className: DANGER },
};

// ── Production Order ─────────────────
// planned → in_progress → manufacturing → painting → shipping → completed
// cancelled — в любой момент
export const ORDER_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: NEUTRAL },
  planned: { label: 'Запланировано', className: PURPLE },
  in_progress: { label: 'В работе', className: WARNING },
  manufacturing: { label: 'Производство', className: INFO },
  painting: { label: 'Покраска', className: CYAN },
  shipping: { label: 'Отгрузка', className: INDIGO },
  completed: { label: 'Завершено', className: EMERALD },
  cancelled: { label: 'Отменено', className: DANGER },
};

// ── Order Task ───────────────────────
export const TASK_STATUS: Record<string, StatusConfig> = {
  pending: { label: 'Ожидание', className: NEUTRAL },
  in_progress: { label: 'В работе', className: WARNING },
  completed: { label: 'Выполнена', className: EMERALD },
  blocked: { label: 'Заблокирована', className: DANGER },
};

// ── Purchase Request ─────────────────
export const PURCHASE_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: NEUTRAL },
  pending: { label: 'Ожидание', className: NEUTRAL },
  approved: { label: 'Согласована', className: INFO },
  ordered: { label: 'Заказано', className: PURPLE },
  received: { label: 'Получено', className: SUCCESS },
  cancelled: { label: 'Отменено', className: DANGER },
};

// ── Supplier Order ───────────────────
export const SUPPLIER_ORDER_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: NEUTRAL },
  confirmed: { label: 'Подтверждён', className: INFO },
  shipped: { label: 'Отгружен', className: PURPLE },
  delivered: { label: 'Доставлен', className: SUCCESS },
  cancelled: { label: 'Отменён', className: DANGER },
};

// ── Incoming Invoice ─────────────────
export const INVOICE_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: NEUTRAL },
  paid: { label: 'Оплачен', className: SUCCESS },
  overdue: { label: 'Просрочен', className: DANGER },
};

// ── Tender ───────────────────────────
export const TENDER_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: NEUTRAL },
  submitted: { label: 'Подано', className: INFO },
  in_progress: { label: 'В работе', className: WARNING },
  won: { label: 'Выигран', className: SUCCESS },
  lost: { label: 'Проигран', className: DANGER },
  cancelled: { label: 'Отменён', className: DANGER },
  overdue: { label: 'Просрочено', className: DANGER },
};

// ── Certificate ──────────────────────
export const CERTIFICATE_STATUS: Record<string, StatusConfig> = {
  active: { label: 'Действует', className: SUCCESS, icon: ShieldCheck },
  expired: { label: 'Истёк', className: WARNING, icon: ShieldAlert },
  revoked: { label: 'Отозван', className: DANGER, icon: ShieldX },
};

// ── RPP Entry ────────────────────────
export const RPP_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: NEUTRAL },
  active: { label: 'Активно', className: SUCCESS },
  archived: { label: 'В архиве', className: INFO },
};

// ── Shipment ─────────────────────────
export const SHIPPING_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: NEUTRAL },
  partially: { label: 'Частично', className: WARNING },
  shipped: { label: 'Отгружено', className: SUCCESS },
  cancelled: { label: 'Отменено', className: DANGER },
};

// ── Order Closing ────────────────────
export const CLOSING_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: NEUTRAL },
  approved: { label: 'Утверждён', className: INFO },
  completed: { label: 'Закрыт', className: SUCCESS },
};

// ── Reconciliation Act ───────────────
export const RECON_STATUS: Record<string, StatusConfig> = {
  draft: { label: 'Черновик', className: NEUTRAL },
  signed: { label: 'Подписан', className: SUCCESS },
};

// ── Storage Item / Inventory ─────────
export const INVENTORY_STATUS: Record<string, StatusConfig> = {
  in_stock: { label: 'В наличии', className: SUCCESS },
  low: { label: 'Мало', className: WARNING },
  out_of_stock: { label: 'Нет', className: DANGER },
};

// ── isActive boolean ─────────────────
// Для сущностей с булевым статусом: организации, склады, типы работ
export const IS_ACTIVE_STATUS: Record<string, StatusConfig> = {
  active: { label: 'Активен', className: SUCCESS },
  inactive: { label: 'Неактивен', className: NEUTRAL },
};

export const IS_ACTIVE_MAP: Record<string, string> = {
  active: 'Активен',
  inactive: 'Неактивен',
};

// Для сущностей со статусом блокировки (пользователи)
export const USER_STATUS: Record<string, StatusConfig> = {
  active: { label: 'Активен', className: SUCCESS },
  blocked: { label: 'Заблокирован', className: NEUTRAL },
};

// ── User Role ────────────────────────
// Роли пользователей: admin/manager/production/storekeeper/accountant/viewer
export const USER_ROLE: Record<string, StatusConfig> = {
  admin: { label: 'Администратор', className: DANGER },
  manager: { label: 'Менеджер', className: INFO },
  production: { label: 'Производство', className: ORANGE },
  storekeeper: { label: 'Кладовщик', className: SUCCESS },
  accountant: { label: 'Бухгалтер', className: PURPLE },
  viewer: { label: 'Наблюдатель', className: NEUTRAL },
};

// Для isActive как Да/Нет (статус-воркфлоу)
export const IS_ACTIVE_YESNO: Record<string, StatusConfig> = {
  yes: { label: 'Да', className: SUCCESS },
  no: { label: 'Нет', className: NEUTRAL },
};

export const IS_ACTIVE_FEMININE: Record<string, StatusConfig> = {
  active: { label: 'Активна', className: SUCCESS },
  inactive: { label: 'Неактивна', className: NEUTRAL },
};

// ========================================
// Helpers
// ========================================

export function getStatus(map: Record<string, StatusConfig>, status: string): StatusConfig {
  return map[status] || { label: status, className: NEUTRAL };
}

export function StatusBadge({
  status,
  map,
  className,
}: {
  status: string;
  map: Record<string, StatusConfig>;
  className?: string;
}) {
  const cfg = getStatus(map, status);
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.className}${className ? ' ' + className : ''}`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {cfg.label}
    </span>
  );
}
