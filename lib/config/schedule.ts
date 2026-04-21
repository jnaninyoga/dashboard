import { type WorkingHoursConfig } from "@/lib/types";

export const DAYS = [
	{ key: "1", label: "Monday" },
	{ key: "2", label: "Tuesday" },
	{ key: "3", label: "Wednesday" },
	{ key: "4", label: "Thursday" },
	{ key: "5", label: "Friday" },
	{ key: "6", label: "Saturday" },
	{ key: "0", label: "Sunday" },
];

export const DEFAULT_HOURS: WorkingHoursConfig = {
	"1": { isOpen: true, start: "08:00", end: "20:00" },
	"2": { isOpen: true, start: "08:00", end: "20:00" },
	"3": { isOpen: true, start: "08:00", end: "20:00" },
	"4": { isOpen: true, start: "08:00", end: "20:00" },
	"5": { isOpen: true, start: "08:00", end: "20:00" },
	"6": { isOpen: true, start: "08:00", end: "14:00" },
	"0": { isOpen: false, start: "08:00", end: "20:00" },
};
