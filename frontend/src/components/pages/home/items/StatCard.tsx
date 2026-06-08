import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface StatCardProps {
  value: number;
  label: string;
  href?: string;
  /** Absolute net change over a period (e.g. last 7 days), e.g. +1 / -2. `null` hides it. */
  trend?: number | null;
  /** Accessible/hover description of what the trend compares against. */
  trendTitle?: string;
}

export const StatCard = ({
  value,
  label,
  href,
  trend,
  trendTitle,
}: StatCardProps) => {
  const content = (
    <div
      className={cn(
        "flex h-full min-w-44 flex-col items-start justify-start transition-colors",
        href && "hover:text-primary",
      )}
    >
      <div className="flex items-center gap-2">
        <div className="my-1 w-1 self-stretch rounded-full bg-current"></div>
        <div className="flex flex-col items-start justify-end">
          <div className="flex items-baseline gap-2">
            <p className="text-4xl leading-none font-extrabold">{value}</p>
            {typeof trend === "number" && (
              <span
                title={trendTitle}
                className={cn(
                  "inline-flex items-center gap-0.5 text-sm font-extrabold",
                  trend <= 0 && "text-txt-muted",
                  trend > 0 && "text-primary",
                )}
              >
                {trend !== 0 && <>{trend > 0 ? `+${trend}` : `${trend}`}</>}
              </span>
            )}
          </div>
          <p className="truncate">{label}</p>
        </div>
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="shrink-0">
      {content}
    </Link>
  );
};
