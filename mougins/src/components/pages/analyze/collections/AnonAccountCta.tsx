"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { type SigninSource } from "@/constants";
import { Button, Overlay } from "@/components/ui";
import { PageLayout } from "@/components/layout";
import { AnonAccountBenefits } from "./AnonAccountBenefits";

interface AnonAccountCtaProps {
  label: string;
  source: SigninSource;
  analysisId?: string;
}

export function AnonAccountCta({
  label,
  source,
  analysisId,
}: AnonAccountCtaProps) {
  const t = useTranslations("analyze.account");
  const tCommon = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);

  const close = () => setIsOpen(false);

  return (
    <>
      <div className="flex">
        <Button onClick={() => setIsOpen(true)}>{label}</Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <Overlay onClose={close}>
            <PageLayout
              title={t("title")}
              backLabel={tCommon("closeButton")}
              onBack={close}
            >
              <div className="flex w-full max-w-2xl flex-col">
                <AnonAccountBenefits
                  description={t("description")}
                  source={source}
                  analysisId={analysisId}
                />
              </div>
            </PageLayout>
          </Overlay>
        )}
      </AnimatePresence>
    </>
  );
}
