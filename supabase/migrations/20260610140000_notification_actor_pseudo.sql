-- Add actor_pseudo to the follow notification payload so the frontend can link to the actor's profile.

CREATE OR REPLACE FUNCTION public.broadcast_notification_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    actor_name   text;
    actor_pseudo text;
BEGIN
    SELECT
        COALESCE(
            NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''),
            u.pseudo
        ),
        u.pseudo
      INTO actor_name, actor_pseudo
      FROM public.users u
     WHERE u.id = NEW.follower_id;

    PERFORM realtime.send(
        jsonb_build_object('kind', 'follow', 'actor_name', actor_name, 'actor_pseudo', actor_pseudo),
        'notify',
        'notifications:' || NEW.followed_id::text,
        true
    );
    RETURN NULL;
END;
$$;
