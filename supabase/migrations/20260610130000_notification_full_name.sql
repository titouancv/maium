-- Use full name (first + last) as actor_name in notification broadcasts.
-- Falls back to pseudo when both name fields are empty/null.

CREATE OR REPLACE FUNCTION public.broadcast_notification_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    actor_name text;
BEGIN
    SELECT COALESCE(
               NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''),
               u.pseudo
           )
      INTO actor_name
      FROM public.users u
     WHERE u.id = NEW.follower_id;

    PERFORM realtime.send(
        jsonb_build_object('kind', 'follow', 'actor_name', actor_name),
        'notify',
        'notifications:' || NEW.followed_id::text,
        true
    );
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.broadcast_notification_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    actor_name text;
BEGIN
    SELECT COALESCE(
               NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''),
               u.pseudo
           )
      INTO actor_name
      FROM public.users u
     WHERE u.id = NEW.sender_id;

    PERFORM realtime.send(
        jsonb_build_object(
            'kind', 'message',
            'actor_name', actor_name,
            'conversation_id', NEW.conversation_id::text
        ),
        'notify',
        'notifications:' || cm.user_id::text,
        true
    )
    FROM public.conversation_members cm
    WHERE cm.conversation_id = NEW.conversation_id
      AND cm.user_id <> NEW.sender_id;
    RETURN NULL;
END;
$$;
