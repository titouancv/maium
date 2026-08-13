import { Skeleton } from "@/components/ui/Skeleton";

export const ConversationListSkeleton = ({ rows = 6 }: { rows?: number }) => (
  <div className="flex flex-col gap-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex flex-col gap-1.5 py-3">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-3 w-56" />
      </div>
    ))}
  </div>
);
