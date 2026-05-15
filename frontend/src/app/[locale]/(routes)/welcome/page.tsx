import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WelcomeContent } from "@/components/content/WelcomeContent";
import { ROUTES } from "@/constants";

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect(ROUTES.HOME);
  }

  const { data } = await supabase
    .from("users")
    .select(
      "email, first_name, last_name, pseudo, dob, professional_experiences, educational_experiences",
    )
    .eq("id", authUser.id)
    .single();

  if (!data) {
    redirect(ROUTES.HOME);
  }

  return (
    <WelcomeContent
      firstName={data.first_name}
      lastName={data.last_name}
      pseudo={data.pseudo}
      dob={data.dob}
      email={data.email}
      professionalExperiences={data.professional_experiences ?? []}
      educationalExperiences={data.educational_experiences ?? []}
    />
  );
}
