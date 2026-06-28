import { cn } from "@/lib/utils";
import { NumberRoller } from "@/components/ui";

interface NotificationCardProps {
  count: number;
  label: string;
  onClick: () => void;
}

/**
 * The home dashboard's single "Notifications" card. Shows the unread count and
 * opens the notifications overlay on click. Replaces the old per-metric stat
 * cards (followers / unread / profile views); mirrors their look.
 */
export const NotificationCard = ({
  count,
  label,
  onClick,
}: NotificationCardProps) => {
  const highlighted = count > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="hover:text-primary flex h-full shrink-0 flex-col items-start justify-start text-left transition-colors"
    >
      <div className="flex h-full items-center gap-4">
        <div className="my-1 w-1 self-stretch rounded-full bg-current" />
        <div className="flex items-center justify-end gap-1">
          <NumberRoller
            value={count}
            className={cn(
              "text-2xl leading-none font-extrabold",
              highlighted && "text-primary",
            )}
          />
          <BellIcon
            className={cn(
              "size-5 shrink-0 sm:hidden",
              highlighted && "text-primary",
            )}
          />
          <p className="hidden truncate text-lg sm:block">{label}</p>
        </div>
      </div>
    </button>
  );
};

const BellIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);
