import { db } from "@/services/database";
import { userTokens } from "@/services/database/schema";

import { eq } from "drizzle-orm";

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

export async function storeUserTokens(
	userId: string,
	accessToken: string,
	refreshToken: string,
	expiresIn: number,
) {
	const expiresAt = new Date(Date.now() + expiresIn * 1000);

	await db
		.insert(userTokens)
		.values({
			userId,
			accessToken,
			refreshToken,
			expiresAt,
		})
		.onConflictDoUpdate({
			target: userTokens.userId,
			set: {
				accessToken,
				refreshToken,
				expiresAt,
				updatedAt: new Date(),
			},
		});
}

export async function getValidAccessToken(userId: string): Promise<string> {
	// A database failure here is ours, not Google's: let it surface as one.
	const storedToken = await db.query.userTokens.findFirst({
		where: eq(userTokens.userId, userId),
	});

	if (!storedToken) {
		console.error("No stored tokens found in database for user:", userId);
		throw new Error(REAUTH_REQUIRED);
	}

	// Check if access token is still valid (with 5 minute buffer)
	if (storedToken.expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
		return storedToken.accessToken;
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
				refresh_token: storedToken.refreshToken,
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
	await storeUserTokens(
		userId,
		data.access_token,
		storedToken.refreshToken, // Reuse existing refresh token
		data.expires_in,
	).catch((error) => console.error("Couldn't store the refreshed Google token:", error));

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
