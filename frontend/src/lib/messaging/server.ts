import { createClient } from "@/lib/supabase/server";
import { MESSAGES_PAGE_SIZE } from "@/constants";
import type { Conversation, Message } from "@/types";

export async function getConversations(): Promise<Conversation[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", user.id);

  if (!memberships?.length) return [];

  const conversationIds = memberships.map((m) => m.conversation_id);

  const { data: conversations } = await supabase
    .from("conversations")
    .select(
      `id, created_at, is_group, title,
       conversation_members (
         user_id,
         last_read_at,
         users:user_id ( id, pseudo, first_name, last_name )
       )`,
    )
    .in("id", conversationIds)
    .order("created_at", { ascending: false });

  if (!conversations) return [];

  const { data: lastMessages } = await supabase
    .from("messages")
    .select("conversation_id, content, created_at, sender_id")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  const lastMessageByConversation = new Map<
    string,
    { content: string; created_at: string; sender_id: string }
  >();
  if (lastMessages) {
    for (const msg of lastMessages) {
      if (!lastMessageByConversation.has(msg.conversation_id)) {
        lastMessageByConversation.set(msg.conversation_id, {
          content: msg.content,
          created_at: msg.created_at,
          sender_id: msg.sender_id,
        });
      }
    }
  }

  return conversations
    // Hide conversations that have no message yet.
    .filter((c) => lastMessageByConversation.has(c.id))
    .map((c) => {
      const members = ((c.conversation_members as unknown as Array<{
        user_id: string;
        last_read_at: string | null;
        users: { id: string; pseudo: string; first_name: string; last_name: string } | null;
      }>) ?? [])
        .filter((m) => m.users !== null)
        .map((m) => ({ ...m.users!, last_read_at: m.last_read_at }));

      return {
        id: c.id,
        created_at: c.created_at,
        is_group: c.is_group,
        title: c.title,
        members,
        last_message: lastMessageByConversation.get(c.id) ?? null,
      };
    })
    // Most recently active conversations first: order by last message date,
    // falling back to the conversation creation date when there is no message.
    .sort((a, b) => {
      const aDate = a.last_message?.created_at ?? a.created_at;
      const bDate = b.last_message?.created_at ?? b.created_at;
      return bDate.localeCompare(aDate);
    });
}

export async function getConversationById(
  conversationId: string,
): Promise<Conversation | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("conversations")
    .select(
      `id, created_at, is_group, title,
       conversation_members (
         user_id,
         last_read_at,
         users:user_id ( id, pseudo, first_name, last_name )
       )`,
    )
    .eq("id", conversationId)
    .single();

  if (!data) return null;

  const rawMembers = (data.conversation_members as unknown as Array<{
    user_id: string;
    last_read_at: string | null;
    users: { id: string; pseudo: string; first_name: string; last_name: string } | null;
  }>) ?? [];

  const isMember = rawMembers.some((m) => m.user_id === user.id);
  if (!isMember) return null;

  const members = rawMembers
    .filter((m) => m.users !== null)
    .map((m) => ({ ...m.users!, last_read_at: m.last_read_at }));

  return {
    id: data.id,
    created_at: data.created_at,
    is_group: data.is_group,
    title: data.title,
    members,
    last_message: null,
  };
}

/**
 * Fetches a page of messages, newest first internally but returned oldest →
 * newest. Pass `before` (the `created_at` of the oldest message already loaded)
 * to fetch the previous page for upward infinite scroll.
 */
export async function getMessages(
  conversationId: string,
  options: { limit?: number; before?: string } = {},
): Promise<Message[]> {
  const { limit = MESSAGES_PAGE_SIZE, before } = options;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("messages")
    .select(
      `id, conversation_id, sender_id, content, created_at, edited_at, deleted_at,
       sender:sender_id ( pseudo, first_name, last_name )`,
    )
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) query = query.lt("created_at", before);

  const { data } = await query;

  if (!data) return [];

  return data
    .map((m) => ({
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      content: m.content,
      created_at: m.created_at,
      edited_at: m.edited_at,
      deleted_at: m.deleted_at,
      sender: (m.sender as unknown) as { pseudo: string; first_name: string; last_name: string } | null,
    }))
    .reverse();
}
