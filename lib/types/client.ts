import { 
    type Client as ClientSchema, 
    type ClientWallet,
    type Discount,
    type HealthLog,
    type NewClient, 
    type NewDiscount,
    type Product,
} from "@/services/database/schema";

export type Client = ClientSchema;
export type { Discount, NewClient, NewDiscount };

export type ClientWithRelations = Client & {
    /** The discount she gives this client on memberships. */
    discount?: Discount | null;
    wallets?: (ClientWallet & {
        product: Product | null;
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