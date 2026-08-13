import { notFound } from "next/navigation";
import { EmptyState, UserCard } from "@/components/ui";
import type { UserSummary } from "@/types";

interface UserListItemsProps {
  usersPromise: Promise<UserSummary[] | null>;
  emptyMessage: string;
}

export async function UserListItems({
  usersPromise,
  emptyMessage,
}: UserListItemsProps) {
  const users = await usersPromise;
  if (users === null) notFound();

  if (users.length === 0) {
    return <EmptyState label={emptyMessage} />;
  }

  return (
    <ul>
      {users.map((user) => (
        <li key={user.pseudo}>
          <UserCard
            {...user}
            profilePhoto={user.profile_photo}
            showFollow
            initialFollowing={user.is_following ?? false}
          />
        </li>
      ))}
    </ul>
  );
}
