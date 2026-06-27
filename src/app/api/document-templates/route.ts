import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { CreateDocumentTemplateSchema } from '@/lib/validations/document-template';
import { validateBody } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {await requireRole(["admin","manager"]);
    const { page, limit } = parseSearchParams(new URL(request.url).searchParams);
    const docTypeId = new URL(request.url).searchParams.get('docTypeId');

    const where: Record<string, unknown> = {};
    if (docTypeId) where.docTypeId = docTypeId;

    const [items, total] = await Promise.all([
      prisma.documentTemplate.findMany({
        where,
        include: { docType: true, blocks: { orderBy: { order: 'asc' } } },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.documentTemplate.count({ where }),
    ]);

    return apiPaginated(items, total, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

export async function POST(request: NextRequest) {
  try {await requireRole(["admin","manager"]);
    const body = await request.json();
    const validation = validateBody(body, CreateDocumentTemplateSchema);
    if (!validation.success) return validation.error;
    const { name, description, docTypeId, pageSize, backgroundImage, backgroundOpacity, isDefault, organizationId, blocks } = validation.data;

    const template = await prisma.documentTemplate.create({
      data: {
        name: name.trim(),
        description: description || null,
        docTypeId: docTypeId || null,
        pageSize: pageSize || 'A4',
        backgroundImage: backgroundImage || null,
        backgroundOpacity: typeof backgroundOpacity === 'number' ? backgroundOpacity : 1,
        isDefault: !!isDefault,
        organizationId: organizationId || null,
        blocks: blocks ? {
          create: blocks.map(
            (b: { type?: string; title?: string; content?: string; height?: number; showLine?: boolean; settings?: unknown }, i: number) => ({
              type: String(b.type || 'text'),
              order: i,
              title: b.title ? String(b.title) : null,
              content: b.content ? String(b.content) : null,
              height: typeof b.height === 'number' ? b.height : null,
              showLine: !!b.showLine,
              settings: b.settings ? JSON.stringify(b.settings) : null,
            })
          ),
        } : undefined,
      },
      include: { docType: true, blocks: { orderBy: { order: 'asc' } } },
    });

    return apiOk(template);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
