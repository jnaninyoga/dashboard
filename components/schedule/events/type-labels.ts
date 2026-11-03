// The session types' names, in a plain module so server components can read
// them too: an object exported from a "use client" file (like TYPE_META) is
// only a reference on the server, and indexing it gives undefined.
export const TYPE_LABEL = {
	group: "Group Class",
	private: "Private",
	b2b: "B2B",
	outdoor: "Outdoor",
} as const;

/** A session type's name; "Session" for one this app doesn't know. */
export const typeLabel = (type: string): string => TYPE_LABEL[type as keyof typeof TYPE_LABEL] ?? "Session";
