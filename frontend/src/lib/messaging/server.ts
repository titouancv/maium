import { createClient } from "@/lib/supabase/server";
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

  return conversations.map((c) => {
    const members = ((c.conversation_members as unknown as Array<{
      user_id: string;
      users: { id: string; pseudo: string; first_name: string; last_name: string } | null;
    }>) ?? [])
      .filter((m) => m.users !== null)
      .map((m) => m.users!);

    return {
      id: c.id,
      created_at: c.created_at,
      is_group: c.is_group,
      title: c.title,
      members,
      last_message: lastMessageByConversation.get(c.id) ?? null,
    };
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
         users:user_id ( id, pseudo, first_name, last_name )
       )`,
    )
    .eq("id", conversationId)
    .single();

  if (!data) return null;

  const members = ((data.conversation_members as unknown as Array<{
    user_id: string;
    users: { id: string; pseudo: string; first_name: string; last_name: string } | null;
  }>) ?? [])
    .filter((m) => m.users !== null)
    .map((m) => m.users!);

  const isMember = members.some((m) => m.id === user.id);
  if (!isMember) return null;

  return {
    id: data.id,
    created_at: data.created_at,
    is_group: data.is_group,
    title: data.title,
    members,
    last_message: null,
  };
}

export async function getMessages(
  conversationId: string,
  limit = 30,
): Promise<Message[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("messages")
    .select(
      `id, conversation_id, sender_id, content, created_at, edited_at, deleted_at,
       sender:sender_id ( pseudo, first_name, last_name )`,
    )
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

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
