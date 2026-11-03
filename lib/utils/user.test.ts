import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { getUserProfile } from "./user";

const user = (meta: Record<string, string>, email = "someone@example.com") =>
	({ user_metadata: meta, email }) as unknown as User;

describe("getUserProfile", () => {
	it("greets by the first word of the Google name", () => {
		expect(getUserProfile(user({ full_name: "Demo Whybe", avatar_url: "https://a/p.png" }))).toMatchObject({
			fullName: "Demo Whybe",
			firstName: "Demo",
			initials: "DW",
			avatarUrl: "https://a/p.png",
		});
	});

	it("falls back to 'name' and 'picture', and tolerates extra spaces", () => {
		const profile = getUserProfile(user({ name: "  Salma   Bennani ", picture: "https://g/pic" }));
		expect(profile.firstName).toBe("Salma");
		expect(profile.avatarUrl).toBe("https://g/pic");
	});

	it("uses the email's local part when the profile has no name", () => {
		const profile = getUserProfile(user({}, "studio.owner@gmail.com"));
		expect(profile.firstName).toBe("studio.owner");
		expect(profile.avatarUrl).toBeNull();
		expect(profile.initials).toBe("S");
	});
});
