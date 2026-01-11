import { Calendar, Home, Users, Plus } from "lucide-react";

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
};
