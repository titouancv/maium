import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { Link } from "@/i18n/navigation";
import { Title, GoogleSignInButton } from "@/components/ui";

export const HeroSection = () => {
  const t = useTranslations("home");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      <div className="flex max-w-xl flex-col justify-start gap-8">
        <Title label={t("heroTitle")} size="h1" />
        <p>{t("appDescription")}</p>
        <GoogleSignInButton />
        <p className="text-txt-muted text-xs opacity-50">
          {t("dataUsagePrefix")}{" "}
          <Link
            href={ROUTES.PRIVACY_POLICY}
            className="underline underline-offset-2"
          >
            {t("privacyPolicyLink")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
};
