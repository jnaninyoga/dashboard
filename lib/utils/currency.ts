/**
 * Parses a typed amount in either French ("1 000,50") or English ("1,000.50")
 * notation. When both separators appear, the last one is the decimal mark;
 * a lone comma is always a decimal mark. Returns NaN for anything else.
 */
export function parseAmountInput(input: string | number | null | undefined): number {
	if (typeof input === "number") return input;
	if (!input) return NaN;
	let s = input.replace(/[\s  ]/g, "");
	const lastComma = s.lastIndexOf(",");
	const lastDot = s.lastIndexOf(".");
	if (lastComma > -1 && lastDot > -1) {
		const thousands = lastComma > lastDot ? "." : ",";
		s = s.split(thousands).join("");
	}
	s = s.replace(",", ".");
	return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
}

/** The studio's currency, by its ISO code: every price is in it. */
export const CURRENCY = "MAD";

const money = new Intl.NumberFormat("fr-FR", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

/**
 * "1 234,50": an amount alone, in the studio's way (French grouping, two
 * decimals). The groups are held by non-breaking spaces, so an amount never
 * wraps in the middle. Every price goes through here, on screen and on paper.
 */
export function formatAmount(amount: number | string): string {
	return money.format(Number(amount)).replace(/\u202F/g, "\u00A0");
}

/** "1 234,50 MAD": a price in words (toasts, messages, labels). On screen, use <Money>. */
export function formatMoney(amount: number | string): string {
	return `${formatAmount(amount)}\u00A0${CURRENCY}`;
}

/**
 * Live filter for decimal text fields: digits and decimal marks only, with a
 * comma (French keyboards: "500,50") read as the decimal mark. It used to be
 * stripped, which silently turned 500,50 into 50050.
 */
export function normalizeDecimalInput(raw: string): string {
	return raw.replace(/,/g, ".").replace(/[^0-9.]/g, "");
}

export function numberToWordsFR(n: number): string {
    const units = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
    const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingts", "quatre-vingt-dix"];
    
    if (n < 0) return "moins " + numberToWordsFR(-n);
    if (n < 20) return units[n];
    if (n < 70) {
        return tens[Math.floor(n / 10)] + (n % 10 === 0 ? "" : (n % 10 === 1 ? " et un" : "-" + units[n % 10]));
    }
    if (n < 80) {
        return "soixante" + (n % 10 === 0 ? "-dix" : (n % 10 === 1 ? " et onze" : "-" + units[10 + n % 10]));
    }
    if (n < 90) {
        return "quatre-vingt" + (n % 10 === 0 ? "s" : "-" + units[n % 10]);
    }
    if (n < 100) {
        return "quatre-vingt-" + units[10 + n % 10];
    }
    if (n < 1000) {
        return (Math.floor(n / 100) === 1 ? "" : units[Math.floor(n / 100)] + " ") + "cent" + (n % 100 === 0 ? "" : " " + numberToWordsFR(n % 100));
    }
    if (n < 1000000) {
        return (Math.floor(n / 1000) === 1 ? "" : numberToWordsFR(Math.floor(n / 1000)) + " ") + "mille" + (n % 1000 === 0 ? "" : " " + numberToWordsFR(n % 1000));
    }
    // Simplification for standard invoice amounts up to millions
    return n.toString();
}

export function formatCurrencyAmountToWords(amount: number, currencyName = "Dirhams"): string {
    const whole = Math.floor(amount);
    const decimal = Math.round((amount - whole) * 100);
    
    let res = numberToWordsFR(whole) + " " + currencyName;
    if (decimal > 0) {
        res += " et " + numberToWordsFR(decimal) + " centimes";
    }
    
    // Capitalize first letter
    return res.charAt(0).toUpperCase() + res.slice(1);
}
