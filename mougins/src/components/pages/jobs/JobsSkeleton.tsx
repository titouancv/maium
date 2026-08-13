import { Skeleton } from "@/components/ui/Skeleton";

export function AnalysisDetailSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Skeleton className="h-8 w-72 max-w-full" />
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full rounded-2xl" />
        </div>
        <div className="flex flex-col gap-6 md:col-span-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AnalysisHistorySkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-6 w-32" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
