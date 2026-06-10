"use client";

import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { usePathname } from "@/i18n/navigation";
import { ROUTES } from "@/constants";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { useNotificationStore } from "@/stores/useNotificationStore";

/** Payload broadcast by the `broadcast_user_notifications` DB triggers. */
type NotifyPayload =
  | { kind: "follow"; actor_name: string | null }
  | { kind: "message"; actor_name: string | null; conversation_id: string };

/** Extract the active conversation id from `/messages/<id>`, if any. */
function activeConversationIdFrom(pathname: string): string | undefined {
  const prefix = `${ROUTES.MESSAGES}/`;
  if (!pathname.startsWith(prefix)) return undefined;
  const rest = pathname.slice(prefix.length);
  return rest.length > 0 ? rest : undefined;
}

/**
 * Global toast notifications. Mounted once at the layout level (next to
 * [PresenceTracker]) so it surfaces events anywhere in the app: a new follower
 * or an incoming message pings the private `notifications:<userId>` channel
 * (see the `broadcast_user_notifications` migration), and we push a banner via
 * [useNotificationStore]. A message in the conversation the user is currently
 * viewing is skipped — they can already see it.
 */
export function NotificationsRealtime() {
  const t = useTranslations("notifications");
  const userId = useCurrentUserStore((s) => s.user?.id);
  const pathname = usePathname();

  // Read the active conversation and translator inside the Realtime callback
  // without re-subscribing on every navigation / render.
  const activeIdRef = useRef<string | undefined>(undefined);
  const tRef = useRef(t);
  useEffect(() => {
    activeIdRef.current = activeConversationIdFrom(pathname);
    tRef.current = t;
  });

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    let channel: RealtimeChannel | undefined;
    let cancelled = false;

    const handle = (payload: NotifyPayload) => {
      const { notify } = useNotificationStore.getState();
      const t = tRef.current;

      if (payload.kind === "follow") {
        notify(
          payload.actor_name
            ? t("newFollower", { name: payload.actor_name })
            : t("newFollowerGeneric"),
          "success",
        );
        return;
      }

      // Already looking at this conversation → nothing to surface.
      if (payload.conversation_id === activeIdRef.current) return;

      notify(
        payload.actor_name
          ? t("newMessage", { name: payload.actor_name })
          : t("newMessageGeneric"),
        "info",
      );
    };

    // Private channels are gated by RLS on realtime.messages, so the socket must
    // carry the user's access token before subscribing.
    (async () => {
      await supabase.realtime.setAuth();
      if (cancelled) return;
      channel = supabase
        .channel(`notifications:${userId}`, { config: { private: true } })
        .on("broadcast", { event: "notify" }, ({ payload }) =>
          handle(payload as NotifyPayload),
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId]);

  return null;
}
