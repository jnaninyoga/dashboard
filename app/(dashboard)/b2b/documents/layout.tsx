import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "B2B Documents — JnaninYoga",
	description: "Manage your B2B documents, invoices, and quotes.",
};

export default function PartnersLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <div className="flex flex-1 flex-col gap-6">{children}</div>;
}
