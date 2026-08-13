import { createClient } from "@/lib/supabase/server";
import { COMPANY_CONTACTS_LIMIT } from "@/constants";
import type { CompanyContact } from "@/types/job";

export async function getCompanyContacts(
  company: string | null | undefined,
): Promise<CompanyContact[]> {
  if (!company?.trim()) return [];

  const supabase = await createClient();
  const { data } = await supabase.rpc("get_company_contacts", {
    p_company: company,
    p_limit: COMPANY_CONTACTS_LIMIT,
  });

  return (data as CompanyContact[]) ?? [];
}
