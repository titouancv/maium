import { createClient } from "@/lib/supabase/server";
import { MESSAGES_PAGE_SIZE } from "@/constants";
import type { Conversation, ConversationMember, Message } from "@/types";

interface MemberUserRow {
  id: string;
  pseudo: string;
  first_name: string;
  last_name: string;
  profile_photo: string | null;
}

interface ConversationMemberRow {
  user_id: string;
  last_read_at: string | null;
  users: MemberUserRow | null;
}

interface ConversationRow {
  id: string;
  created_at: string;
  is_group: boolean;
  title: string | null;
  last_message_at: string | null;
  last_message_content: string | null;
  last_message_sender_id: string | null;
  conversation_members: ConversationMemberRow[];
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  sender: {
    pseudo: string;
    first_name: string;
    last_name: string;
    profile_photo: string | null;
  } | null;
}

const CONVERSATION_SELECT = `id, created_at, is_group, title,
   last_message_at, last_message_content, last_message_sender_id,
   conversation_members (
     user_id,
     last_read_at,
     users:user_id ( id, pseudo, first_name, last_name, profile_photo )
   )`;

function mapMembers(rows: ConversationMemberRow[]): ConversationMember[] {
  return rows
    .filter((m) => m.users !== null)
    .map((m) => ({ ...(m.users as MemberUserRow), last_read_at: m.last_read_at }));
}

function buildLastMessage(row: ConversationRow): Conversation["last_message"] {
  if (!row.last_message_at) return null;
  return {
    content: row.last_message_content ?? "",
    created_at: row.last_message_at,
    sender_id: row.last_message_sender_id ?? "",
  };
}

function mapConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    created_at: row.created_at,
    is_group: row.is_group,
    title: row.title,
    members: mapMembers(row.conversation_members ?? []),
    last_message: buildLastMessage(row),
  };
}

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

  const { data } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .in("id", conversationIds)
    .not("last_message_at", "is", null)
    .order("last_message_at", { ascending: false });

  const rows = (data ?? []) as unknown as ConversationRow[];
  return rows.map(mapConversation);
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
    .select(CONVERSATION_SELECT)
    .eq("id", conversationId)
    .single();

  if (!data) return null;
  const row = data as unknown as ConversationRow;

  const isMember = (row.conversation_members ?? []).some(
    (m) => m.user_id === user.id,
  );
  if (!isMember) return null;

  return mapConversation(row);
}

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
       sender:sender_id ( pseudo, first_name, last_name, profile_photo )`,
    )
    .eq("conversation_id", conversationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  if (before) query = query.lt("created_at", before);

  const { data } = await query;

  const rows = (data ?? []) as unknown as MessageRow[];
  return rows
    .map((m) => ({
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      content: m.content,
      created_at: m.created_at,
      edited_at: m.edited_at,
      deleted_at: m.deleted_at,
      sender: m.sender,
    }))
    .reverse();
}
