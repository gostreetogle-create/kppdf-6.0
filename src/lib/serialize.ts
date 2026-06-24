/**
 * JSON-safe сериализация Prisma Decimal / BigInt / Date для Server→Client boundary.
 * Почему нельзя напрямую JSON.stringify:
 * - Prisma Decimal — это кастомный класс, JSON.stringify вернёт "{}" (пустой объект).
 * - JavaScript BigInt — JSON.stringify бросает TypeError: Do not know how to serialize a BigInt.
 * - Date передачи через Server Component props — работает, но явный ISO-string безопаснее для гидратации.
 *
 * Используется в API Route Handlers и Page server components ДО передачи в Client Components.
 */
import { Decimal } from '@prisma/client/runtime/library';

/** Prisma Decimal → number with toFixed precision (по умолчанию 2 знака для денег). */
export function decimalToNumber(value: Decimal | null | undefined, digits = 2): number {
  if (value === null || value === undefined) return 0;
  return parseFloat(value.toFixed(digits));
}

/** Prisma Decimal → string ("1234.56") — для случаев когда number теряет точность на больших суммах. */
export function decimalToString(value: Decimal | null | undefined, digits = 2): string {
  if (value === null || value === undefined) return '0.00';
  return value.toFixed(digits);
}

/** BigInt → string (Counter.value). */
export function bigIntToString(value: bigint | null | undefined): string {
  if (value === null || value === undefined) return '0';
  return value.toString();
}

/** Date → ISO string (для createdAt/updatedAt/paidAt). */
export function dateToISO(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

/**
 * Сериализовать Proposal в плоский JS-объект с Decimal/BigInt/Date → безопасные типы.
 * Используется в /api/proposals/[id] и /proposals/[id] Server Component.
 */
export interface SerializedProposalItem {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  productUnit: string;
  quantity: number;
  price: number;
  discountPercent: number | null;
  total: number;
  sortOrder: number;
  notes: string | null;
}

export interface SerializedProposal {
  id: string;
  number: string;
  title: string;
  status: string;
  customerId: string;
  contractorId: string;
  templateId: string | null;
  parentProposalId: string | null;
  version: number;
 vatRate: number;
  currency: string;
  paymentTermDays: number | null;
  packageTag: string | null;
  notes: string | null;
  validUntil: string | null;
  isActive: boolean;
  sentAt: string | null;
  acceptedAt: string | null;
  paidAt: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  /** Persisted autosave draft (правка C из МОДУЛЬ-дока). Server stores it in Proposal.designSnapshot: Json?. */
  designSnapshot: unknown;
  totalAmount: number;
  items: SerializedProposalItem[];
}

export function serializeProposal(proposal: {
  id: string;
  number: string;
  title: string;
  status: string;
  customerId: string;
  contractorId: string;
  templateId: string | null;
  parentProposalId: string | null;
  version: number;
  vatRate: Decimal;
  currency: string;
  paymentTermDays: number | null;
  packageTag: string | null;
  notes: string | null;
  validUntil: Date | null;
  isActive: boolean;
  sentAt: Date | null;
  acceptedAt: Date | null;
  paidAt: Date | null;
  convertedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  items?: Array<{
    id: string;
    productId: string;
    productSku: string;
    productName: string;
    productUnit: string;
    quantity: Decimal;
    price: Decimal;
    discountPercent: Decimal | null;
    total: Decimal;
    sortOrder: number;
    notes: string | null;
  }>;
  _sum?: { total: Decimal | null };
}): SerializedProposal {
  return {
    id: proposal.id,
    number: proposal.number,
    title: proposal.title,
    status: proposal.status,
    customerId: proposal.customerId,
    contractorId: proposal.contractorId,
    templateId: proposal.templateId,
    parentProposalId: proposal.parentProposalId,
    version: proposal.version,
    vatRate: decimalToNumber(proposal.vatRate),
    currency: proposal.currency,
    paymentTermDays: proposal.paymentTermDays,
    packageTag: proposal.packageTag,
    notes: proposal.notes,
    validUntil: dateToISO(proposal.validUntil),
    isActive: proposal.isActive,
    sentAt: dateToISO(proposal.sentAt),
    acceptedAt: dateToISO(proposal.acceptedAt),
    paidAt: dateToISO(proposal.paidAt),
    convertedAt: dateToISO(proposal.convertedAt),
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
    createdById: proposal.createdById,
    designSnapshot: proposal.designSnapshot ?? null,
    totalAmount: proposal._sum
      ? decimalToNumber(proposal._sum.total)
      : (proposal.items ?? []).reduce((acc, it) => acc + decimalToNumber(it.total), 0),
    items: (proposal.items ?? []).map((it) => ({
      id: it.id,
      productId: it.productId,
      productSku: it.productSku,
      productName: it.productName,
      productUnit: it.productUnit,
      quantity: decimalToNumber(it.quantity, 3),
      price: decimalToNumber(it.price),
      discountPercent: it.discountPercent ? decimalToNumber(it.discountPercent) : null,
      total: decimalToNumber(it.total),
      sortOrder: it.sortOrder,
      notes: it.notes,
    })),
  };
}

/** Сериализовать список Counter (BigInt value → string) — для админских эндпоинтов если потребуется. */
export function serializeCounter(counter: { id: string; year: number | null; value: bigint }) {
  return {
    id: counter.id,
    year: counter.year,
    value: bigIntToString(counter.value),
  };
}
