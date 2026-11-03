import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Schedule — JnaninYoga",
	description: "Every session, week by week: what's coming and who came.",
};

export default function ScheduleLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <div className="flex flex-1 flex-col gap-6">{children}</div>;
}
