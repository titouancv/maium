import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/auth/getCurrentUser";
import type { UserSummary } from "@/types/user";

export type NotificationKind = "follow" | "message" | "profile_view";

export interface HomeNotification {
  id: number;
  kind: NotificationKind;
  actor: UserSummary;
  conversationId: string | null;
  createdAt: string;
  readAt: string | null;
}

const NOTIFICATIONS_LIMIT = 30;

const HIDDEN_KINDS: NotificationKind[] = ["profile_view"];

type ActorRow = UserSummary & { id: string };

interface NotificationRow {
  id: number;
  kind: NotificationKind;
  conversation_id: string | null;
  created_at: string;
  read_at: string | null;
  actor: ActorRow | null;
}

function toSummary(actor: ActorRow, isFollowing?: boolean): UserSummary {
  return {
    pseudo: actor.pseudo,
    first_name: actor.first_name,
    last_name: actor.last_name,
    location: actor.location,
    profile_photo: actor.profile_photo,
    gender: actor.gender,
    ...(isFollowing === undefined ? {} : { is_following: isFollowing }),
  };
}

export async function getNotifications(
  limit = NOTIFICATIONS_LIMIT,
): Promise<HomeNotification[]> {
  const authUser = await getAuthUser();
  if (!authUser) return [];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("notifications")
    .select(
      `id, kind, conversation_id, created_at, read_at,
       actor:actor_id ( id, pseudo, first_name, last_name, location, profile_photo, gender )`,
    )
    .eq("user_id", authUser.id)
    .not("kind", "in", `(${HIDDEN_KINDS.join(",")})`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const rows = (data ?? []) as unknown as NotificationRow[];

  const followActorIds = rows
    .filter((row) => row.kind === "follow" && row.actor)
    .map((row) => row.actor!.id);
  let followedSet = new Set<string>();
  if (followActorIds.length > 0) {
    const { data: followData } = await admin
      .from("user_follows")
      .select("followed_id")
      .eq("follower_id", authUser.id)
      .in("followed_id", followActorIds);
    followedSet = new Set(
      (followData ?? []).map((row) => row.followed_id as string),
    );
  }

  return rows.flatMap((row) =>
    row.actor
      ? [
          {
            id: row.id,
            kind: row.kind,
            actor: toSummary(
              row.actor,
              row.kind === "follow"
                ? followedSet.has(row.actor.id)
                : undefined,
            ),
            conversationId: row.conversation_id,
            createdAt: row.created_at,
            readAt: row.read_at,
          },
        ]
      : [],
  );
}

export async function getUnreadNotificationsCount(): Promise<number> {
  const authUser = await getAuthUser();
  if (!authUser) return 0;

  const admin = createAdminClient();
  const { count, error } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", authUser.id)
    .not("kind", "in", `(${HIDDEN_KINDS.join(",")})`)
    .is("read_at", null);
  if (error) throw error;

  return count ?? 0;
}

export async function markNotificationsRead(): Promise<void> {
  const authUser = await getAuthUser();
  if (!authUser) return;

  const admin = createAdminClient();
  const { error } = await admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", authUser.id)
    .not("kind", "in", `(${HIDDEN_KINDS.join(",")})`)
    .is("read_at", null);
  if (error) throw error;
}
