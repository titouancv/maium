import { Suspense } from "react";
import { SettingsAccountContent } from "@/components/settings";

export default function SettingsAccountPage() {
  return (
    <Suspense>
      <SettingsAccountContent />
    </Suspense>
  );
}
