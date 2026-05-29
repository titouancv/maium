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

  const conversations = await getConversations();

  return <MessagingContent conversations={conversations} currentUserId={authUser!.id} />;
}
