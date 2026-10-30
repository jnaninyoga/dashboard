import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Price list — JnaninYoga",
	description: "What the studio sells and at what price: memberships, partner rates and discounts.",
};

export default function PriceListLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <div className="flex flex-1 flex-col gap-6">{children}</div>;
}
