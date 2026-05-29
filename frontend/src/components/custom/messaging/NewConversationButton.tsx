"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import { ROUTES, API } from "@/constants";
import { Button } from "@/components/ui/Button";
import { SearchOverlay } from "@/components/overlay/SearchOverlay";

export function NewConversationButton() {
  const t = useTranslations("messaging");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleClose = () => setOpen(false);

  const handleSelect = async (pseudo: string) => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch(API.MESSAGES_CONVERSATIONS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPseudo: pseudo }),
      });

      if (res.ok) {
        const { conversationId } = await res.json();
        setOpen(false);
        router.push(ROUTES.CONVERSATION(conversationId));
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        {t("newConversation")}
      </Button>

      <AnimatePresence>
        {open && (
          <SearchOverlay
            onClose={handleClose}
            onSelect={handleSelect}
          />
        )}
      </AnimatePresence>
    </>
  );
}
