import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface DataUsageNoticeProps {
  className?: string;
}

/**
 * What Google hands us on sign-in, and where the privacy policy lives. Shared
 * because it follows the Google button around: inside the hero on the signup
 * wizard, and pinned to the foot of the page on the public landing.
 */
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
