import { Suspense } from "react";
import { SettingsPersonalizationContent } from "@/components/pages/settings";

export default function SettingsPersonalizationPage() {
  return (
    <Suspense>
      <SettingsPersonalizationContent />
    </Suspense>
  );
}
