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
      className="hover:text-primary flex min-w-44 shrink-0 flex-col items-start justify-start text-left transition-colors"
    >
      <div className="flex items-center gap-2">
        <div className="my-1 w-1 self-stretch rounded-full bg-current" />
        <div className="flex flex-col items-start justify-end">
          <NumberRoller
            value={count}
            className={cn(
              "text-4xl leading-none font-extrabold",
              highlighted && "text-primary",
            )}
          />
          <p className="truncate">{label}</p>
        </div>
      </div>
    </button>
  );
};
