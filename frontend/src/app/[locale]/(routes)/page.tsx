import { createClient } from "@/lib/supabase/server";
import { HomeContent } from "@/components/home/HomeContent";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let userData = null;
  if (authUser) {
    const { data } = await supabase
      .from("users")
      .select("email, first_name, last_name, pseudo, dob")
      .eq("id", authUser.id)
      .single();
    userData = data;
  }

  return <HomeContent user={userData} />;
}
