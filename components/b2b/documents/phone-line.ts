/**
 * The lines table on a phone, where its columns don't fit: each line stacks,
 * its description across the top, then quantity × price, its total and its
 * remove button, at a size a thumb can hit. From sm up, a plain table.
 */
export const phoneLine = {
	table: "max-sm:block",
	head: "max-sm:hidden",
	body: "max-sm:block",
	row: "max-sm:grid max-sm:grid-cols-[4.5rem_minmax(0,1fr)_auto_auto] max-sm:items-center max-sm:gap-2 max-sm:p-3",
	description: "max-sm:col-span-4 max-sm:p-0",
	// The cells beside the waiting line are empty: no room kept for them.
	cell: "max-sm:p-0 max-sm:empty:hidden",
	price: "max-sm:flex max-sm:items-center max-sm:gap-2 max-sm:before:text-muted-foreground max-sm:before:content-['×']",
	input: "max-sm:h-10",
	remove: "max-sm:size-10",
};
