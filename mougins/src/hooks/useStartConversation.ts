"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { API, ROUTES } from "@/constants";

export function useStartConversation() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const start = async (targetPseudo: string) => {
    if (isStarting) return false;
    setIsStarting(true);
    try {
      const res = await fetch(API.MESSAGES_CONVERSATIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPseudo }),
      });
      if (!res.ok) return false;

      const { conversationId } = await res.json();
      router.push(ROUTES.CONVERSATION(conversationId));
      return true;
    } finally {
      setIsStarting(false);
    }
  };

  return { start, isStarting };
}
