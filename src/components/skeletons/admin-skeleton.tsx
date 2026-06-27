import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Stack } from '@/components/ui/layout';

export function AdminSkeleton() {
  return (
    <Stack gap="lg" className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton shape="text-lg" className="w-48" />
        <div className="flex gap-2">
          <Skeleton shape="text-sm" className="w-24 h-9 rounded-md" />
          <Skeleton shape="text-sm" className="w-28 h-9 rounded-md" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} shape="text-sm" className="h-8 w-24 rounded-t-md" />
        ))}
      </div>

      {/* Content area */}
      <Card className="p-4">
        {/* Search bar */}
        <div className="flex items-center gap-3 mb-6">
          <Skeleton shape="text-sm" className="flex-1 h-9 rounded-md" />
          <Skeleton shape="circle" className="h-9 w-9" />
        </div>

        {/* Table */}
        <div className="space-y-2">
          {/* Table header */}
          <div className="flex gap-4 border-b border-border pb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={`h-${i}`} shape="text-sm" className={`h-4 ${i === 0 ? 'w-12' : i === 1 ? 'w-32' : i === 2 ? 'w-24' : i === 3 ? 'w-20' : 'w-16'}`} />
            ))}
          </div>

          {/* Table rows */}
          {Array.from({ length: 5 }).map((_, rowIdx) => (
            <div key={rowIdx} className="flex gap-4 py-3 border-b border-border/50">
              {Array.from({ length: 5 }).map((_, colIdx) => (
                <Skeleton
                  key={`r${rowIdx}-c${colIdx}`}
                  shape="text-sm"
                  className={`h-3 ${colIdx === 0 ? 'w-12' : colIdx === 1 ? 'w-32' : colIdx === 2 ? 'w-24' : colIdx === 3 ? 'w-20' : 'w-16'}`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <Skeleton shape="text-sm" className="w-32 h-4" />
          <div className="flex gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`p-${i}`} shape="circle" className="h-8 w-8" />
            ))}
          </div>
        </div>
      </Card>
    </Stack>
  );
}
