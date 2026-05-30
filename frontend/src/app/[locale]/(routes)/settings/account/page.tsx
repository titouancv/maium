import { Suspense } from "react";
import { SettingsAccountContent } from "@/components/pages/settings";

export default function SettingsAccountPage() {
  return (
    <Suspense>
      <SettingsAccountContent />
    </Suspense>
  );
}
