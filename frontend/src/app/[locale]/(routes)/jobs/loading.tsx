import { Skeleton } from "@/components/ui/Skeleton";
import { AnalysisHistorySkeleton } from "@/components/pages/jobs";

// Route-level shell painted instantly on prefetch/navigation, mirroring the
// page layout while the server component and its data stream in.
export default function JobsLoading() {
  return (
    <div className="relative flex h-dvh flex-col md:h-screen md:items-center">
      <div className="flex h-full w-full flex-col gap-6 md:h-screen md:gap-8">
        <div className="flex shrink-0 justify-center px-4">
          <div className="flex w-full max-w-7xl items-center justify-between pt-6 md:pt-12">
            <Skeleton className="h-8 w-40" />
          </div>
        </div>
        <div className="flex min-h-0 w-full flex-1 flex-col items-center overflow-y-auto px-4">
          <div className="flex w-full max-w-2xl flex-col gap-8">
            <Skeleton className="h-12 w-full rounded-xl" />
            <AnalysisHistorySkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
