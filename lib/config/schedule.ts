import { type Period, type WorkingHoursConfig } from "@/lib/domain/schedule/hours";

export const DAYS = [
	{ key: "1", label: "Monday" },
	{ key: "2", label: "Tuesday" },
	{ key: "3", label: "Wednesday" },
	{ key: "4", label: "Thursday" },
	{ key: "5", label: "Friday" },
	{ key: "6", label: "Saturday" },
	{ key: "0", label: "Sunday" },
];

/** The six periods the website showed before it came from the dashboard, with a rest after each and a long one at lunch. */
const CLASS_DAY: Period[] = [
	{ start: "08:30", end: "10:00" },
	{ start: "10:30", end: "12:00" },
	{ start: "12:30", end: "14:00" },
	{ start: "15:30", end: "17:00" },
	{ start: "17:30", end: "19:00" },
	{ start: "19:30", end: "21:00" },
];
const closed = { isOpen: false, periods: [] };

// Her week until she saves her own: what jnaninyoga.com said, Monday and
// Thursday with six periods, the other days by appointment.
export const DEFAULT_HOURS: WorkingHoursConfig = {
	"1": { isOpen: true, periods: CLASS_DAY },
	"2": closed,
	"3": closed,
	"4": { isOpen: true, periods: CLASS_DAY },
	"5": closed,
	"6": closed,
	"0": closed,
};
