import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Settings — JnaninYoga",
	description: "The studio itself: its profile and its hours.",
};

export default function SettingsLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <div className="flex flex-1 flex-col gap-6">{children}</div>;
}
