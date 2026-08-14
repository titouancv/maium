"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { InfoMessage } from "@/components/ui/InfoMessage";
import { GoogleMark } from "@/components/ui/icons";
import { ANALYTICS_EVENTS, ROUTES, type SigninSource } from "@/constants";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface GoogleSignInButtonProps {
  className?: string;
  next?: string;
  source?: SigninSource;
}

export const GoogleSignInButton = ({
  className,
  next,
  source,
}: GoogleSignInButtonProps) => {
  const t = useTranslations("auth.signup.oauth");
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    if (source) {
      trackEvent(ANALYTICS_EVENTS.ANON_SIGNIN_CLICKED, { source });
    }
    const callback = new URL(
      ROUTES.AUTH_CALLBACK,
      window.location.origin,
    );
    if (next) callback.searchParams.set("next", next);

    const supabase = createBrowserClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
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
