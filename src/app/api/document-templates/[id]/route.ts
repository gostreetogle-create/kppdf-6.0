import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth, requireEditor } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { UpdateDocumentTemplateSchema } from '@/lib/validations/document-template';
import { validateBody } from '@/lib/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;
    const item = await prisma.documentTemplate.findUnique({
      where: { id },
      include: { docType: true, blocks: { orderBy: { order: 'asc' } } },
    });

    if (!item) return apiError('Не найдено', 404);
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireEditor();
    const { id } = await params;
    const body = await request.json();
    const validation = validateBody(body, UpdateDocumentTemplateSchema);
    if (!validation.success) return validation.error;
    const { name, description, docTypeId, pageSize, backgroundImage, backgroundOpacity, isDefault, organizationId, blocks } = validation.data;

    await prisma.documentTemplate.update({
      where: { id },
      data: {
        name: name?.trim(),
        description: description || null,
        docTypeId: docTypeId || null,
        pageSize: pageSize || 'A4',
        backgroundImage: backgroundImage || null,
        backgroundOpacity: typeof backgroundOpacity === 'number' ? backgroundOpacity : 1,
        isDefault: !!isDefault,
        organizationId: organizationId || null,
      },
    });

    if (blocks) {
      // PUT replaces all blocks atomically: deleteMany + createMany from flat array.
      // Schema (UpdateDocumentTemplateSchema) validates blocks as z.array(TemplateBlockSchema);
      // the previous z.any() loophole is closed (cycle 37 fix).
      await prisma.templateBlock.deleteMany({ where: { templateId: id } });
      await prisma.templateBlock.createMany({
        data: blocks.map((b, i: number) => ({
          templateId: id,
          type: b.type,
          order: i,
          title: b.title ?? null,
          content: b.content ?? null,
          height: b.height ?? null,
          showLine: b.showLine ?? false,
          settings: b.settings ? JSON.stringify(b.settings) : null,
        })),
      });
    }

    const updated = await prisma.documentTemplate.findUnique({
      where: { id },
      include: { docType: true, blocks: { orderBy: { order: 'asc' } } },
    });

    return apiOk(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireEditor();
    const { id } = await params;
    await prisma.documentTemplate.delete({ where: { id } });
    return apiOk({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
