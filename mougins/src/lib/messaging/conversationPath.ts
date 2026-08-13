import { ROUTES } from "@/constants";

export function activeConversationIdFrom(pathname: string): string | undefined {
  const prefix = `${ROUTES.MESSAGES}/`;
  if (!pathname.startsWith(prefix)) return undefined;
  const rest = pathname.slice(prefix.length);
  return rest.length > 0 ? rest : undefined;
}
