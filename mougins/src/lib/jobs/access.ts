import { getAuthUser } from "@/lib/auth/getCurrentUser";
import { getAnonId } from "@/lib/auth/anonSession";

/**
 * Who is asking for an analysis or a resume: a signed-in user, or a signed-out
 * browser holding an `anon_id` cookie. `null` when neither applies.
 */
export type Requester =
  | { kind: "user"; userId: string }
  | { kind: "anon"; anonId: string };

/** Resolve the caller's identity, preferring a real account over a cookie. */
export async function getRequester(): Promise<Requester | null> {
  const authUser = await getAuthUser();
  if (authUser) return { kind: "user", userId: authUser.id };

  const anonId = await getAnonId();
  return anonId ? { kind: "anon", anonId } : null;
}

/** The owner columns every pipeline row carries. */
export interface OwnedRow {
  user_id: string | null;
  anon_id: string | null;
}

/**
 * Whether `requester` owns `row`.
 *
 * This is the *whole* authorization check for signed-out results: their rows
 * are invisible to Postgres RLS (no policy matches a NULL `user_id`) and are
 * read with the service-role client, so nothing else stands between a request
 * and someone else's analysis. Both sides must be non-null to match — a row
 * with no owner, or a caller with no identity, never passes.
 */
export function ownsRow(row: OwnedRow, requester: Requester | null): boolean {
  if (!requester) return false;
  return requester.kind === "user"
    ? row.user_id === requester.userId
    : row.anon_id === requester.anonId;
}
