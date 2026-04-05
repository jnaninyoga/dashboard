import { type B2BPricingTier as B2BPricingTierSchema } from "@/drizzle/schema";

export type WorkingHoursConfig = Record<
	string,
	{ isOpen: boolean; start: string; end: string }
>;

export type B2BTier = B2BPricingTierSchema;
export type { NewB2BPricingTier as NewB2BTier } from "@/drizzle/schema";
