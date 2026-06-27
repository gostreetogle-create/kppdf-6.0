import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Stack } from '@/components/ui/layout';

export function EditorSkeleton() {
  return (
    <Stack gap="lg" className="p-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton shape="text-lg" className="w-64" />
          <Skeleton shape="text-sm" className="w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton shape="circle" className="h-9 w-9" />
          <Skeleton shape="circle" className="h-9 w-9" />
          <Skeleton shape="text-sm" className="w-28 h-9 rounded-md" />
        </div>
      </div>

      {/* Two-column layout simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — catalog/search */}
        <Card className="p-4 space-y-4">
          <Skeleton shape="text-sm" className="w-full h-10 rounded-md" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2 p-3 border border-border rounded-lg">
                <Skeleton shape="text-sm" className="w-3/4 h-3" />
                <Skeleton shape="text-sm" className="w-1/2 h-3" />
                <Skeleton shape="text-sm" className="w-full h-8 rounded-md" />
              </div>
            ))}
          </div>
        </Card>

        {/* Right column — live preview / editor */}
        <Card className="p-4 space-y-4">
          {/* A4 page simulation */}
          <div className="bg-white dark:bg-gray-900 shadow-sm rounded-lg p-8 space-y-3 max-w-[595px] mx-auto min-h-[500px]">
            <Skeleton shape="text-lg" className="w-3/4 h-5 mx-auto" />
            <Skeleton shape="text-sm" className="w-1/2 h-4 mx-auto" />
            <div className="border-t border-gray-200 dark:border-gray-700 my-4" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton shape="text-sm" className="w-full h-3" />
                <Skeleton shape="text-sm" className="w-5/6 h-3" />
              </div>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-700 my-4" />
            <Skeleton shape="text-sm" className="w-1/3 h-4" />
            <Skeleton shape="text-sm" className="w-1/4 h-3" />
          </div>
        </Card>
      </div>
    </Stack>
  );
}
