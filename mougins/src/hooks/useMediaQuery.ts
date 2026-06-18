import { useEffect, useState } from "react";

/**
 * Tracks whether a CSS media query currently matches. The initial value is read
 * synchronously from `matchMedia` (so client-only consumers paint correctly on
 * the first render without a flash), then kept live via a `change` listener.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
