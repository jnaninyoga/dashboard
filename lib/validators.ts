import { createInsertSchema } from "drizzle-zod";
import { clients } from "@/lib/drizzle/schema";
import { z } from "zod";

export const clientSchema = createInsertSchema(clients, {
	email: z.email({ message: "Invalid email address" }).optional().or(z.literal("")),
	birthDate: (schema) => schema.refine((date) => !isNaN(Date.parse(date)), {
		message: "Invalid date string",
	}),
	// Enums
	sex: z.enum(["male", "female"]).optional(),
	referralSource: z.enum(['social_media', 'website', 'friend', 'professional_network', 'other']).optional(),
	
	// Intake Data (Flexible JSONB)
	// We allow any key-value string pairs for the questionnaire
	intakeData: z.record(z.string(), z.string().optional()).optional(),
}).omit({
	id: true,
	createdAt: true,
	googleContactResourceName: true,
});

export type ClientFormValues = z.infer<typeof clientSchema>;
