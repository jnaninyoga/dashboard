import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "B2B Partners — JnaninYoga",
	description: "Manage your B2B relationships, contracts, and documents.",
};

export default function PartnersLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <div className="flex flex-1 flex-col gap-6">{children}</div>;
}
