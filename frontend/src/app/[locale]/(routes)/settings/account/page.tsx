import { Suspense } from "react";
import { SettingsAccountContent } from "@/components/content/SettingsAccountContent";

export default function SettingsAccountPage() {
  return (
    <Suspense>
      <SettingsAccountContent />
    </Suspense>
  );
}
