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
