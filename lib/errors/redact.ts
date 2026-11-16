/**
 * An error as the public endpoints may log it: what failed (its name, the
 * database's error code and constraint, the SQL with placeholders), never
 * the values a visitor sent. Drizzle puts a query's parameters in its
 * message, and Postgres repeats values in `detail`, so neither is kept.
 */
export function withoutVisitorData(error: unknown): {
	name: string;
	code?: string;
	constraint?: string;
	query?: string;
} {
	if (!(error instanceof Error)) return { name: "unknown" };
	const cause = (error as { cause?: unknown }).cause as { code?: unknown; constraint_name?: unknown } | undefined;
	const query = (error as { query?: unknown }).query;
	const code = cause?.code ?? (error as { code?: unknown }).code;
	return {
		name: error.name,
		...(typeof code === "string" ? { code } : {}),
		...(typeof cause?.constraint_name === "string" ? { constraint: cause.constraint_name } : {}),
		...(typeof query === "string" ? { query } : {}),
	};
}
