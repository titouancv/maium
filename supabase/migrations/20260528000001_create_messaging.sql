-- Messaging tables: conversations, conversation_members, messages

create table conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  is_group boolean default false,
  title text
);

create table conversation_members (
  conversation_id uuid references conversations(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (conversation_id, user_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

-- Indices
create index messages_conversation_created_idx on messages(conversation_id, created_at desc);
create index conversation_members_user_idx on conversation_members(user_id);
create index conversation_members_conversation_idx on conversation_members(conversation_id);

-- Enable RLS
alter table conversations enable row level security;
alter table conversation_members enable row level security;
alter table messages enable row level security;

-- Conversations RLS
create policy "users can see their conversations"
on conversations for select
using (
  exists (
    select 1 from conversation_members cm
    where cm.conversation_id = conversations.id
    and cm.user_id = auth.uid()
  )
);

create policy "authenticated users can create conversations"
on conversations for insert
with check (auth.uid() is not null);

-- Conversation members RLS
create policy "users can see members of their conversations"
on conversation_members for select
using (
  exists (
    select 1 from conversation_members cm
    where cm.conversation_id = conversation_members.conversation_id
    and cm.user_id = auth.uid()
  )
);

create policy "users can add members to conversations they belong to"
on conversation_members for insert
with check (auth.uid() is not null);

-- Messages RLS
create policy "users can read messages of their conversations"
on messages for select
using (
  exists (
    select 1 from conversation_members cm
    where cm.conversation_id = messages.conversation_id
    and cm.user_id = auth.uid()
  )
);

create policy "users can insert messages"
on messages for insert
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from conversation_members cm
    where cm.conversation_id = messages.conversation_id
    and cm.user_id = auth.uid()
  )
);

-- Enable Realtime for new message inserts
alter publication supabase_realtime add table messages;
