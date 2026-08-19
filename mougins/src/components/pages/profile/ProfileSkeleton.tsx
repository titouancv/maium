import { Skeleton } from "@/components/ui/Skeleton";

const SectionSkeleton = ({ rows = 2 }: { rows?: number }) => (
  <div className="flex flex-col gap-3">
    <Skeleton className="h-4 w-32" />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
);

export const ProfileHeaderSkeleton = () => <Skeleton className="h-9 w-56" />;

export const ProfileFollowSkeleton = () => (
  <div className="flex flex-col gap-4">
    <div className="flex gap-3">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-5 w-20" />
    </div>
    <div className="flex flex-col gap-2">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  </div>
);

export const ProfileBodySkeleton = () => (
  <div className="flex h-full w-full max-w-7xl flex-col gap-8 pt-0 md:flex-row">
    <aside className="flex flex-col gap-8 md:w-1/5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <ProfileFollowSkeleton />
      </div>
    </aside>

    <main className="flex flex-1 flex-col gap-6">
      <Skeleton className="h-9 w-64 rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <SectionSkeleton rows={2} />
      <SectionSkeleton rows={1} />
    </main>
  </div>
);
