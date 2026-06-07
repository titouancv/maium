import { Skeleton } from "@/components/ui";

const WIDTHS = ["w-28", "w-28", "w-28", "w-44", "w-44"];

export const StatsRowSkeleton = () => {
  return (
    <div className="flex gap-3 overflow-hidden">
      {WIDTHS.map((width, i) => (
        <Skeleton
          key={i}
          className={`h-[4.5rem] shrink-0 rounded-2xl ${width}`}
        />
      ))}
    </div>
  );
};
