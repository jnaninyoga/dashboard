import { z } from "zod";

// A health note on a client: where it is (body, mind, lifestyle), how much
// it matters (a warning or critical note shows at check-in), what it is,
// how it's cared for, and since when.
export const healthNoteSchema = z.object({
	category: z.enum(["physical", "mental", "lifestyle"], { error: "Choose where it is" }),
	severity: z.enum(["info", "warning", "critical"], { error: "Choose how much it matters" }),
	condition: z.string().trim().min(1, "Say what it is").max(200, "Keep it under 200 characters"),
	treatment: z.string().trim().max(500, "Keep it under 500 characters").optional(),
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick the day"),
});

export type HealthNoteValues = z.infer<typeof healthNoteSchema>;
