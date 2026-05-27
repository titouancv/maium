export interface ConversationMember {
  id: string;
  pseudo: string;
  first_name: string;
  last_name: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  is_group: boolean;
  title: string | null;
  members: ConversationMember[];
  last_message: {
    content: string;
    created_at: string;
    sender_id: string;
  } | null;
}

export interface Message {
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
  } | null;
}

export type OptimisticMessage = Message & { optimistic?: true };
