import {
	type clientWallets,
	type products,
} from "@/services/database/schema";

export type { ProductKind, ProductUnit } from "@/lib/domain/price-list/product";

/** On her price list: a membership card, or a service for partners. */
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ClientWallet = typeof clientWallets.$inferSelect;
export type NewClientWallet = typeof clientWallets.$inferInsert;
