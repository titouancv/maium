import { Suspense } from "react";
import { SettingsContent } from "@/components/pages/settings";

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
