import { Skeleton } from "@/components/ui/Skeleton";

export function AnalysisHeadingSkeleton() {
  return <Skeleton className="h-8 w-96 max-w-full" />;
}

export function AnalysisDetailSkeleton() {
  return (
    <div className="flex w-full flex-col gap-8">
      <Skeleton className="h-9 w-full max-w-md rounded-full" />
      <div className="flex w-full gap-12">
        <Skeleton className="hidden h-44 w-36 shrink-0 rounded-2xl md:block" />
        <div className="flex w-full max-w-2xl min-w-0 flex-1 flex-col gap-8">
          <div className="flex w-full flex-col gap-6 md:flex-row md:gap-12">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-12 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-full rounded-2xl sm:w-64" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompanyContactsSkeleton() {
  return (
    <div className="flex w-full flex-col gap-6">
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-1 gap-x-12 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="my-3 h-10 w-full" />
        ))}
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
