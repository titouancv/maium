import { Skeleton } from "@/components/ui/Skeleton";

const BUBBLES = [
  { align: "start", width: "w-40" },
  { align: "end", width: "w-52" },
  { align: "start", width: "w-32" },
  { align: "end", width: "w-44" },
  { align: "start", width: "w-56" },
] as const;

/** Message thread placeholder (the page frame renders around it). */
export const MessagesSkeleton = () => (
  <div className="flex h-full w-full flex-col justify-end gap-3 pb-4">
    {BUBBLES.map((bubble, i) => (
      <div
        key={i}
        className={`flex ${bubble.align === "end" ? "justify-end" : "justify-start"}`}
      >
        <Skeleton className={`h-10 ${bubble.width} rounded-2xl`} />
      </div>
    ))}
  </div>
);
