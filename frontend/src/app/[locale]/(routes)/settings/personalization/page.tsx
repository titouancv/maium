import { Suspense } from "react";
import { SettingsPersonalizationContent } from "@/components/content/SettingsPersonalizationContent";

export default function SettingsPersonalizationPage() {
  return (
    <Suspense>
      <SettingsPersonalizationContent />
    </Suspense>
  );
}
