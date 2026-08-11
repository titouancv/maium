import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/auth/getCurrentUser";
import type { UserSummary } from "@/types/user";

export type NotificationKind = "follow" | "message" | "profile_view";

/** A persisted home notification, with the acting user's public summary. */
export interface HomeNotification {
  id: number;
  kind: NotificationKind;
  /** The user that triggered the notification. */
  actor: UserSummary;
  /** Set only for `message` notifications (the source conversation). */
  conversationId: string | null;
  createdAt: string;
  /** `null` while unread. */
  readAt: string | null;
}

/** Max notifications surfaced in the overlay. */
const NOTIFICATIONS_LIMIT = 30;

/**
 * Notification kinds currently hidden from the user. The feature (DB trigger,
 * type, rendering) is kept intact — these are only filtered out at read time,
 * so re-enabling a kind is a one-line change. `profile_view` is disabled for now.
 */
const HIDDEN_KINDS: NotificationKind[] = ["profile_view"];

/** Actor as embedded by the query — the public summary plus the internal id. */
type ActorRow = UserSummary & { id: string };

interface NotificationRow {
  id: number;
  kind: NotificationKind;
  conversation_id: string | null;
  created_at: string;
  read_at: string | null;
  actor: ActorRow | null;
}

/** Strip the internal id and (optionally) annotate the follow state. */
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

/**
 * The current user's most recent notifications (newest first). Read with the
 * service-role client because `public.notifications` is RLS deny-all (written
 * only by triggers). Returns `[]` when signed out.
 */
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

  // `follow` rows show a follow/unfollow button, so resolve which of those
  // actors the viewer already follows (one query for the whole batch).
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

  // Rows arrive newest-first and map one-to-one to a notification. Only
  // `follow` rows carry follow state; the others stay unannotated.
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

/** Number of unread notifications for the current user (0 when signed out). */
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

/** Mark every unread notification of the current user as read. No-op signed out. */
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
