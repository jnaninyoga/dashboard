import {
	type clientWallets,
	type membershipProducts,
} from "@/drizzle/schema";

export type MembershipProduct = typeof membershipProducts.$inferSelect;
export type NewMembershipProduct = typeof membershipProducts.$inferInsert;

export type ClientWallet = typeof clientWallets.$inferSelect;
export type NewClientWallet = typeof clientWallets.$inferInsert;
