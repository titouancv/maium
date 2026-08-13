"use client";

import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { usePathname } from "@/i18n/navigation";
import { ROUTES } from "@/constants";
import { useCurrentUserStore } from "@/stores/useCurrentUserStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { activeConversationIdFrom } from "@/lib/messaging/conversationPath";

type NotifyPayload =
  | { kind: "follow"; actor_name: string | null; actor_pseudo: string | null }
  | { kind: "message"; actor_name: string | null; conversation_id: string };

export function NotificationsRealtime() {
  const t = useTranslations("notifications");
  const userId = useCurrentUserStore((s) => s.user?.id);
  const pathname = usePathname();

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

      switch (payload.kind) {
        case "follow":
          notify(
            payload.actor_name
              ? t("newFollower", { name: payload.actor_name })
              : t("newFollowerGeneric"),
            payload.actor_pseudo
              ? ROUTES.PROFILE(payload.actor_pseudo)
              : undefined,
          );
          return;

        case "message":
          if (payload.conversation_id === activeIdRef.current) return;
          notify(
            payload.actor_name
              ? t("newMessage", { name: payload.actor_name })
              : t("newMessageGeneric"),
            ROUTES.CONVERSATION(payload.conversation_id),
          );
          return;
      }
    };

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
