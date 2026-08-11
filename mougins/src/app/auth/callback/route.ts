import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ROUTES } from "@/constants";
import { claimAnonSession } from "@/lib/auth/claimAnonSession";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Hand over anything they did signed out (their parsed CV fills the
        // profile, their analysis becomes permanent). Best-effort — it must
        // never cost them the sign-in — and it runs before the redirect so the
        // wizard already sees the imported profile.
        await claimAnonSession(user.id);

        const { data: profile } = await supabase
          .from("users")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();
        if (profile?.onboarding_completed) {
          return NextResponse.redirect(`${origin}${ROUTES.HOME}`);
        }
        return NextResponse.redirect(`${origin}${ROUTES.SIGNUP}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}${ROUTES.HOME}`);
}
