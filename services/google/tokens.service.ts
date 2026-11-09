import { db } from "@/services/database";
import { accounts } from "@/services/database/schema";

import { and, eq } from "drizzle-orm";

import {
	classifyRefreshFailure,
	GOOGLE_UNAVAILABLE,
	googleErrorMessage,
	isGoogleAccessError,
	REAUTH_REQUIRED,
} from "./errors";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

interface TokenResponse {
	access_token: string;
	expires_in: number;
}

export async function getValidAccessToken(userId: string): Promise<string> {
	// A database failure here is ours, not Google's: let it surface as one.
	const account = await db.query.accounts.findFirst({
		where: and(eq(accounts.userId, userId), eq(accounts.providerId, "google")),
	});

	if (!account?.accessToken || !account.refreshToken) {
		console.error("No stored Google tokens for user:", userId);
		throw new Error(REAUTH_REQUIRED);
	}

	// Check if access token is still valid (with 5 minute buffer)
	if (account.accessTokenExpiresAt && account.accessTokenExpiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
		return account.accessToken;
	}

	// Refresh the token
	let response: Response;
	try {
		response = await fetch(GOOGLE_TOKEN_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_id: process.env.GOOGLE_CLIENT_ID!,
				client_secret: process.env.GOOGLE_CLIENT_SECRET!,
				refresh_token: account.refreshToken,
				grant_type: "refresh_token",
			}),
		});
	} catch (error) {
		console.error("Google token endpoint unreachable:", error);
		throw new Error(GOOGLE_UNAVAILABLE);
	}

	if (!response.ok) {
		const errorText = await response.text().catch(() => "");
		console.error(`Google API Token Refresh Failed (${response.status}): ${errorText}`);
		throw new Error(classifyRefreshFailure(response.status, errorText));
	}

	const data: TokenResponse = await response.json();

	// A failed write only means refreshing again next time; the token is good.
	await db
		.update(accounts)
		.set({
			accessToken: data.access_token,
			accessTokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
		})
		.where(eq(accounts.id, account.id))
		.catch((error) => console.error("Couldn't store the refreshed Google token:", error));

	return data.access_token;
}

export type GoogleResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

/**
 * Runs a Google call for this user and reports Google's failures (expired
 * connection, outage) as a message the page can show. Failures that are not
 * Google's, such as the database being down, are thrown to the error screen.
 */
export async function withGoogle<T>(
	userId: string,
	service: string,
	call: (accessToken: string) => Promise<T>,
): Promise<GoogleResult<T>> {
	let accessToken: string;
	try {
		accessToken = await getValidAccessToken(userId);
	} catch (error) {
		if (isGoogleAccessError(error)) return { error: googleErrorMessage(error, service) };
		throw error;
	}
	try {
		return { data: await call(accessToken) };
	} catch (error) {
		console.error(`${service} call failed:`, error);
		return { error: googleErrorMessage(error, service) };
	}
}
