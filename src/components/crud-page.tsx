'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, ChevronLeft, ChevronRight, Pencil, Trash2, Eye, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Typography } from '@/components/ui/typography';
import { Flex } from '@/components/ui/layout';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useList, useDelete } from '@/lib/api-hooks';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface CrudPageProps<T> {
  title: string;
  apiPath: string;
  columns: Column<T>[];
  initialData?: T[];
  initialTotal?: number;
  createHref?: string;
  detailHref?: (item: T) => string;
  renderForm?: (item: T | null, onClose: () => void) => ReactNode;
  extraActions?: (item: T) => ReactNode;
  searchId?: string;
  /** Специфический staleTime для этого списка (ms). Default: 30000 (30s). */
  staleTime?: number;
}

export function CrudPage<T extends Record<string, unknown>>({
  title,
  apiPath,
  columns,
  initialData,
  initialTotal,
  createHref,
  detailHref,
  renderForm,
  extraActions,
  searchId,
  staleTime,
}: CrudPageProps<T>) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<T | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // TanStack Query: замена useEffect + fetch
  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useList<T>(
    { apiPath, page, limit, search, sortField, sortOrder },
    staleTime,
  );

  const items = data?.items ?? initialData ?? [];
  const total = data?.total ?? initialTotal ?? 0;
  const totalPages = data?.totalPages ?? (initialTotal ? Math.ceil(initialTotal / 20) : 0);
  const loading = isLoading && !initialData;

  // Мутация удаления — onSuccess передаётся через mutate, не через useDelete
  // (чтобы не перезатереть onSettled из api-hooks, который инвалидирует кеш)
  const deleteMutation = useDelete(apiPath);

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => setDeleteConfirm(null),
    });
  };

  const handleSort = (key: string) => {
    if (sortField === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Flex direction="col" className="sm:flex-row sm:items-center sm:justify-between" gap="md">
        <Typography variant="h2">{title}</Typography>
        <Flex gap="sm">
          <Button variant="ghost" size="icon" onClick={() => refetch()} title="Обновить" disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          {createHref && (
            <Button onClick={() => router.push(createHref)}>
              <Plus className="h-4 w-4" />
              Создать
            </Button>
          )}
          {renderForm && !createHref && (
            <Button onClick={() => { setEditItem(null); setShowForm(true); }}>
              <Plus className="h-4 w-4" />
              Создать
            </Button>
          )}
        </Flex>
      </Flex>

      {/* Search */}
      <div className="max-w-md">
        <Input
          id={searchId}
          prefix={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Поиск..."
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted transition-colors',
                      col.className,
                    )}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sortField === col.key && (
                        <span className="text-primary">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-muted-foreground">
                    <Flex justify="center" gap="sm">
                      <Spinner size="sm" />
                      Загрузка...
                    </Flex>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-muted-foreground">
                    Ничего не найдено
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={(item.id as string) || idx} className="hover:bg-muted/50 transition-colors">
                    {columns.map((col) => (
                      <td key={col.key} className={cn('px-4 py-3', col.className)}>
                        {col.render
                          ? col.render(item)
                          : String(item[col.key] ?? '—')}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {extraActions?.(item)}
                        {detailHref && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => router.push(detailHref(item))}
                            title="Просмотр"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {renderForm && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => { setEditItem(item); setShowForm(true); }}
                            title="Редактировать"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteConfirm(item.id as string)}
                          title="Удалить"
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {total} записей, стр. {page} из {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'px-3 py-1 rounded text-sm transition-colors',
                      p === page
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted',
                    )}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inline Form Dialog */}
      {showForm && renderForm && (
        <div className="fixed inset-0 z-[--z-modal] flex items-center justify-center glass-overlay">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto mx-4">
            <div className="p-6">
              {renderForm(editItem, () => { setShowForm(false); setEditItem(null); })}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Удалить запись?"
        message="Это действие нельзя отменить."
        confirmLabel="Удалить"
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => handleDelete(deleteConfirm!)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
