import { notFound } from "next/navigation";
import { UserCard } from "@/components/ui";
import type { UserSummary } from "@/types";

interface UserListItemsProps {
  /** Resolves to `null` when the target user does not exist. */
  usersPromise: Promise<UserSummary[] | null>;
  emptyMessage: string;
}

/** Streamed follower/following list; calls notFound() for a missing user. */
export async function UserListItems({
  usersPromise,
  emptyMessage,
}: UserListItemsProps) {
  const users = await usersPromise;
  if (users === null) notFound();

  if (users.length === 0) {
    return <p className="text-txt-muted text-sm">{emptyMessage}</p>;
  }

  return (
    <ul>
      {users.map((user) => (
        <li key={user.pseudo}>
          <UserCard
            {...user}
            showFollow
            initialFollowing={user.is_following ?? false}
          />
        </li>
      ))}
    </ul>
  );
}
