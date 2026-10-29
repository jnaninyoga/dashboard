import { 
    type Client as ClientSchema, 
    type clientCategories,
    type ClientWallet,
    type HealthLog,
    type MembershipProduct,
    type NewClient, 
    type NewClientCategory as NewCategory 
} from "@/services/database/schema";

export type Category = typeof clientCategories.$inferSelect;
export type Client = ClientSchema;
export type { NewCategory, NewClient };

export type ClientWithRelations = Client & {
    category?: Category | null;
    wallets?: (ClientWallet & {
        product: MembershipProduct | null;
    })[];
    healthLogs?: HealthLog[];
    /** Check-ins since the start of the studio's month, and the latest one. */
    visitsThisMonth?: number;
    lastVisitAt?: Date | string;
    /** Checked in today (from the attendance records). */
    checkedInToday?: boolean;
    /** Today's session she checked in to, when Google can name it. */
    activeSessionName?: string;

};

export enum ClientCategoryFilter {
	ALL = "all",
	ADULT = "adult",
	CHILD = "child",
	STUDENT = "student",
}