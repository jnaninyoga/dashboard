import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Bookings — JnaninYoga",
	description: "Bookings sent from jnaninyoga.com.",
};

export default function RequestsLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <div className="flex flex-1 flex-col gap-6">{children}</div>;
}
