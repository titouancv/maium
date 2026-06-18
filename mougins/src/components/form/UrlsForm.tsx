"use client";

import { useTranslations } from "next-intl";
import { UrlItem } from "@/components/ui";
import { LinkListForm } from "./LinkListForm";

interface UrlsFormProps {
  defaultValue?: string[];
  onChange: (urls: string[]) => void;
}

export const UrlsForm = ({ defaultValue, onChange }: UrlsFormProps) => {
  const tCommon = useTranslations("common");
  return (
    <LinkListForm
      defaultValue={defaultValue}
      onChange={onChange}
      placeholder={tCommon("urlPlaceholder")}
      renderItem={(url) => <UrlItem url={url} />}
    />
  );
};
