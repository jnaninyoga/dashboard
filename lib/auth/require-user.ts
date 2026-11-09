import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { hasAccess, NOT_ALLOWED } from "@/lib/auth/allowlist";
import { auth } from "@/lib/auth/auth";

/**
 * The signed-in user. Every server action calls this first: an action is a
 * POST endpoint reachable from any route, and the proxy only guards pages.
 * Without a session it goes to the login page, so a session that expired
 * mid-use lands on sign-in rather than an error, and someone taken off the
 * allowed list is turned away on their next request. Cached per request, so
 * a page calling several actions checks the session once.
 */
export const requireUser = cache(async () => {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) redirect("/login");
	if (!hasAccess(session.user)) redirect(`/login?error=${NOT_ALLOWED}`);
	return session.user;
});
