import { Suspense } from "react";
import { SettingsPersonalDataContent } from "@/components/settings";
import { getCurrentUserProfile } from "@/lib/auth/getCurrentUser";

export default async function SettingsPersonalDataPage() {
  const userData = await getCurrentUserProfile();

  return (
    <Suspense>
      <SettingsPersonalDataContent user={userData} />
    </Suspense>
  );
}
