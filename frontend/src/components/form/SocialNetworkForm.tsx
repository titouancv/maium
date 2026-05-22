"use client";

import { useTranslations } from "next-intl";
import { SocialNetworkItem } from "../custom";
import { LinkListForm } from "./LinkListForm";

interface SocialNetworkFormProps {
  defaultValue?: string[];
  onChange: (socialNetworks: string[]) => void;
}

export const SocialNetworkForm = ({
  defaultValue,
  onChange,
}: SocialNetworkFormProps) => {
  const tCommon = useTranslations("common");
  return (
    <LinkListForm
      defaultValue={defaultValue}
      onChange={onChange}
      placeholder={tCommon("socialPlaceholder")}
      renderItem={(url) => <SocialNetworkItem url={url} />}
    />
  );
};
