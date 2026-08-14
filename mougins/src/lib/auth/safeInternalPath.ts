export function safeInternalPath(
  next: string | null,
  origin: string,
): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  if (next.includes("\\")) return null;

  try {
    const target = new URL(next, origin);
    if (target.origin !== origin) return null;
    return `${target.pathname}${target.search}`;
  } catch {
    return null;
  }
}
