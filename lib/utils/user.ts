import type { User } from "@supabase/supabase-js";

export type UserProfile = {
	fullName: string;
	firstName: string;
	initials: string;
	email: string;
	avatarUrl: string | null;
};

// Google sign-in stores the profile in user_metadata (full_name / name,
// avatar_url / picture). The email's local part is the last resort so the
// app never greets anyone with a placeholder.
export function getUserProfile(user: User): UserProfile {
	const meta = user.user_metadata ?? {};
	const email = user.email ?? "";
	const fullName =
		String(meta.full_name || meta.name || "").trim() || email.split("@")[0];
	const words = fullName.split(/\s+/).filter(Boolean);

	return {
		fullName,
		firstName: words[0] ?? "",
		initials: words
			.slice(0, 2)
			.map((w) => w[0]?.toUpperCase())
			.join(""),
		email,
		avatarUrl: meta.avatar_url || meta.picture || null,
	};
}
