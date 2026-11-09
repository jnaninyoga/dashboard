"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { logServerError } from "@/lib/errors/server";

export async function loginWithGoogle() {
	let url: string | undefined;
	try {
		const result = await auth.api.signInSocial({
			body: { provider: "google", callbackURL: "/", errorCallbackURL: "/login" },
		});
		url = result.url;
	} catch (error) {
		redirect(`/login?error=auth&ref=${logServerError("Couldn't start Google sign-in", error)}`);
	}

	redirect(url ?? "/login?error=auth");
}

export async function signOut() {
	await auth.api.signOut({ headers: await headers() });
	redirect("/login");
}
