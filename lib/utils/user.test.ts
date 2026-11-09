import { describe, expect, it } from "vitest";

import { getUserProfile } from "./user";

const user = (name: string, image: string | null = null, email = "someone@example.com") => ({ name, image, email });

describe("getUserProfile", () => {
	it("greets by the first word of the Google name", () => {
		expect(getUserProfile(user("Demo Whybe", "https://a/p.png"))).toMatchObject({
			fullName: "Demo Whybe",
			firstName: "Demo",
			initials: "DW",
			avatarUrl: "https://a/p.png",
		});
	});

	it("tolerates extra spaces in the name", () => {
		const profile = getUserProfile(user("  Salma   Bennani "));
		expect(profile.firstName).toBe("Salma");
		expect(profile.initials).toBe("SB");
	});

	it("uses the email's local part when the profile has no name", () => {
		const profile = getUserProfile(user("", null, "studio.owner@gmail.com"));
		expect(profile.firstName).toBe("studio.owner");
		expect(profile.avatarUrl).toBeNull();
		expect(profile.initials).toBe("S");
	});
});
