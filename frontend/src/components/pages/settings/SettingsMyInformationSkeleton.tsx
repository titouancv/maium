import { Skeleton } from "@/components/ui/Skeleton";

const MenuListSkeleton = ({ rows }: { rows: number }) => (
  <div className="flex flex-col">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center justify-between py-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    ))}
  </div>
);

/** My-information menu placeholder (the page frame renders around it). */
export const SettingsMyInformationSkeleton = () => (
  <div className="flex w-full max-w-2xl flex-col gap-12">
    <MenuListSkeleton rows={7} />
    <MenuListSkeleton rows={3} />
    <MenuListSkeleton rows={4} />
  </div>
);
