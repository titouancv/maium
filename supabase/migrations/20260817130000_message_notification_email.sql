ALTER TABLE public.users
    ADD COLUMN last_message_email_at timestamptz;

COMMENT ON COLUMN public.users.last_message_email_at IS
    'When a message-notification email was last sent to this user. Claimed with a conditional UPDATE (NULL or older than 1 day) so at most one message email goes out per rolling 24h, across every conversation and sender.';
