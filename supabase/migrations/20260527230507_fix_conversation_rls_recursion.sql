-- Fix recursive RLS on conversation_members.
-- The previous policies caused infinite recursion:
--   conversations SELECT → queries conversation_members → triggers conversation_members RLS
--   → queries conversation_members again → recursion → empty result → 404
--
-- A SECURITY DEFINER function breaks the loop by bypassing RLS when checking membership.

create or replace function public.is_conversation_member(conv_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = conv_id
      and user_id = auth.uid()
  );
$$;

-- Replace conversations SELECT policy
drop policy if exists "users can see their conversations" on public.conversations;
create policy "users can see their conversations"
on public.conversations for select
using (public.is_conversation_member(id));

-- Replace conversation_members SELECT policy (was self-referential)
drop policy if exists "users can see members of their conversations" on public.conversation_members;
create policy "users can see members of their conversations"
on public.conversation_members for select
using (public.is_conversation_member(conversation_id));
