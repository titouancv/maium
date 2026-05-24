import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/constants";

interface UserCardProps {
  pseudo: string;
  first_name: string;
  last_name: string;
  location?: string | null;
}

export function UserCard({ pseudo, first_name, last_name, location }: UserCardProps) {
  return (
    <Link
      href={ROUTES.PROFILE(pseudo)}
      className="text-txt hover:text-primary flex w-full gap-2 rounded-sm py-3"
    >
      <div className="min-w-0 text-left">
        <p className="truncate">{first_name} {last_name}</p>
        <p className="text-txt-muted truncate text-xs">
          {pseudo}{location ? ` • ${location}` : ""}
        </p>
      </div>
    </Link>
  );
}
