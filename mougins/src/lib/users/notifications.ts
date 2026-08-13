import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/auth/getCurrentUser";
import type { UserSummary } from "@/types/user";

export type NotificationKind =
  | "follow"
  | "message"
  | "profile_view"
  | "analysis_snooze";

export interface NotificationAnalysis {
  id: string;
  title: string | null;
  company: string | null;
}

export interface HomeNotification {
  id: number;
  kind: NotificationKind;
  actor: UserSummary | null;
  conversationId: string | null;
  analysis: NotificationAnalysis | null;
  createdAt: string;
  readAt: string | null;
}

const NOTIFICATIONS_LIMIT = 30;

const HIDDEN_KINDS: NotificationKind[] = ["profile_view"];

type ActorRow = UserSummary & { id: string };

interface AnalysisRow {
  id: string;
  job: { title: string | null; company: string | null } | null;
}

interface NotificationRow {
  id: number;
  kind: NotificationKind;
  conversation_id: string | null;
  created_at: string;
  read_at: string | null;
  actor: ActorRow | null;
  analysis: AnalysisRow | null;
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function sweepStaleAnalyses(
  admin: AdminClient,
  userId: string,
): Promise<void> {
  await admin.rpc("sweep_stale_analysis_notifications", { p_user_id: userId });
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
  await sweepStaleAnalyses(admin, authUser.id);

  const { data, error } = await admin
    .from("notifications")
    .select(
      `id, kind, conversation_id, created_at, read_at,
       actor:actor_id ( id, pseudo, first_name, last_name, location, profile_photo, gender ),
       analysis:analysis_id ( id, job:job_id ( title, company ) )`,
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

  return rows.flatMap((row) => {
    const target = row.kind === "analysis_snooze" ? row.analysis : row.actor;
    if (!target) return [];

    return [
      {
        id: row.id,
        kind: row.kind,
        actor: row.actor
          ? toSummary(
              row.actor,
              row.kind === "follow" ? followedSet.has(row.actor.id) : undefined,
            )
          : null,
        conversationId: row.conversation_id,
        analysis: row.analysis
          ? {
              id: row.analysis.id,
              title: row.analysis.job?.title ?? null,
              company: row.analysis.job?.company ?? null,
            }
          : null,
        createdAt: row.created_at,
        readAt: row.read_at,
      },
    ];
  });
}

export async function getUnreadNotificationsCount(): Promise<number> {
  const authUser = await getAuthUser();
  if (!authUser) return 0;

  const admin = createAdminClient();
  await sweepStaleAnalyses(admin, authUser.id);

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
