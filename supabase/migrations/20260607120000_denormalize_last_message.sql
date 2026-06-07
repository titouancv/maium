-- Denormalize the last message onto conversations.
--
-- Before this, listing a user's conversations meant fetching *every* message of
-- *every* conversation they belong to (no limit) just to derive the newest one
-- per conversation in app code — O(total messages). These columns, maintained
-- by a trigger on message insert, make the list a single indexed query ordered
-- by `last_message_at`.

alter table conversations
  add column last_message_at      timestamptz,
  add column last_message_content text,
  add column last_message_sender_id uuid references public.users(id) on delete set null;

-- Most-recently-active-first ordering for the conversations list.
create index conversations_last_message_at_idx
  on conversations (last_message_at desc);

-- Keep the denormalized columns in sync with the newest message.
create or replace function public.update_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
  set last_message_at      = new.created_at,
      last_message_content = new.content,
      last_message_sender_id = new.sender_id
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_set_conversation_last_message
  after insert on messages
  for each row
  execute function public.update_conversation_last_message();

-- Backfill existing conversations from their current newest message.
update conversations c
set last_message_at      = m.created_at,
    last_message_content = m.content,
    last_message_sender_id = m.sender_id
from (
  select distinct on (conversation_id)
    conversation_id, created_at, content, sender_id
  from messages
  order by conversation_id, created_at desc
) m
where m.conversation_id = c.id;
