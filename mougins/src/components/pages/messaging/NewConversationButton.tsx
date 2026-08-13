"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { SearchOverlay } from "@/components/ui";
import { useStartConversation } from "@/hooks";

export function NewConversationButton() {
  const t = useTranslations("messaging");
  const [open, setOpen] = useState(false);
  const { start } = useStartConversation();

  const handleClose = () => setOpen(false);

  const handleSelect = async (pseudo: string) => {
    if (await start(pseudo)) setOpen(false);
  };

  return (
    <>
      <Button
        variant="primary"
        size="md"
        onClick={() => setOpen(true)}
        className="w-full"
      >
        {t("newConversation")}
      </Button>

      <AnimatePresence>
        {open && (
          <SearchOverlay onClose={handleClose} onSelect={handleSelect} />
        )}
      </AnimatePresence>
    </>
  );
}
