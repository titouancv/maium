import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  title: string;
  subtitle: string;
  href: string;
  /** Renders the primary (gradient) treatment instead of the subtle one. */
  primary?: boolean;
}

export const ActionCard = ({
  title,
  subtitle,
  href,
  primary,
}: ActionCardProps) => {
  return (
    <Link href={href} className="shrink-0">
      <div
        className={cn(
          "flex h-full min-w-44 flex-col justify-center rounded-2xl px-5 py-4 transition-colors",
          primary
            ? "bg-primary text-on-primary"
            : "bg-surface-100 border-brd-200 hover:bg-surface-200 border",
        )}
      >
        <p className="font-semibold">{title}</p>
        <p
          className={cn(
            "mt-1 text-xs",
            primary ? "text-on-primary/80" : "text-txt-muted",
          )}
        >
          {subtitle}
        </p>
      </div>
    </Link>
  );
};
