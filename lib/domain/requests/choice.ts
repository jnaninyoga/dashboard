// What a visitor picked, as the website wrote it ("Start To Align (1 500 Dh)"),
// read back into its parts so the dashboard can show the price as a price.

/** "Start To Align (1 500 Dh)" → the card's name and its price in dirhams; a choice with no price stays whole. */
export function splitChoice(label: string): { title: string; amount: number | null } {
	const match = /^(.*\S)\s*\(([\d\s.,  ]+)\s*Dh\)\s*$/i.exec(label);
	if (!match) return { title: label, amount: null };
	const amount = Number(match[2].replace(/\D/g, ""));
	return Number.isFinite(amount) && amount > 0 ? { title: match[1], amount } : { title: label, amount: null };
}

const EXCERPT = 80;

/** The start of a message on one line, for a card or a notification. */
export function messageExcerpt(message: string | null | undefined): string {
	const text = (message ?? "").replace(/\s+/g, " ").trim();
	return text.length > EXCERPT ? `${text.slice(0, EXCERPT)}…` : text;
}
