import { Suspense } from "react";
import { SettingsNotificationsContent } from "@/components/pages/settings";

export default function SettingsNotificationsPage() {
  return (
    <Suspense>
      <SettingsNotificationsContent />
    </Suspense>
  );
}
