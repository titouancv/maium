import { getAuthUser } from "@/lib/auth/getCurrentUser";
import { getAnonId } from "@/lib/auth/anonSession";

export type Requester =
  | { kind: "user"; userId: string }
  | { kind: "anon"; anonId: string };

export async function getRequester(): Promise<Requester | null> {
  const authUser = await getAuthUser();
  if (authUser) return { kind: "user", userId: authUser.id };

  const anonId = await getAnonId();
  return anonId ? { kind: "anon", anonId } : null;
}

export interface OwnedRow {
  user_id: string | null;
  anon_id: string | null;
}

export function ownsRow(row: OwnedRow, requester: Requester | null): boolean {
  if (!requester) return false;
  return requester.kind === "user"
    ? row.user_id === requester.userId
    : row.anon_id === requester.anonId;
}
