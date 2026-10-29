import { NextResponse } from "next/server";

import { logServerError } from "@/lib/errors/server";
import { getSiteUrl } from "@/lib/utils/site-url";
import { storeUserTokens } from "@/services/google";
import { createClient } from "@/services/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  // Where to go after signing in: only a path inside the app ("/clients"),
  // never another site ("//x", "@x", "https://x").
  const requested = searchParams.get("next") ?? "/";
  const next = /^\/(?![\/\\])/.test(requested) ? requested : "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.session) {
      // Store tokens manually for reliability
      // We do this because Supabase identities table sometimes misses the refresh token
      // or we want explicit control over persistent access
      const session = data.session;
      if (session.provider_token && session.provider_refresh_token) {
        try {
          await storeUserTokens(
            session.user.id,
            session.provider_token,
            session.provider_refresh_token,
            session.expires_in || 3600
          );
        } catch (e) {
          // Without the saved connection the dashboard can't reach Google, so
          // this is not a finished sign-in: say so on the login page.
          const ref = logServerError("Failed to store Google tokens", e);
          const siteUrl = await getSiteUrl();
          return NextResponse.redirect(`${siteUrl}/login?error=connection&ref=${ref}`);
        }
      }

      const siteUrl = await getSiteUrl();
      return NextResponse.redirect(`${siteUrl}${next}`);
    }
  }

  // Back to the login page, which explains the sign-in didn't complete
  const siteUrl = await getSiteUrl();
  return NextResponse.redirect(`${siteUrl}/login?error=auth`);
}

