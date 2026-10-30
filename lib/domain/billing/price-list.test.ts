import { describe, expect, it } from "vitest";

import { suggestPrices } from "./price-list";

const tier = (id: string, name: string, price: number) => ({ id, name, price });

describe("suggestPrices", () => {
	const tiers = [
		tier("a", "Famille (3-5 pax)", 450),
		tier("b", "Famille (3-5 pax)", 450),
		tier("c", "Séance privée", 600),
		tier("d", "Groupe hôtel", 300),
	];

	it("lists each price once, even when her price list repeats it", () => {
		expect(suggestPrices(tiers, "").map((t) => t.id)).toEqual(["a", "c", "d"]);
	});

	it("matches what she types, without minding accents or capitals", () => {
		expect(suggestPrices(tiers, "seance").map((t) => t.id)).toEqual(["c"]);
		expect(suggestPrices(tiers, "HOTEL").map((t) => t.id)).toEqual(["d"]);
		expect(suggestPrices(tiers, "yoga nidra")).toEqual([]);
	});

	it("doesn't suggest what's already written in full", () => {
		expect(suggestPrices(tiers, "Groupe hôtel")).toEqual([]);
	});
});
