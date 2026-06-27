/**
 * src/lib/number-protection.ts (Cycle 55 / B.4 — protect document numbers)
 *
 * Helper `assertNumberImmutable` enforced для per-entity frozen-statuses.
 * Если документ в frozen-статусе (см. `frozenStatuses`), изменение `number`
 * запрещено → throws `NumberLockedError` с кодом 'NUMBER_LOCKED'.
 *
 * Используется в PATCH/PUT endpoint каждого из 5 entity types:
 *   - proposal / contract / productionOrder / supplierOrder / incomingInvoice
 *
 * Поведение:
 *   - Если entity type не в frozenStatuses → pass-through (allow).
 *   - Если newNumber === currentNumber → pass-through (allow).
 *   - Если newNumber undefined → pass-through (pass без number).
 *   - Иначе → check frozen list: если currentStatus ∈ frozen → throw.
 *
 * Tier classification: candidate для Tier C (Cycles 48-49 test coverage).
 */

import { frozenStatuses, type ProtectedEntity } from '@/lib/constants/frozen-statuses';

export class NumberLockedError extends Error {
  public readonly code = 'NUMBER_LOCKED';
  constructor(message: string) {
    super(message);
    this.name = 'NumberLockedError';
  }
}

/**
 * Assert that `newNumber` is immutable for the given `entity` in `currentStatus`.
 *
 * Returns silently if change is allowed; throws NumberLockedError if blocked.
 */
export function assertNumberImmutable(
  entity: ProtectedEntity,
  currentStatus: string,
  newNumber: string | undefined,
  currentNumber: string,
): void {
  // Cast to readonly string[]: `as const satisfies` infers literal-union for
  // each per-entity array; TypeScript widens to `readonly string[]` after the
  // index access, allowing `.includes(string)` without TS2345 'never' errors.
  const frozen = frozenStatuses[entity] as readonly string[] | undefined;
  if (!frozen) return; // entity not in config — no protection

  if (newNumber === undefined) return; // number not in body
  if (newNumber === currentNumber) return; // same number — no change
  if (!frozen.includes(currentStatus)) return; // status not frozen — allow

  throw new NumberLockedError(
    `Номер документа нельзя изменить в статусе «${currentStatus}» (заморожено для ${entity}).`,
  );
}
