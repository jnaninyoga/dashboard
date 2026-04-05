import { 
    type Client as ClientSchema, 
    type clientCategories,
    type ClientWallet,
    type HealthLog,
    type MembershipProduct,
    type NewClient, 
    type NewClientCategory as NewCategory 
} from "@/drizzle/schema";

export type Category = typeof clientCategories.$inferSelect;
export type Client = ClientSchema;
export type { NewCategory, NewClient };

export type ClientWithRelations = Client & {
    category?: Category | null;
    wallets?: (ClientWallet & {
        product: MembershipProduct | null;
    })[];
    healthLogs?: HealthLog[];
    activeSessionName?: string | null;
};

export enum ClientCategoryFilter {
	ALL = "all",
	ADULT = "adult",
	CHILD = "child",
	STUDENT = "student",
}