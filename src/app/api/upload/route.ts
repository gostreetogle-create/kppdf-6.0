import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { apiError } from '@/lib/api-response';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = 'public/uploads';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'manager']); // P2.3: upload — controlled; production/storekeeper/accountant не должны загружать файлы напрямую (через свои компоненты они могут использовать upload, но explicit prevent здесь просто консолидирует security model)

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return apiError('Файл не выбран', 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError('Недопустимый тип файла. Разрешены: JPEG, PNG, WebP, GIF', 400);
    }

    if (file.size > MAX_SIZE) {
      return apiError('Файл слишком большой. Максимум 10MB', 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop() || 'png';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadsDir = path.join(process.cwd(), UPLOAD_DIR);

    await mkdir(uploadsDir, { recursive: true });
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;

    return NextResponse.json({ success: true, data: { url, filename } });
  } catch (error) {
    console.error('Upload error:', error);
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    // P2.3 fix: requireRole(['admin','manager']) может throw FORBIDDEN (production/storekeeper/accountant/viewer → 403).
    // Без этой строки ошибка упала бы в 500 «Внутренняя ошибка сервера» — плохой UX.
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError('Внутренняя ошибка сервера', 500);
  }
}
