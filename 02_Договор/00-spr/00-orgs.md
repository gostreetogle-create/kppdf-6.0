# 02_Договор/00-spr/00-orgs.md — Организации-стороны Договора

> ⚠️ **STUB.** Создан декомпозицией (см. [MODULE-DECOMPOSITION-PLAN.md §2](../../99_Справочники/MODULE-DECOMPOSITION-PLAN.md)). Наполнение — Аналитик Run 2 (ТЗ-007).

## Назначение

Документирует **две стороны Договора**: наша организация-продавец (`Contract.contractorId`) и клиент-покупатель (`Contract.customerId`). Это **hard-link** к КП-источнику через `parentProposalId` — данные дублируются через join, не через копирование.

## Стороны Договора

### 1. Продавец (наша организация) — `Contract.contractorId`

| Поле | Источник | Snapshot? |
|---|---|---|
| `id` | `Organization.id` | нет (FK) |
| `name` (краткое) | `Organization.shortName` | **да** (snapshot при подписании) |
| `nameFull` | `Organization.fullName` | **да** |
| `inn` | `Organization.inn` | **да** |
| `kpp` | `Organization.kpp` | **да** |
| `ogrn` | `Organization.ogrn` | **да** |
| `legalAddress` | `Organization.legalAddress` | **да** |
| `actualAddress` | `Organization.actualAddress` | **да** |
| `bankName` | `Organization.bankName` | **да** |
| `bankBik` | `Organization.bankBik` | **да** |
| `bankAccount` | `Organization.bankAccount` | **да** |
| `directorName` | ФИО директора | **да** (ФИО подписанта) |
| `directorPosition` | должность | **да** |

**Принцип:** все snapshot-поля фиксируются **в момент подписания**. Изменение реквизитов в `Organization` после подписания НЕ влияет на подписанный Договор.

### 2. Покупатель (клиент) — `Contract.customerId`

Аналогичные поля. Источник = КП-источник (`Proposal.customerId`).

**Принцип:** `Contract.customerId == Proposal.customerId` (гарантируется конвертацией КП → Договор).

## Правила для Org-Dоговора

1. **Hard-link на КП:**
   - `Contract.parentProposalId` — **NOT NULL**, RESTRICT ON DELETE.
   - `Contract.customerId` **должен совпадать** с `Proposal.customerId`.
   - `Contract.contractorId` **должен совпадать** с `Proposal.contractorId`.

2. **Нельзя удалить организацию** с активными Договорами:
   - `ON DELETE RESTRICT` для обеих FK (`contractorId`, `customerId`).

3. **Модульная система галочек RBAC** для Договоров (наследуется от КП + расширения):
   - См. [`../04-pravila/04-rbac.md`](../04-pravila/04-rbac.md) (Run 2 наполнение).

## Принципы наполнения (Аналитик Run 2)

1. **Не дублировать** данные из `01_КП/00-spr/00-orgs.md` — только cross-ref + специфичные для Договоров snapshot-поля.
2. **Snapshot-логика** — фиксировать явно: «реквизиты на момент подписания Д-XXXX».
3. **Связь с `99_Справочники/RBAC-MATRIX.md`** — какой Org-полю какой RBAC-action соответствует.

## Связанные документы

- [`../../01_КП/00-spr/00-orgs.md`](../../01_КП/00-spr/00-orgs.md) — базовый справочник организаций КП.
- [`../../99_Справочники/SCHEMA-CONSOLIDATED.md`](../../99_Справочники/SCHEMA-CONSOLIDATED.md) §2 — `Organization` entity definition.
- [`../МОДУЛЬ-ДОГОВОР.md`](../МОДУЛЬ-ДОГОВОР.md) §6.5 + §7 — источник V0.
- [`../04-pravila/04-rbac.md`](../04-pravila/04-rbac.md) — RBAC для Org-операций Договора (Run 2 наполнение).
