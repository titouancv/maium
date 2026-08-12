import { Skeleton } from "@/components/ui";
import { HOME_RECENT_ANALYSES_LIMIT } from "@/constants";

export const RecentAnalysesListSkeleton = () => {
  return (
    <div className="flex gap-6 overflow-hidden">
      {Array.from({ length: HOME_RECENT_ANALYSES_LIMIT }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-56 shrink-0 rounded-2xl sm:w-64" />
      ))}
    </div>
  );
};
