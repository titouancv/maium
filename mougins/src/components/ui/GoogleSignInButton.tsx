"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { InfoMessage } from "@/components/ui/InfoMessage";
import { GoogleMark } from "@/components/ui/icons";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

interface GoogleSignInButtonProps {
  /** Applied to the wrapper, so a caller can size it inside a row of CTAs. */
  className?: string;
}

export const GoogleSignInButton = ({ className }: GoogleSignInButtonProps) => {
  const t = useTranslations("auth.signup.oauth");
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    const supabase = createBrowserClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${ROUTES.AUTH_CALLBACK}?next=${ROUTES.SIGNUP}`,
      },
    });
    if (authError) {
      setError(
        authError.message.includes("already")
          ? t("errorEmailExists")
          : t("errorGeneric"),
      );
    }
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full gap-3"
        onClick={handleSignIn}
      >
        <GoogleMark />
        {t("googleButton")}
      </Button>
      <InfoMessage message={error} />
    </div>
  );
};
