import { API } from "@/constants";

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
