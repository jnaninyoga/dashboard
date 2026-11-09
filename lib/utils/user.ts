export type UserProfile = {
	fullName: string;
	firstName: string;
	initials: string;
	email: string;
	avatarUrl: string | null;
};

// The name and photo come from Google at sign-in. The email's local part is
// the last resort so the app never greets anyone with a placeholder.
export function getUserProfile(user: {
	name: string;
	email: string;
	image?: string | null;
}): UserProfile {
	const email = user.email;
	const fullName = user.name.trim() || email.split("@")[0];
	const words = fullName.split(/\s+/).filter(Boolean);

	return {
		fullName,
		firstName: words[0] ?? "",
		initials: words
			.slice(0, 2)
			.map((w) => w[0]?.toUpperCase())
			.join(""),
		email,
		avatarUrl: user.image || null,
	};
}
