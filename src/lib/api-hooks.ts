/**
 * src/lib/api-hooks.ts — Shared TanStack Query hooks for CRUD operations.
 *
 * Centralises all data-fetching patterns so individual pages don't need
 * raw fetch() + useEffect + useState boilerplate.
 *
 * Cycle v3.4.1 — performance optimization.
 * Replaces fetch + useEffect + useState in CrudPage and all client components.
 */

'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
/** Response type for paginated API endpoints. */
interface ApiPaginatedResponse<T> {
  success: boolean;
  data?: {
    items: T[];
    total: number;
    totalPages: number;
  };
  message?: string;
}

// ============================================================
// LIST HOOK
// ============================================================

interface UseListParams {
  apiPath: string;
  page: number;
  limit: number;
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ListResult<T> {
  items: T[];
  total: number;
  totalPages: number;
}

/**
 * Generic hook for fetching paginated lists.
 *
 * staleTime зависит от эндпоинта:
 *   - Справочники (clients, orgs, categories): 5 минут
 *   - Списки документов (КП, договоры): 30 секунд
 *   - Дашборд: 1 минута
 */
export function useList<T>(
  params: UseListParams,
  staleTime: number = 30 * 1000, // default 30s
  options?: Omit<UseQueryOptions<ListResult<T>>, 'queryKey' | 'queryFn'>,
) {
  const { apiPath, page, limit, search, sortField, sortOrder } = params;

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search) queryParams.set('search', search);
  if (sortField) {
    queryParams.set('sort', `${sortOrder === 'desc' ? '-' : ''}${sortField}`);
  }

  const queryKey = [apiPath, { page, limit, search, sortField, sortOrder }];

  return useQuery<ListResult<T>>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`${apiPath}?${queryParams}`);
      const data: ApiPaginatedResponse<T> = await res.json();
      if (!data.success || !data.data) {
        throw new Error(`API error: ${data.message || 'Unknown error'}`);
      }
      return {
        items: data.data.items,
        total: data.data.total,
        totalPages: data.data.totalPages,
      };
    },
    staleTime,
    retry: 1,
    ...options,
  });
}

// ============================================================
// SINGLE ITEM HOOK
// ============================================================

/**
 * Fetch a single item by ID. staleTime: 1 minute (details don't change often).
 */
export function useItem<T>(
  apiPath: string,
  id: string | undefined | null,
  staleTime: number = 60 * 1000,
) {
  return useQuery<T>({
    queryKey: [apiPath, id],
    queryFn: async () => {
      const res = await fetch(`${apiPath}/${id}`);
      const data = await res.json();
      if (!data.success || !data.data) {
        throw new Error(data.message || 'Failed to fetch item');
      }
      return data.data;
    },
    enabled: !!id,
    staleTime,
  });
}

// ============================================================
// LIST OPTIONS HOOK (for selects, dropdowns — reference data)
// ============================================================

interface OptionItem {
  id: string;
  name: string;
}

/**
 * Fetch reference data for <select> dropdowns.
 * Cached for 5 minutes (staleTime = 5 min), rarely changes.
 */
export function useReferenceList(
  apiPath: string,
  staleTime: number = 5 * 60 * 1000,
) {
  return useQuery<OptionItem[]>({
    queryKey: ['reference', apiPath],
    queryFn: async () => {
      const res = await fetch(`${apiPath}?limit=200`);
      const data = await res.json();
      if (!data.success || !data.data?.items) return [];
      return data.data.items.map((item: Record<string, unknown>) => ({
        id: item.id as string,
        name: (item.name ?? item.title ?? item.id) as string,
      }));
    },
    staleTime,
  });
}

// ============================================================
// MUTATIONS
// ============================================================

/**
 * Create a resource. Invalidates list on success via onSettled.
 * Component can pass onSuccess for UI callbacks (close dialog, etc.).
 */
export function useCreate<TBody>(apiPath: string, options?: UseMutationOptions<unknown, Error, TBody>) {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, TBody>({
    mutationFn: async (body) => {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to create');
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [apiPath] });
    },
    ...options,
  });
}

/**
 * Update a resource by ID. Invalidates list + item on success via onSettled.
 */
export function useUpdate<TBody>(
  apiPath: string,
  options?: UseMutationOptions<unknown, Error, { id: string; body: TBody }>,
) {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { id: string; body: TBody }>({
    mutationFn: async ({ id, body }) => {
      const res = await fetch(`${apiPath}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to update');
      return data;
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: [apiPath] });
      queryClient.invalidateQueries({ queryKey: [apiPath, id] });
    },
    ...options,
  });
}

/**
 * Delete a resource by ID. Invalidates list on success via onSettled.
 */
export function useDelete(apiPath: string, options?: UseMutationOptions<unknown, Error, string>) {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`${apiPath}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to delete');
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [apiPath] });
    },
    ...options,
  });
}
