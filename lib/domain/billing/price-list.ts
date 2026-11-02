// Her price list as suggestions while she writes a line: what matches the
// words typed so far (accents and capitals don't matter), each price once.

/** A name as it's compared: accents, capitals and outer spaces don't count. */
export const fold = (text: string) =>
	text
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.trim();

/** Her prices as they read on a line ("Famille (3–5 pax)"), matching what's typed. */
export function suggestPrices<T extends { label: string; price: number | string }>(options: T[], typed: string): T[] {
	const query = fold(typed);
	const seen = new Set<string>();
	const unique = options.filter((option) => {
		const key = `${fold(option.label)}|${Number(option.price)}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
	// A line already written in full needs no suggestion.
	if (query && unique.some((option) => fold(option.label) === query)) return [];
	return query ? unique.filter((option) => fold(option.label).includes(query)) : unique;
}
