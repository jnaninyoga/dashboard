"use server";

import { redirect } from "next/navigation";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/supabase/server";

export async function loginWithGoogle() {
	const supabase = await createClient();
	const siteUrl = await getSiteUrl();
	const redirectUrl = `${siteUrl}/auth/callback`;

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			redirectTo: redirectUrl,
			scopes:
				"https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/contacts",
			queryParams: {
				access_type: "offline",
				prompt: "consent",
			},
		},
	});

	if (error) {
		console.error(error);
		redirect("/error");
	}

	if (data.url) {
		redirect(data.url);
	}
}

export async function signOut() {
	const supabase = await createClient();
	await supabase.auth.signOut();
	redirect("/login");
}
