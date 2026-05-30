-- Read receipts: track the last time each member read a conversation.

alter table conversation_members add column last_read_at timestamptz;

-- UPDATE requires a SELECT policy (already present: "users can see members of
-- their conversations") plus an UPDATE policy so a user can mark their own
-- membership as read.
create policy "users can update their own membership"
on conversation_members for update
using (user_id = auth.uid())
with check (user_id = auth.uid());
