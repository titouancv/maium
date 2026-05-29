import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { ROUTES } from "@/constants";
import { getAuthUser } from "@/lib/auth/getCurrentUser";
import { getConversationById, getMessages } from "@/lib/messaging/server";
import { ConversationContent } from "@/components/messaging";

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { conversationId } = await params;
  const [locale, authUser] = await Promise.all([getLocale(), getAuthUser()]);

  if (!authUser) {
    redirect({ href: ROUTES.SIGNUP, locale });
  }

  const [conversation, messages] = await Promise.all([
    getConversationById(conversationId),
    getMessages(conversationId),
  ]);

  if (!conversation) notFound();

  return (
    <ConversationContent
      conversation={conversation}
      initialMessages={messages}
      currentUserId={authUser!.id}
    />
  );
}
