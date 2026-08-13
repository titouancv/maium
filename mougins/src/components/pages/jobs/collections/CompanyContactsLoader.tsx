import { getCompanyContacts } from "@/lib/jobs/contacts";
import type { AnalysisListItem } from "@/types/job";
import { CompanyContactList } from "./CompanyContactList";

interface CompanyContactsLoaderProps {
  analysisPromise: Promise<AnalysisListItem | null>;
}

export async function CompanyContactsLoader({
  analysisPromise,
}: CompanyContactsLoaderProps) {
  const analysis = await analysisPromise;
  const company = analysis?.job?.company;
  if (!company) return null;

  const contacts = await getCompanyContacts(company);
  return <CompanyContactList contacts={contacts} company={company} />;
}
