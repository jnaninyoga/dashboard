import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/services/supabase/server";

/**
 * The signed-in user. Every server action calls this first: an action is a
 * POST endpoint reachable from any route, and the proxy only guards pages.
 * Without a session it goes to the login page, so a session that expired
 * mid-use lands on sign-in rather than an error. Cached per request, so a
 * page calling several actions checks the session once.
 */
export const requireUser = cache(async () => {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/login");
	return user;
});
