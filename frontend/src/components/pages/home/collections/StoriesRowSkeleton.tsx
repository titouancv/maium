import { Skeleton } from "@/components/ui";

export const StoriesRowSkeleton = () => {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="flex w-16 shrink-0 flex-col items-center gap-1">
          <Skeleton className="aspect-[5/7] w-[56px] rounded-md" />
          <Skeleton className="h-2 w-10 rounded-full" />
        </div>
      ))}
    </div>
  );
};
