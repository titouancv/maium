import { API } from "@/constants";

/**
 * Patch the current user's profile from the browser.
 *
 * `PATCH /api/users/me` is the single write path for every profile field, and
 * this wrapper is the single client-side caller — the signup wizard, the
 * settings overlays and the photo picker all go through it rather than each
 * hand-rolling the same `fetch`.
 *
 * Returns whether the write succeeded; callers own the user-facing error text
 * since the wording differs per surface.
 *
 * ⚠️ The endpoint **replaces** each collection it receives (it deletes the
 * user's rows for that kind and re-inserts the payload in order). Send a merged
 * list, never a delta, when adding to experiences / skills / projects /
 * social networks / hobbies.
 */
export async function updateProfile(
  body: Record<string, unknown>,
): Promise<boolean> {
  try {
    const res = await fetch(API.USERS_ME, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}
