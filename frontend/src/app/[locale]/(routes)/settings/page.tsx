import { Suspense } from "react";
import { SettingsContent } from "@/components/content/SettingsContent";

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
