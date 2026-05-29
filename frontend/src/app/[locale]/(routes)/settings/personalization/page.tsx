import { Suspense } from "react";
import { SettingsPersonalizationContent } from "@/components/settings";

export default function SettingsPersonalizationPage() {
  return (
    <Suspense>
      <SettingsPersonalizationContent />
    </Suspense>
  );
}
