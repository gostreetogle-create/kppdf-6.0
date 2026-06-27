import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {await requireRole(["admin","manager"]);
    const { id } = await params;

    const original = await prisma.documentTemplate.findUnique({
      where: { id },
      include: { blocks: { orderBy: { order: 'asc' } } },
    });

    if (!original) return apiError('Шаблон не найден', 404);

    const cloned = await prisma.documentTemplate.create({
      data: {
        name: `${original.name} (копия)`,
        description: original.description,
        docTypeId: original.docTypeId,
        pageSize: original.pageSize,
        backgroundImage: original.backgroundImage,
        backgroundOpacity: original.backgroundOpacity,
        isDefault: false,
        organizationId: original.organizationId,
        blocks: {
          create: original.blocks.map((b) => ({
            type: b.type,
            order: b.order,
            title: b.title,
            content: b.content,
            height: b.height,
            showLine: b.showLine,
            settings: b.settings,
          })),
        },
      },
      include: { docType: true, blocks: { orderBy: { order: 'asc' } } },
    });

    return apiOk(cloned);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
