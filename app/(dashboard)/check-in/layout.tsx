import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Check-in Portal — JnaninYoga",
	description:
		"Manage client attendance and check-ins for today's yoga sessions.",
};

export default function CheckInLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <main className="flex flex-1 flex-col gap-6 p-6">{children}</main>;
}
