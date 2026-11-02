export type WorkingHoursConfig = Record<
	string,
	{ isOpen: boolean; start: string; end: string }
>;
