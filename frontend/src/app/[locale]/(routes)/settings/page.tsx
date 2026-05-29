import { Suspense } from "react";
import { SettingsContent } from "@/components/settings";

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
