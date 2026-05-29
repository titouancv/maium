import { Suspense } from "react";
import { PrivacyPolicyContent } from "@/components/privacy-policy";

export default function PrivacyPolicyPage() {
  return (
    <Suspense>
      <PrivacyPolicyContent />
    </Suspense>
  );
}
