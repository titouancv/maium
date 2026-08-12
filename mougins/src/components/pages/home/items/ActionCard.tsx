import Image from "next/image";
import { Button, Title } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * How much room the card claims. `hero` is the page's headline action (bigger
 * illustration, `h2` heading, room for a full sentence); `compact` is a
 * secondary action listed underneath it.
 */
type ActionCardEmphasis = "hero" | "compact";

interface ActionCardProps {
  actionLabel: string;
  text: string;
  /** Navigation target. Provide either `href` (link) or `onClick` (action). */
  href?: string;
  /** Click handler for non-navigation actions (e.g. a download). */
  onClick?: () => void;
  /** Shows the button's loading state (only meaningful with `onClick`). */
  isLoading?: boolean;
  /** Short line explaining why doing this action is worthwhile. */
  description?: string;
  primary?: boolean;
  /** Optional illustration shown to the left of the text. */
  illustration?: string;
  emphasis?: ActionCardEmphasis;
  /** Optional outline link sitting next to the main button. */
  secondary?: { label: string; href: string };
}

export const ActionCard = ({
  actionLabel,
  text,
  href,
  onClick,
  isLoading,
  description,
  primary,
  illustration,
  emphasis = "compact",
  secondary,
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
    <div className="flex h-full gap-4 md:gap-8">
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
        <div className="flex flex-col gap-2">
          <Title size={isHero ? "h2" : "h3"} className="mt-1" label={text} />
          {description && (
            <p className={isHero ? "max-w-lg" : "max-w-44"}>{description}</p>
          )}
        </div>
        <div className="mt-auto flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
          {href ? <Link href={href}>{button}</Link> : button}
          {secondary && (
            <Link href={secondary.href}>
              <Button variant="outline" size={size}>
                {secondary.label}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
