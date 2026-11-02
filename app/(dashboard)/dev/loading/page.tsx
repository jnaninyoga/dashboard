import Link from "next/link";
import { notFound } from "next/navigation";

import DocumentLoading from "../../b2b/documents/(detail)/loading";
import DocumentsLoading from "../../b2b/documents/loading";
import PartnerLoading from "../../b2b/partners/[id]/loading";
import PartnersLoading from "../../b2b/partners/loading";
import SessionLoading from "../../check-in/[eventId]/loading";
import CheckInLoading from "../../check-in/loading";
import ClientLoading from "../../clients/[id]/loading";
import ClientsLoading from "../../clients/loading";
import HomeLoading from "../../loading";
import DiscountsLoading from "../../price-list/discounts/loading";
import MembershipsLoading from "../../price-list/memberships/loading";
import PartnerRatesLoading from "../../price-list/partner-rates/loading";
import ScheduleLoading from "../../schedule/loading";
import CompanyLoading from "../../settings/company/loading";
import HoursLoading from "../../settings/schedule/loading";

// Every loading screen, inside the real dashboard layout, to hold each one
// against its page (open the page in another tab at the same width), and
// the error screen (?screen=error).
// Development only, like /dev/playground.
const SCREENS = {
	home: HomeLoading,
	"check-in": CheckInLoading,
	session: SessionLoading,
	schedule: ScheduleLoading,
	clients: ClientsLoading,
	client: ClientLoading,
	partners: PartnersLoading,
	partner: PartnerLoading,
	documents: DocumentsLoading,
	document: DocumentLoading,
	memberships: MembershipsLoading,
	"partner-rates": PartnerRatesLoading,
	discounts: DiscountsLoading,
	company: CompanyLoading,
	hours: HoursLoading,
};

export default async function LoadingReview({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
	if (process.env.NODE_ENV !== "development") notFound();
	const { screen } = await searchParams;
	// The dashboard's error screen, in place.
	if (screen === "error") throw new Error("Dev: the error screen inside the layout");
	const Screen = SCREENS[screen as keyof typeof SCREENS];
	if (Screen) return <Screen />;
	return (
		<ul className="flex flex-wrap gap-2">
			{[...Object.keys(SCREENS), "error"].map((name) => (
				<li key={name}>
					<Link href={`?screen=${name}`} className="bg-card rounded-full border px-3 py-1.5 text-sm">
						{name}
					</Link>
				</li>
			))}
		</ul>
	);
}
