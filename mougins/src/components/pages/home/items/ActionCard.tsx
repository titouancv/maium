import Image from "next/image";
import { Button, Title } from "@/components/ui";
import { Link } from "@/i18n/navigation";

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
}: ActionCardProps) => {
  const button = (
    <Button
      variant={primary ? "primary" : "outline"}
      size="sm"
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
          className="mt-1 h-auto w-26 shrink-0 self-start rounded-sm object-contain md:w-54"
        />
      )}
      <div className="flex h-full min-w-44 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Title size="h4" className="mt-1" label={text} />
          {description && <p className="max-w-44">{description}</p>}
        </div>
        {href ? (
          <Link href={href} className="mt-auto shrink-0">
            {button}
          </Link>
        ) : (
          <div className="mt-auto shrink-0">{button}</div>
        )}
      </div>
    </div>
  );
};
