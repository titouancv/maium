import { Suspense } from "react";
import { PrivacyPolicyContent } from "@/components/pages/privacy-policy";

export default function PrivacyPolicyPage() {
  return (
    <Suspense>
      <PrivacyPolicyContent />
    </Suspense>
  );
}
