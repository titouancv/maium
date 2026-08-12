import { useTranslations } from "next-intl";
import { ROUTES } from "@/constants";
import { Link } from "@/i18n/navigation";
import {
  Title,
  Button,
  GoogleSignInButton,
  DataUsageNotice,
} from "@/components/ui";

/** The pitch: the three steps of an analysis, told from the visitor's side. */
const WORKFLOW_STEPS = [1, 2, 3] as const;

interface HeroSectionProps {
  /**
   * `landing` (public home) leads with the free AI analysis and keeps signing
   * in as the secondary action. `signup` (wizard step 0) drops that CTA — the
   * visitor already chose to create an account.
   */
  variant?: "landing" | "signup";
}

export const HeroSection = ({ variant = "signup" }: HeroSectionProps) => {
  const t = useTranslations("home");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      <div className="flex max-w-xl flex-col justify-start gap-8">
        <div className="flex flex-col gap-3">
          <Title label={t("heroTitle")} size="h1" />
          <p className="text-txt-muted">{t("heroSubtitle")}</p>
        </div>

        <ol className="flex flex-col gap-3">
          {WORKFLOW_STEPS.map((n) => (
            <li key={n} className="flex items-start gap-2">
              <p className="text-primary w-8 shrink-0 text-center text-4xl font-extrabold">
                {n}
              </p>
              <p>{t(`feature${n}`)}</p>
            </li>
          ))}
        </ol>

        {variant === "landing" ? (
          // Both entries sit on one row: running an analysis and signing back
          // in are two ways into the product, not an action and its footnote.
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={ROUTES.ANALYZE} className="sm:flex-1">
              <Button
                variant="primary"
                size="lg"
                className="w-full whitespace-nowrap"
              >
                {t("heroCta")}
              </Button>
            </Link>
            <GoogleSignInButton className="sm:flex-1" />
          </div>
        ) : (
          <GoogleSignInButton />
        )}

        {/* The landing page shows this at the foot of the page instead. */}
        {variant === "signup" && <DataUsageNotice />}
      </div>
    </div>
  );
};
