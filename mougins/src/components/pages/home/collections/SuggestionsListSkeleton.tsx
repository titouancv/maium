import { Skeleton } from "@/components/ui";

export const SuggestionsListSkeleton = () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <Skeleton className="h-7 w-40" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-44 shrink-0 rounded-2xl" />
        ))}
      </div>
    </div>
  );
};
