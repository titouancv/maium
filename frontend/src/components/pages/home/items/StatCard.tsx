import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface StatCardProps {
  value: number;
  label: string;
  href?: string;
  /** Highlights the tile (e.g. unread messages waiting). */
  active?: boolean;
}

export const StatCard = ({ value, label, href, active }: StatCardProps) => {
  const content = (
    <div
      className={cn(
        "bg-surface-100 border-brd-200 flex h-full min-w-28 flex-col justify-center rounded-2xl border px-5 py-4 transition-colors",
        href && "hover:bg-surface-200",
      )}
    >
      <p
        className={cn(
          "text-2xl leading-none font-extrabold",
          active ? "text-primary" : "text-txt",
        )}
      >
        {value}
      </p>
      <p className="text-txt-muted mt-1 truncate text-xs">{label}</p>
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="shrink-0">
      {content}
    </Link>
  );
};
