import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withEditor } from '@/lib/api-wrapper';
import { apiOk, apiError } from '@/lib/api-response';
import { validateBody } from '@/lib/validations';
import { ImportCadSchema, type CadProductInput } from '@/lib/validations/cad-import';

// ========================================
// POST /api/import/cad
//
// Массовый импорт товаров с модулями из CAD-систем
// (Inventor / AutoCAD / SolidWorks / Kompas-3D и т.п.).
//
// RBAC: requireEditor (admin, manager, production, storekeeper, accountant).
//
// Формат запроса описан в src/lib/validations/cad-import.ts.
// Краткая спецификация:
//
//   {
//     "products": [
//       {
//         "sku": "ART-001",           // уникальный ключ upsert
//         "name": "Стол письменный",
//         // ... другие поля Product (опционально)
//         "modules": [
//           {
//             "name": "Столешница",
//             "article": "MOD-001",
//             "materials": [{ "name", "quantity", "unit", "isPurchased" }],
//             "workTypes": [{ "workTypeId" (cuid), "estimatedHours" }]
//           }
//         ]
//       }
//     ]
//   }
//
// Поведение:
//   - Upsert Product по sku (создать новый или обновить существующий)
//   - Модули: полная замена (deleteMany + create) — гарантирует идемпотентность
//   - Per-product interactive transaction — частичный успех, отчёт по каждому SKU
//   - WorkType валидируются заранее: неверный workTypeId → 422 для этого товара,
//     остальные товары продолжают импортироваться
//
// Коды ответов:
//   - 200: Импорт завершён (включая частичный успех), см. data.results для деталей
//   - 400: Невалидный JSON / ошибка Zod-валидации
//   - 401/403: Проблемы авторизации (обрабатываются withEditor)
//   - 500: Непредвиденная ошибка (обрабатывается withEditor)
// ========================================

type ResultEntry =
  | { sku: string; status: 'success'; action: 'created' | 'updated'; id: string; modulesCount: number }
  | { sku: string; status: 'error'; message: string };

export const POST = withEditor(async (req: NextRequest, _ctx, _user) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Тело запроса не является валидным JSON', 400);
  }

  const validation = validateBody(body, ImportCadSchema);
  if (!validation.success) return validation.error;

  const products = validation.data.products;

  // Дедупликация по SKU: при двух одинаковых SKU в одном запросе оставляем последний
  const uniqueProducts: CadProductInput[] = [];
  const seenSkus = new Set<string>();
  for (const p of products) {
    if (seenSkus.has(p.sku)) continue;
    seenSkus.add(p.sku);
    uniqueProducts.push(p);
  }

  // Предварительная загрузка валидных WorkType ID — для быстрой валидации
  const workTypes = await prisma.workType.findMany({ select: { id: true } });
  const validWorkTypeIds = new Set(workTypes.map((w) => w.id));

  const results: ResultEntry[] = [];

  for (const productInput of uniqueProducts) {
    // Pre-validation WorkType IDs (до транзакции — быстрый отказ без DB-нагрузки)
    const invalidWorkTypeIds = new Set<string>();
    let hasInvalid = false;
    for (const m of productInput.modules) {
      for (const wt of m.workTypes) {
        if (!validWorkTypeIds.has(wt.workTypeId)) {
          invalidWorkTypeIds.add(wt.workTypeId);
          hasInvalid = true;
        }
      }
    }
    if (hasInvalid) {
      results.push({
        sku: productInput.sku,
        status: 'error',
        message: `Неизвестные workTypeId: ${Array.from(invalidWorkTypeIds).join(', ')}`,
      });
      continue;
    }

    try {
      const outcome = await prisma.$transaction(async (tx) => {
        // Upsert Product по sku
        const existing = await tx.product.findUnique({
          where: { sku: productInput.sku },
          select: { id: true },
        });

        // Подготовка полей Product (без модулей)
        const {
          modules: _modulesInput,
          ...productFields
        } = productInput;

        const product = existing
          ? await tx.product.update({
              where: { id: existing.id },
              data: productFields,
              select: { id: true },
            })
          : await tx.product.create({
              data: { ...productFields, sku: productInput.sku },
              select: { id: true },
            });

        const action: 'created' | 'updated' = existing ? 'updated' : 'created';

        // Полная замена модулей: удалить существующие, создать новые
        await tx.productModule.deleteMany({ where: { productId: product.id } });

        for (const moduleInput of productInput.modules) {
          const { materials: mats, workTypes: wts, ...moduleRest } = moduleInput;
          await tx.productModule.create({
            data: {
              ...moduleRest,
              productId: product.id,
              materials: mats.length ? { create: mats } : undefined,
              workTypes: wts.length
                ? {
                    create: wts.map((wt) => ({
                      workTypeId: wt.workTypeId,
                      estimatedHours: wt.estimatedHours,
                      sortOrder: wt.sortOrder ?? 0,
                    })),
                  }
                : undefined,
            },
          });
        }

        return {
          id: product.id,
          action,
          modulesCount: productInput.modules.length,
        };
      });

      results.push({
        sku: productInput.sku,
        status: 'success',
        id: outcome.id,
        action: outcome.action,
        modulesCount: outcome.modulesCount,
      });
    } catch (err) {
      results.push({
        sku: productInput.sku,
        status: 'error',
        message: err instanceof Error ? err.message : 'Неизвестная ошибка транзакции',
      });
    }
  }

  const successCount = results.filter((r) => r.status === 'success').length;
  const errorCount = results.length - successCount;

  return apiOk({
    summary: {
      total: results.length,
      received: products.length,
      deduped: products.length - uniqueProducts.length,
      success: successCount,
      failed: errorCount,
    },
    results,
  });
});
