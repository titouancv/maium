import { cn } from "@/lib/utils";
import { Icon, NumberRoller, Rail } from "@/components/ui";

interface NotificationCardProps {
  count: number;
  label: string;
  onClick: () => void;
}

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
        <Rail className="my-1" />
        <div className="flex items-center justify-end gap-1">
          <NumberRoller
            value={count}
            className={cn(
              "text-2xl leading-none font-extrabold",
              highlighted && "text-primary",
            )}
          />
          <Icon
            name="bell"
            size={20}
            className={cn("sm:hidden", highlighted && "text-primary")}
          />
          <p className="hidden truncate text-lg sm:block">{label}</p>
        </div>
      </div>
    </button>
  );
};
