import { z } from 'zod';

// ========================================
// CAD IMPORT — Zod-схемы для импорта из CAD-систем
//
// Формат JSON:
// {
//   "products": [
//     {
//       "sku": "ART-001",
//       "name": "Стол письменный",
//       "description": "...",          // опционально
//       "productType": "manufactured", // purchased | manufactured (опционально)
//       "basePrice": 0,                // опционально (default 0)
//       "defaultMarkupPercent": 0,     // опционально
//       "unit": "шт",                  // опционально (default "шт")
//       "weightKg": 12.5,              // опционально
//       "dimensions": "1200x600x750",  // опционально
//       "material": "...",
//       "hasPassport": false,          // опционально
//       "hasDrawing": false,           // опционально
//       "ralCode": "RAL-9016",         // опционально
//       "categoryId": "cuid...",
//       "modules": [
//         {
//           "name": "Столешница",
//           "article": "MOD-001",          // опционально
//           "width": 1200, "height": 25, "depth": 600, "weight": 8,
//           "image": "/uploads/...",
//           "sortOrder": 0,
//           "materials": [
//             { "name": "ДСП", "quantity": 1, "unit": "лист", "isPurchased": true }
//           ],
//           "workTypes": [
//             { "workTypeId": "cuid...", "estimatedHours": 1.5, "sortOrder": 0 }
//           ]
//         }
//       ]
//     }
//   ]
// }
// ========================================

export const CadMaterialSchema = z.object({
  name: z.string().min(1, 'Название материала обязательно').max(200),
  quantity: z.number().min(0).default(1),
  unit: z.string().min(1).max(20).default('шт'),
  isPurchased: z.boolean().default(true),
}).strict();

export const CadWorkTypeSchema = z.object({
  workTypeId: z.string().cuid('Некорректный workTypeId'),
  estimatedHours: z.number().min(0, 'Часы не могут быть отрицательными'),
  sortOrder: z.number().int().min(0).default(0),
}).strict();

export const CadModuleSchema = z.object({
  name: z.string().min(1, 'Название модуля обязательно').max(200),
  article: z.string().max(100).nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  depth: z.number().nullable().optional(),
  weight: z.number().nullable().optional(),
  image: z.string().url().or(z.string().startsWith('/')).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  materials: z.array(CadMaterialSchema).max(100).default([]),
  workTypes: z.array(CadWorkTypeSchema).max(50).default([]),
}).strict();

export const CadProductSchema = z.object({
  sku: z.string().min(1, 'SKU обязателен').max(100, 'SKU слишком длинный'),
  name: z.string().min(1, 'Название обязательно').max(500),
  description: z.string().max(2000).optional(),
  productType: z.enum(['purchased', 'manufactured']).default('manufactured'),
  basePrice: z.number().min(0).default(0),
  defaultMarkupPercent: z.number().min(0).max(1000).default(0),
  unit: z.string().min(1).max(20).default('шт'),
  weightKg: z.number().min(0).nullable().optional(),
  dimensions: z.string().max(200).nullable().optional(),
  material: z.string().max(500).nullable().optional(),
  hasPassport: z.boolean().default(false),
  hasDrawing: z.boolean().default(false),
  ralCode: z.string().max(50).nullable().optional(),
  categoryId: z.string().cuid().nullable().optional(),
  isActive: z.boolean().default(true),
  modules: z.array(CadModuleSchema).max(100, 'Слишком много модулей в товаре').default([]),
}).strict();

export const ImportCadSchema = z.object({
  products: z.array(CadProductSchema).min(1, 'Массив products не может быть пустым').max(50, 'Максимум 50 товаров за один запрос'),
});

export type ImportCadInput = z.infer<typeof ImportCadSchema>;
export type CadProductInput = z.infer<typeof CadProductSchema>;
export type CadModuleInput = z.infer<typeof CadModuleSchema>;
