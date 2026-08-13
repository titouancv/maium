import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface DataUsageNoticeProps {
  className?: string;
}

export const DataUsageNotice = ({ className }: DataUsageNoticeProps) => {
  const t = useTranslations("home");

  return (
    <p className={cn("text-txt-muted text-xs opacity-50", className)}>
      {t("dataUsagePrefix")}{" "}
      <Link
        href={ROUTES.PRIVACY_POLICY}
        className="underline underline-offset-2"
      >
        {t("privacyPolicyLink")}
      </Link>
      .
    </p>
  );
};
