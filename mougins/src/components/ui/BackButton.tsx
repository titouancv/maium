"use client";

import { ROUTES } from "@/constants";
import { useRouter } from "@/i18n/navigation";
import { Button } from "./Button";

interface BackButtonProps {
  label: string;
  onBack?: () => void;
}

export function BackButton({ label, onBack }: BackButtonProps) {
  const router = useRouter();
  const handleBack =
    onBack ??
    (() => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push(ROUTES.HOME);
      }
    });

  return (
    <Button variant="ghost" type="button" size="none" onClick={handleBack}>
      {label}
    </Button>
  );
}
