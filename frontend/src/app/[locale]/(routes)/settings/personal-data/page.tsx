import { Suspense } from "react";
import { SettingsPersonalDataContent } from "@/components/content/SettingsPersonalDataContent";
import { getCurrentUserProfile } from "@/lib/auth/getCurrentUser";

export default async function SettingsPersonalDataPage() {
  const userData = await getCurrentUserProfile();

  return (
    <Suspense>
      <SettingsPersonalDataContent user={userData} />
    </Suspense>
  );
}
