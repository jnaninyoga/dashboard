"use server";

import { db } from "@/services/database";
import { userTokens } from "@/services/database/schema";

import { eq } from "drizzle-orm";

import { GOOGLE_UNAVAILABLE, REAUTH_REQUIRED } from "./errors";

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
	let storedToken;
	try {
		storedToken = await db.query.userTokens.findFirst({
			where: eq(userTokens.userId, userId),
		});
	} catch (error) {
		console.error("Couldn't read the stored Google token:", error);
		throw new Error(GOOGLE_UNAVAILABLE);
	}

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
		// Only a refused refresh token (revoked, or expired after 7 days while
		// the Google app is in testing) needs a new sign-in.
		const refused = response.status === 400 || response.status === 401;
		throw new Error(refused && errorText.includes("invalid_grant") ? REAUTH_REQUIRED : GOOGLE_UNAVAILABLE);
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
