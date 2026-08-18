import Image from "next/image";
import { Button } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type ActionCardEmphasis = "hero" | "compact";

interface ActionCardProps {
  actionLabel: string;
  href?: string;
  onClick?: () => void;
  isLoading?: boolean;
  description?: string;
  primary?: boolean;
  illustration?: string;
  emphasis?: ActionCardEmphasis;
}

export const ActionCard = ({
  actionLabel,
  href,
  onClick,
  isLoading,
  description,
  primary,
  illustration,
  emphasis = "compact",
}: ActionCardProps) => {
  const isHero = emphasis === "hero";
  const size = isHero ? "md" : "sm";

  const button = (
    <Button
      variant={primary ? "primary" : "outline"}
      size={size}
      onClick={onClick}
      isLoading={isLoading}
    >
      {actionLabel}
    </Button>
  );

  return (
    <div className="flex h-full flex-col gap-4 md:flex-row md:gap-8">
      {illustration && (
        <Image
          src={illustration}
          alt=""
          aria-hidden
          width={1408}
          height={768}
          className={cn(
            "mt-1 h-auto shrink-0 self-start rounded-sm object-contain",
            isHero ? "w-28 md:w-80" : "w-22 md:w-54",
          )}
        />
      )}
      <div className="flex h-full min-w-44 flex-col gap-4">
        {description && (
          <p className={isHero ? "max-w-lg" : "max-w-44"}>{description}</p>
        )}
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
          {href ? <Link href={href}>{button}</Link> : button}
        </div>
      </div>
    </div>
  );
};
