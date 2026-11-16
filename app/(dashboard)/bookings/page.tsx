import { DocumentSection } from "@/components/b2b/documents/document-section";
import { EmptyState } from "@/components/empty-state";
import { NotificationsSwitch } from "@/components/requests/notifications-switch";
import { RequestsList } from "@/components/requests/requests-list";
import { getRequests } from "@/lib/actions/requests/queries";

import { DirectInbox, TickCircle } from "iconsax-reactjs";

/**
 * Bookings from jnaninyoga.com: the ones waiting for her answer first, then
 * the ones she handled.
 */
export default async function BookingsPage() {
	const { data, error } = await getRequests();
	if (error) throw new Error(error);
	const requests = data ?? [];
	const fresh = requests.filter((request) => request.status === "new");
	const handled = requests.filter((request) => request.status !== "new");

	return (
		<>
			<header className="space-y-1">
				<h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">Bookings</h1>
				<p className="text-md text-muted-foreground">
					Sent from jnaninyoga.com. Reply on WhatsApp, then confirm or decline.
				</p>
			</header>

			{/* Until this phone is turned on: once it is, the switch stays in Settings. */}
			<NotificationsSwitch compact className="max-w-xl" />

			<DocumentSection
				id="new-bookings"
				title="New"
				aside={<span className="text-sm text-muted-foreground tabular-nums">{fresh.length ? `${fresh.length} waiting` : null}</span>}
			>
				<RequestsList
					requests={fresh}
					empty={
						<EmptyState
							icon={<DirectInbox size={40} variant="Bulk" />}
							title="No new bookings"
							description="Bookings from jnaninyoga.com land here."
						/>
					}
				/>
			</DocumentSection>

			{handled.length ? (
				<DocumentSection id="handled-bookings" title="Handled">
					<RequestsList
						requests={handled}
						empty={<EmptyState icon={<TickCircle size={40} variant="Bulk" />} title="Nothing handled yet" />}
					/>
				</DocumentSection>
			) : null}
		</>
	);
}
