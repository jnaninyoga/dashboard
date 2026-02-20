export enum ClientCategory {
    ALL = "all",
    ADULT = "adult",
    CHILD = "child",
    STUDENT = "student",
}

export interface Category {
    id: string;
    name: string;
    description?: string; // Optional if needed, but DB doesn't have it yet? clientCategories has name, discountType, etc.
    discountType: "percentage" | "fixed";
    discountValue: string; // Since decimal is often string in JS apps or number
    isArchived: boolean;
}