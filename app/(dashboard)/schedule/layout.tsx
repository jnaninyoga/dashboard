import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Weekly Schedule — JnaninYoga",
	description:
		"View all upcoming yoga sessions and classes for the week ahead.",
};

export default function ScheduleLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <main className="flex flex-1 flex-col gap-6 p-6">{children}</main>;
}
