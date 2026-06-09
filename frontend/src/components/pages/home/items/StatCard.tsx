import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { NumberRoller } from "@/components/ui";

interface StatCardProps {
  value: number;
  label: string;
  href?: string;
  /** Absolute net change over a period (e.g. last 7 days), e.g. +1 / -2. `null` hides it. */
  trend?: number | null;
  /** Accessible/hover description of what the trend compares against. */
  trendTitle?: string;
  isValueHighlighted?: boolean; // New prop to conditionally apply highlight styles
}

export const StatCard = ({
  value,
  label,
  href,
  trend,
  trendTitle,
  isValueHighlighted = false,
}: StatCardProps) => {
  const content = (
    <div
      className={cn(
        "flex min-w-44 flex-col items-start justify-start transition-colors",
        href && "hover:text-primary",
      )}
    >
      <div className="flex items-center gap-2">
        <div className="my-1 w-1 self-stretch rounded-full bg-current"></div>
        <div className="flex flex-col items-start justify-end">
          <div className="flex items-center gap-2">
            <NumberRoller
              value={value}
              className={cn(
                "text-4xl leading-none font-extrabold",
                isValueHighlighted && "text-primary",
              )}
            />
            {typeof trend === "number" && trend !== 0 && (
              <NumberRoller
                value={Math.abs(trend)}
                prefix={trend > 0 ? "+" : "-"}
                title={trendTitle}
                className={cn(
                  "text-sm font-extrabold",
                  trend > 0 ? "text-primary" : "text-txt-muted",
                )}
              />
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
