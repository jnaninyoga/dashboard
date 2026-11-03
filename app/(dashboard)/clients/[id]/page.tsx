import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { AboutSection } from "@/components/clients/profile/about";
import { CardsSection } from "@/components/clients/profile/cards";
import { ProfileHeader } from "@/components/clients/profile/header";
import { HealthSection } from "@/components/clients/profile/health";
import { VisitsSection } from "@/components/clients/profile/visits";
import { getGoogleContactPhotoAction } from "@/lib/actions/clients/mutations";
import { getClientByIdAction, getClientHealthNotes, getClientVisits } from "@/lib/actions/clients/queries";
import { getMembershipProductsAction } from "@/lib/actions/clients/wallets";
import { getDiscounts } from "@/lib/actions/settings";
import { healthPicture } from "@/lib/domain/clients/health";
import { studioDateString } from "@/lib/utils/time";

type Params = Promise<{ id: string }>;

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
	const { id } = await props.params;
	const { client } = await getClientByIdAction(id);
	return {
		title: client ? `${client.fullName} — JnaninYoga` : "Client — JnaninYoga",
		robots: { index: false, follow: false },
	};
}

/**
 * A client's page, in the order she needs it: their cards (and the sale),
 * their visits, their health before class, then who they are. On a wide
 * screen the cards and visits take the main column, health and the rest
 * the side.
 */
export default async function ClientProfilePage(props: { params: Params; searchParams: Promise<{ sell?: string }> }) {
	const { id } = await props.params;
	// From a refused check-in or a renewal: straight to selling a membership.
	const { sell } = await props.searchParams;

	const [{ client, error }, { products }, discounts, notes, visits] = await Promise.all([
		getClientByIdAction(id),
		getMembershipProductsAction(),
		getDiscounts(),
		getClientHealthNotes(id),
		getClientVisits(id),
	]);
	if (error || !client) notFound();

	// The photo from Google Contacts, cached on the client the first time.
	if (!client.photoUrl && client.googleContactResourceName) {
		const photo = await getGoogleContactPhotoAction(client.googleContactResourceName, client.id);
		if (photo.success && photo.url) client.photoUrl = photo.url;
	}

	const today = studioDateString();
	const lastVisit = visits.find((visit) => !visit.cancelledAt);
	const { alerts } = healthPicture(notes);

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
			<ProfileHeader
				client={client}
				lastVisitAt={lastVisit?.checkInTime}
				hereToday={!!lastVisit && studioDateString(new Date(lastVisit.checkInTime)) === today}
				alerts={alerts.length}
				critical={alerts.some((note) => note.severity === "critical")}
			/>

			<div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
				<div className="flex min-w-0 flex-col gap-8">
					<CardsSection
						clientId={client.id}
						wallets={client.wallets ?? []}
						products={products ?? []}
						// Her discounts on offer, and the client's own even if she stopped offering it.
						discounts={discounts.filter((d) => !d.isArchived || d.id === client.discountId)}
						clientDiscountId={client.discountId}
						sellOnOpen={sell === "1"}
					/>
					<VisitsSection visits={visits} />
				</div>
				<div className="flex min-w-0 flex-col gap-8">
					<HealthSection clientId={client.id} notes={notes} intake={(client.intakeData as Record<string, string>) ?? {}} />
					<AboutSection client={client} discount={client.discount} />
				</div>
			</div>
		</div>
	);
}
