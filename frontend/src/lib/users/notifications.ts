import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/auth/getCurrentUser";
import type { UserSummary } from "@/types/user";

export type NotificationKind = "follow" | "message" | "profile_view";

/** A persisted home notification, with the acting user's public summary. */
export interface HomeNotification {
  id: number;
  kind: NotificationKind;
  actor: UserSummary;
  /** Set only for `message` notifications (the source conversation). */
  conversationId: string | null;
  createdAt: string;
  /** `null` while unread. */
  readAt: string | null;
}

/** Max notifications surfaced in the overlay. */
const NOTIFICATIONS_LIMIT = 30;

interface NotificationRow {
  id: number;
  kind: NotificationKind;
  conversation_id: string | null;
  created_at: string;
  read_at: string | null;
  actor: UserSummary | null;
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
       actor:actor_id ( pseudo, first_name, last_name, location )`,
    )
    .eq("user_id", authUser.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const rows = (data ?? []) as unknown as NotificationRow[];
  return rows
    .filter((row): row is NotificationRow & { actor: UserSummary } =>
      Boolean(row.actor),
    )
    .map((row) => ({
      id: row.id,
      kind: row.kind,
      actor: row.actor,
      conversationId: row.conversation_id,
      createdAt: row.created_at,
      readAt: row.read_at,
    }));
}

/** Number of unread notifications for the current user (0 when signed out). */
export async function getUnreadNotificationsCount(): Promise<number> {
  const authUser = await getAuthUser();
  if (!authUser) return 0;

  const admin = createAdminClient();
  const { count } = await admin
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", authUser.id)
    .is("read_at", null);
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
    .is("read_at", null);
  if (error) throw error;
}
