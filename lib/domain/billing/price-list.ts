// Her price list as suggestions while she writes a line: what matches the
// words typed so far (accents and capitals don't matter), each price once.

/** A name as it's compared: accents, capitals and outer spaces don't count. */
export const fold = (text: string) =>
	text
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.trim();

export function suggestPrices<T extends { name: string; price: number | string }>(tiers: T[], typed: string): T[] {
	const query = fold(typed);
	const seen = new Set<string>();
	const unique = tiers.filter((tier) => {
		const key = `${fold(tier.name)}|${Number(tier.price)}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
	// A line already written in full needs no suggestion.
	if (query && unique.some((tier) => fold(tier.name) === query)) return [];
	return query ? unique.filter((tier) => fold(tier.name).includes(query)) : unique;
}
