import {
	Buildings,
	Calendar,
	Card,
	Category2,
	DocumentText,
	Home2,
	type Icon,
	People,
	Shop,
	TickCircle,
	Timer1,
} from "iconsax-reactjs";

export type NavItem = { title: string; url: string; icon: Icon };

/**
 * The navigation, in the words of her day: what's happening today, the studio
 * itself, and the billing of the hotels and companies she teaches for.
 * Settings are set up once and visited rarely, so they fold away.
 */
export const dashboardConfig = {
	sections: [
		{
			label: "Today",
			items: [
				{ title: "Dashboard", url: "/", icon: Home2 },
				{ title: "Check-in", url: "/check-in", icon: TickCircle },
			],
		},
		{
			label: "Studio",
			items: [
				{ title: "Schedule", url: "/schedule", icon: Calendar },
				{ title: "Clients", url: "/clients", icon: People },
			],
		},
		{
			label: "Billing",
			items: [
				{ title: "Partners", url: "/b2b/partners", icon: Buildings },
				{ title: "Documents", url: "/b2b/documents", icon: DocumentText },
			],
		},
	] satisfies { label: string; items: NavItem[] }[],
	settings: [
		{ title: "Studio profile", url: "/settings/company", icon: Shop },
		{ title: "Memberships", url: "/settings/memberships", icon: Card },
		{ title: "Categories", url: "/settings/categories", icon: Category2 },
		{ title: "B2B pricing", url: "/settings/b2b", icon: Buildings },
		{ title: "Studio hours", url: "/settings/schedule", icon: Timer1 },
	] satisfies NavItem[],
};

/** Remembers whether Settings is open; the layout reads it on the next visit. */
export const SETTINGS_COOKIE = "sidebar_settings";

/** The current page, or a page under it ("/clients/123" is under Clients). */
export const isCurrent = (pathname: string, url: string) =>
	url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(`${url}/`);
