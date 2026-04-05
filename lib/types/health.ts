import { type HealthLog as HealthLogSchema } from "@/drizzle/schema";

export enum HealthCategory {
	PHYSICAL = "physical",
	MENTAL = "mental",
	LIFESTYLE = "lifestyle",
}

export enum HealthSeverity {
	INFO = "info",
	WARNING = "warning",
	CRITICAL = "critical",
}

export type HealthLog = HealthLogSchema;
export type { NewHealthLog } from "@/drizzle/schema";
