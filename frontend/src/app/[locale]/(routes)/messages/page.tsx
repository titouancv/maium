import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { ROUTES } from "@/constants";
import { getAuthUser } from "@/lib/auth/getCurrentUser";
import { getConversations } from "@/lib/messaging/server";
import { MessagingContent } from "@/components/messaging";

export default async function MessagesPage() {
  const [locale, authUser] = await Promise.all([getLocale(), getAuthUser()]);

  if (!authUser) {
    redirect({ href: ROUTES.SIGNUP, locale });
  }

  // Not awaited: streams into the conversation list's Suspense boundary.
  const conversationsPromise = getConversations();

  return (
    <MessagingContent
      conversationsPromise={conversationsPromise}
      currentUserId={authUser!.id}
    />
  );
}
