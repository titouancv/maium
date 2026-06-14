import { Skeleton } from "@/components/ui";

export const StoriesRowSkeleton = () => {
  return (
    <div className="-mx-4 flex gap-3 overflow-hidden px-4">
      {Array.from({ length: 7 }, (_, i) => (
        <Skeleton key={i} className="h-72 w-40 shrink-0 rounded-2xl" />
      ))}
    </div>
  );
};
