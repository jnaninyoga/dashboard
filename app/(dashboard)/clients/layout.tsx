import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Clients — JnaninYoga",
	description: "Manage your yoga client base and view their progress.",
};

export default function ClientsLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <main className="flex flex-1 flex-col gap-6 p-6">{children}</main>;
}
