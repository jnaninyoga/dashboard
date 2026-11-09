import { hasAccess, NOT_ALLOWED } from "@/lib/auth/allowlist";
import { getSiteUrl } from "@/lib/utils/site-url";
import { db } from "@/services/database";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
	baseURL: getSiteUrl(),
	secret: process.env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: "pg", usePlural: true }),
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			scope: [
				"https://www.googleapis.com/auth/calendar",
				"https://www.googleapis.com/auth/contacts",
			],
			// Offline, with consent every time: Google only hands over the
			// refresh token (how the app reaches her calendar later) when asked.
			accessType: "offline",
			prompt: "select_account consent",
		},
	},
	databaseHooks: {
		user: {
			create: {
				// Someone not on the list never gets an account at all.
				before: async (user) => {
					if (!hasAccess(user)) {
						throw new APIError("FORBIDDEN", {
							code: NOT_ALLOWED,
							message: "This Google account doesn't have access.",
						});
					}
				},
			},
		},
	},
	onAPIError: { errorURL: "/login" },
	// Must stay last: it writes the cookies other plugins set.
	plugins: [nextCookies()],
});
