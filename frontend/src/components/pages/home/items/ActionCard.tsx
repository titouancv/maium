import { Button, Title } from "@/components/ui";
import { Link } from "@/i18n/navigation";

interface ActionCardProps {
  actionLabel: string;
  text: string;
  href: string;
  primary?: boolean;
}

export const ActionCard = ({
  actionLabel,
  text,
  href,
  primary,
}: ActionCardProps) => {
  return (
    <div className="flex h-full min-w-44 flex-col gap-4">
      <Title size="h6" className="mt-1" label={text} />
      <Link href={href} className="shrink-0">
        <Button variant={primary ? "primary" : "outline"} size="sm">
          {actionLabel}
        </Button>
      </Link>
    </div>
  );
};
