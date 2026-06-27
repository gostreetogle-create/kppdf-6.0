import { NextResponse } from 'next/server';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function apiOk<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data, message });
}

export function apiError(message: string, status = 400): NextResponse<ApiResponse<null>> {
  return NextResponse.json({ success: false, data: null, message }, { status });
}

export function apiPaginated<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): NextResponse<ApiResponse<PaginatedData<T>>> {
  return NextResponse.json({
    success: true,
    data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}

export function parseSearchParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || '-createdAt';
  const sortOrder = sort.startsWith('-') ? 'desc' : 'asc';
  const sortField = sort.replace(/^-/, '');

  return { page, limit, search, sortField, sortOrder };
}
