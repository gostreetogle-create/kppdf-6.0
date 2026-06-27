import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Stack } from '@/components/ui/layout';

export function GanttSkeleton() {
  return (
    <Stack gap="lg" className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton shape="text-lg" className="w-48" />
        <div className="flex gap-2">
          <Skeleton shape="circle" className="h-9 w-9" />
          <Skeleton shape="circle" className="h-9 w-9" />
        </div>
      </div>

      {/* Tabs / Controls */}
      <div className="flex gap-2">
        <Skeleton shape="text-sm" className="w-20 h-8 rounded-md" />
        <Skeleton shape="text-sm" className="w-24 h-8 rounded-md" />
        <Skeleton shape="text-sm" className="w-16 h-8 rounded-md" />
      </div>

      {/* Gantt grid simulation */}
      <Card className="p-4 overflow-hidden">
        <div className="space-y-3">
          {/* Column headers */}
          <div className="flex gap-2 border-b border-border pb-2">
            <Skeleton shape="text-sm" className="w-32 h-4" />
            <Skeleton shape="text-sm" className="w-24 h-4" />
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} shape="text-sm" className="flex-1 h-4" />
            ))}
          </div>

          {/* Gantt rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 py-2 border-b border-border/50">
              <Skeleton shape="text-sm" className="w-32 h-3" />
              <Skeleton shape="text-sm" className="w-24 h-3" />
              <div className="flex-1 flex gap-1">
                <Skeleton shape="text-sm" className="h-6 flex-1 rounded-sm opacity-60" style={{ maxWidth: `${60 + ((i * 13) % 30)}%` }} />
              </div>
              <Skeleton shape="text-sm" className="w-16 h-3" />
            </div>
          ))}
        </div>
      </Card>
    </Stack>
  );
}
