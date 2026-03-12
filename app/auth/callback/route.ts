export const runtime = "edge";

import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { storeUserTokens } from "@/services/google-tokens";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

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
          console.error("Failed to store user tokens:", e);
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

