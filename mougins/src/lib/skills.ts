import { EXTERNAL_API } from "@/constants";

export function skillChatUrl(prompt: string): string {
  const url = new URL(EXTERNAL_API.MISTRAL_CHAT);
  url.searchParams.set("q", prompt);
  return url.toString();
}
