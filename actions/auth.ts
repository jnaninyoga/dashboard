"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/supabase/server";

export async function loginWithGoogle() {
	const supabase = await createClient();
	const headersList = await headers();
	const host = headersList.get("host");
	const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
	const redirectUrl = `${protocol}://${host}/auth/callback`;

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
