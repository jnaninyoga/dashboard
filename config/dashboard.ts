import { Calendar, Home, Users, Plus, CreditCard, Tag, Clock } from "lucide-react";

export const dashboardConfig = {
	navMain: [
		{
			title: "Dashboard",
			url: "/",
			icon: Home,
		},
		{
			title: "Schedule",
			url: "/schedule",
			icon: Calendar,
		},
		{
			title: "Clients",
			url: "/clients",
			icon: Users,
		},
	],
	actions: [
		{
			title: "Add Client",
			url: "/clients/add",
			icon: Plus,
		},
	],
	settings: [
		{
			title: "Memberships",
			url: "/settings/memberships",
			icon: CreditCard,
		},
		{
			title: "Categories",
			url: "/settings/categories",
			icon: Tag,
		},
		{
			title: "Schedule",
			url: "/settings/schedule",
			icon: Clock,
		},
	],
};
