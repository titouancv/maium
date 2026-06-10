import { ROUTES } from "@/constants";

// Pure, client-safe helper. Kept out of `server.ts` (which the messaging barrel
// re-exports) so client components can import it without pulling server code.

/** Extract the active conversation id from `/messages/<id>`, if any. */
export function activeConversationIdFrom(pathname: string): string | undefined {
  const prefix = `${ROUTES.MESSAGES}/`;
  if (!pathname.startsWith(prefix)) return undefined;
  const rest = pathname.slice(prefix.length);
  return rest.length > 0 ? rest : undefined;
}
