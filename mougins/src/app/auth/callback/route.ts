import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ANALYTICS_EVENTS, ROUTES } from "@/constants";
import { claimAnonSession } from "@/lib/auth/claimAnonSession";
import { trackServerEvent } from "@/lib/analytics.server";
import { safeInternalPath } from "@/lib/auth/safeInternalPath";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeInternalPath(searchParams.get("next"), origin);

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
        const claimed = await claimAnonSession(user.id);
        if (claimed) {
          await trackServerEvent(ANALYTICS_EVENTS.ANON_CLAIM_SUCCEEDED);
          if (next) return NextResponse.redirect(`${origin}${next}`);
        }

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
