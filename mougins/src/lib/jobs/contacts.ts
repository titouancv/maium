import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

export async function getCompanyContactsCount(
  company: string | null | undefined,
): Promise<number> {
  if (!company?.trim()) return 0;

  const admin = createAdminClient();
  const { data } = await admin.rpc("count_company_contacts", {
    p_company: company,
  });

  return typeof data === "number" ? data : 0;
}
