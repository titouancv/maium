import { Skeleton } from "@/components/ui/Skeleton";

/** User list placeholder (the page frame renders around it). */
export const UserListSkeleton = ({ rows = 6 }: { rows?: number }) => (
  <ul className="flex flex-col">
    {Array.from({ length: rows }).map((_, i) => (
      <li key={i} className="flex flex-col gap-1.5 py-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-28" />
      </li>
    ))}
  </ul>
);
