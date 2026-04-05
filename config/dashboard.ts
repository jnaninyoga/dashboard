import { 
	Buildings,
	Calendar, 
	Card, 
	Category2, 
	Home2, 
	People, 
	TickCircle, 
	Timer1, 
	UserAdd
} from "iconsax-reactjs";

export const dashboardConfig = {
	navMain: [
		{
			title: "Dashboard",
			url: "/",
			icon: Home2,
		},
		{
			title: "Schedule",
			url: "/schedule",
			icon: Calendar,
		},
		{
			title: "Check-in",
			url: "/check-in",
			icon: TickCircle,
		},
		{
			title: "Clients",
			url: "/clients",
			icon: People,
		},
	],
	actions: [
		{
			title: "Add Client",
			url: "/clients/add",
			icon: UserAdd,
		},
	],
	settings: [
		{
			title: "Memberships",
			url: "/settings/memberships",
			icon: Card,
		},
		{
			title: "Categories",
			url: "/settings/categories",
			icon: Category2,
		},
		{
			title: "B2B Pricing",
			url: "/settings/b2b",
			icon: Buildings,
		},
		{
			title: "Schedule",
			url: "/settings/schedule",
			icon: Timer1,
		},
	],
};
