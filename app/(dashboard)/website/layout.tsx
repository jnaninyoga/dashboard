import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Website — JnaninYoga",
	description: "What jnaninyoga.com shows.",
};

export default function WebsiteLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <div className="flex flex-1 flex-col gap-6">{children}</div>;
}
