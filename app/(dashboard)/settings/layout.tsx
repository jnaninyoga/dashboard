import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Settings — JnaninYoga",
	description: "Manage studio settings, categories, memberships, and schedule.",
};

export default function SettingsLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <main className="flex flex-1 flex-col gap-6 p-6">{children}</main>;
}
