import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/auth/getCurrentUser";
import type { UserSummary } from "@/types/user";

export type NotificationKind =
  | "follow"
  | "message"
  | "profile_view"
  | "story_like"
  | "story_repost";

/** Story kinds are grouped per story (one notification, many actors). */
const isStoryKind = (kind: NotificationKind) =>
  kind === "story_like" || kind === "story_repost";

/** A persisted home notification, with the acting user(s)' public summary. */
export interface HomeNotification {
  id: number;
  kind: NotificationKind;
  /**
   * Actors that triggered the notification, most-recent first. A single element
   * for `follow` / `message` / `profile_view`; story kinds collapse every liker
   * / reposter of the same story into one notification, so it can hold several
   * (rendered as "A, B and N others …").
   */
  actors: UserSummary[];
  /** Total distinct actors in the group (`actors.length`). */
  actorCount: number;
  /** Set only for `message` notifications (the source conversation). */
  conversationId: string | null;
  /** Set only for story kinds (the story the recipient should open). */
  storyId: string | null;
  createdAt: string;
  /** `null` while unread. */
  readAt: string | null;
}

/** Max notifications surfaced in the overlay. */
const NOTIFICATIONS_LIMIT = 30;

/**
 * Rows fetched before grouping. Larger than the display limit because story
 * notifications collapse many rows (one per liker) into a single entry — fetch
 * generously so a popular story doesn't crowd everything else out of the list.
 */
const NOTIFICATIONS_FETCH_LIMIT = 200;

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
  story_id: string | null;
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
    ...(isFollowing === undefined ? {} : { is_following: isFollowing }),
  };
}

/**
 * The current user's most recent notifications (newest first). Read with the
 * service-role client because `public.notifications` is RLS deny-all (written
 * only by triggers). Returns `[]` when signed out.
 *
 * Story likes / reposts of the same story are grouped into a single
 * notification carrying every actor (most-recent first), so the list stays
 * compact and can render "A, B and N others liked your story".
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
      `id, kind, conversation_id, story_id, created_at, read_at,
       actor:actor_id ( id, pseudo, first_name, last_name, location )`,
    )
    .eq("user_id", authUser.id)
    .not("kind", "in", `(${HIDDEN_KINDS.join(",")})`)
    .order("created_at", { ascending: false })
    .limit(NOTIFICATIONS_FETCH_LIMIT);
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

  // Rows arrive newest-first. For story kinds we keep one notification per
  // (kind, story) and append later (older) actors to it; the first time a group
  // is seen carries its newest `id` / `created_at` and dictates list order.
  const storyGroups = new Map<string, HomeNotification>();
  const result: HomeNotification[] = [];

  for (const row of rows) {
    if (!row.actor) continue;

    if (isStoryKind(row.kind) && row.story_id) {
      const key = `${row.kind}:${row.story_id}`;
      const existing = storyGroups.get(key);
      if (existing) {
        existing.actors.push(toSummary(row.actor));
        existing.actorCount += 1;
        if (!row.read_at) existing.readAt = null; // unread if any in the group is
        continue;
      }
      const notification: HomeNotification = {
        id: row.id,
        kind: row.kind,
        actors: [toSummary(row.actor)],
        actorCount: 1,
        conversationId: null,
        storyId: row.story_id,
        createdAt: row.created_at,
        readAt: row.read_at,
      };
      storyGroups.set(key, notification);
      result.push(notification);
      continue;
    }

    // Only `follow` rows carry follow state; others stay unannotated.
    const isFollowing =
      row.kind === "follow" ? followedSet.has(row.actor.id) : undefined;

    result.push({
      id: row.id,
      kind: row.kind,
      actors: [toSummary(row.actor, isFollowing)],
      actorCount: 1,
      conversationId: row.conversation_id,
      storyId: null,
      createdAt: row.created_at,
      readAt: row.read_at,
    });
  }

  return result.slice(0, limit);
}

/**
 * Number of unread notifications for the current user (0 when signed out).
 * Story likes / reposts of the same story count as one (matching the grouped
 * list), so the badge tracks notifications, not raw rows.
 */
export async function getUnreadNotificationsCount(): Promise<number> {
  const authUser = await getAuthUser();
  if (!authUser) return 0;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("notifications")
    .select("kind, story_id")
    .eq("user_id", authUser.id)
    .not("kind", "in", `(${HIDDEN_KINDS.join(",")})`)
    .is("read_at", null)
    .limit(NOTIFICATIONS_FETCH_LIMIT);
  if (error) throw error;

  const rows = (data ?? []) as { kind: NotificationKind; story_id: string | null }[];
  const seenStoryGroups = new Set<string>();
  let count = 0;
  for (const row of rows) {
    if (isStoryKind(row.kind) && row.story_id) {
      const key = `${row.kind}:${row.story_id}`;
      if (seenStoryGroups.has(key)) continue; // already counted this story group
      seenStoryGroups.add(key);
    }
    count += 1;
  }
  return count;
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
