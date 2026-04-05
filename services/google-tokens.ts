"use server";

import { db } from "@/drizzle";
import { userTokens } from "@/drizzle/schema";

import { eq } from "drizzle-orm";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

export async function storeUserTokens(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
) {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  await db.insert(userTokens).values({
    userId,
    accessToken,
    refreshToken,
    expiresAt,
  }).onConflictDoUpdate({
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
  try {
    const storedToken = await db.query.userTokens.findFirst({
      where: eq(userTokens.userId, userId),
    });

    if (!storedToken) {
      console.error("No stored tokens found in database for user:", userId);
      throw new Error("REAUTH_REQUIRED");
    }

    // Check if access token is still valid (with 5 minute buffer)
    if (storedToken.expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
      return storedToken.accessToken;
    }

    // Refresh the token
    const response = await fetch(GOOGLE_TOKEN_URL, {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google API Token Refresh Failed: ${errorText}`);
      throw new Error("REAUTH_REQUIRED");
    }

    const data: TokenResponse = await response.json();

    // Update the stored access token
    await storeUserTokens(
      userId,
      data.access_token,
      storedToken.refreshToken, // Reuse existing refresh token
      data.expires_in
    );

    return data.access_token;
  } catch (error) {
    console.error("Error in getValidAccessToken:", error);
    if (error instanceof Error && error.message === "REAUTH_REQUIRED") {
      throw error;
    }
    // For other errors, we also might want to force reauth if it's critical,
    // but let's stick to the plan: if we can't get a token, it's a reauth case or system error.
    // If it's a system error (db down), we might not want to redirect to login immediately,
    // but for "stability" and strictness, failing to get a token generally means we can't do the action.
    // However, to be safe and precise:
    throw new Error("REAUTH_REQUIRED");
  }
}
