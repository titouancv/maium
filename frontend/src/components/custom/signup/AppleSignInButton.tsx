"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants";

export const AppleSignInButton = () => {
  const t = useTranslations("auth.signup.oauth");
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    const supabase = createBrowserClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: `${window.location.origin}${ROUTES.AUTH_CALLBACK}?next=${ROUTES.SIGNUP}`,
      },
    });
    if (authError) {
      setError(
        authError.message.includes("already")
          ? t("errorEmailExists")
          : t("errorGeneric")
      );
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="inverse"
        size="lg"
        className="w-full gap-3"
        onClick={handleSignIn}
      >
        <svg width="16" height="18" viewBox="0 0 814 1000" aria-hidden="true" fill="currentColor">
          <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46.7 790 0 683.5 0 581c0-181.7 119.1-278 236.4-278 63.9 0 116.9 42.4 156.8 42.4 37.7 0 97.2-45 168.6-45 27.3 0 109.5 2.6 168.6 90.5zM530 35.5C557.7-.6 578.4-1.1 578.4-1.1c1.2 0 2.2.2 3 .5 2.5 6.2 3.3 24.2 3.3 32 0 83-72.5 158.1-137.5 158.1-3.9 0-7.7-.3-11.4-.8-2.3-6.3-3.3-13-3.3-19.8 0-68.5 55.7-144 97.5-173.4z" />
        </svg>
        {t("appleButton")}
      </Button>
      {error && <p className="text-error text-sm">{error}</p>}
    </div>
  );
};
