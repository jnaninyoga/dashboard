"use client";

import { BottomBar } from "@/components/bottom-bar";
import { NewRequests } from "@/components/dashboard/new-requests";
import { EmptyState } from "@/components/empty-state";
import { QuickActionsProvider } from "@/components/quick-actions";
import { NewRequestsProvider } from "@/components/requests/new-requests-count";
import { RequestsList } from "@/components/requests/requests-list";
import { type RequestView } from "@/lib/actions/requests/queries";

import { DirectInbox } from "iconsax-reactjs";

// Three website bookings: a client with a card, someone new, and one whose
// details were erased.
const now = Date.now();
const base = {
	ref: "WEB-1A2B3C4D",
	kind: "card",
	choiceKey: "start-to-align",
	lang: "fr",
	statusChangedAt: null,
	clientId: null,
	ipHash: null,
	erasedAt: null,
} as const;

const requests = [
	{
		...base,
		id: "00000000-0000-4000-8000-000000000001",
		name: "Salma Bennani",
		phone: "06 61 28 64 64",
		choiceLabel: "Start To Align (1 500 Dh)",
		message: "C'est ma première fois, est-ce que c'est adapté ?",
		status: "new",
		createdAt: new Date(now - 12 * 60 * 1000),
		received: "Today 9:41",
		client: { id: "c-1", fullName: "Salma Bennani", credits: { count: 2, total: 10, tone: "low" } },
	},
	{
		...base,
		id: "00000000-0000-4000-8000-000000000002",
		kind: "class",
		choiceKey: "8h30",
		name: "Tom Whitaker",
		phone: "+44 7700 900123",
		choiceLabel: "The 8:30 class, Monday or Thursday",
		message: null,
		lang: "en",
		status: "new",
		createdAt: new Date(now - 26 * 60 * 60 * 1000),
		received: "Yesterday 18:02",
		client: null,
	},
	{
		...base,
		id: "00000000-0000-4000-8000-000000000003",
		kind: "other",
		choiceKey: null,
		name: "",
		phone: "",
		choiceLabel: "Pas encore sûr(e), j'aimerais en parler",
		message: null,
		status: "declined",
		statusChangedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
		erasedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
		createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
		received: "Wed 11 Nov 10:15",
		client: null,
	},
] as unknown as RequestView[];

export function RequestsDemo() {
	return (
		<section className="grid gap-6 rounded-3xl border bg-card p-6" data-testid="requests-demo">
			<h2 className="text-xl">Bookings</h2>
			<div data-testid="home-new-requests" className="min-w-0">
				<NewRequests requests={requests.slice(0, 2)} count={2} />
			</div>
			<RequestsList requests={requests} empty={null} />
			{/* The phone's bottom bar with 2 new requests on Today. */}
			<NewRequestsProvider initial={2} refresh={false}>
				<QuickActionsProvider>
					<BottomBar />
				</QuickActionsProvider>
			</NewRequestsProvider>
			<RequestsList
				requests={[]}
				empty={
					<EmptyState
						icon={<DirectInbox size={40} variant="Bulk" />}
						title="No new bookings"
						description="Bookings from jnaninyoga.com land here."
					/>
				}
			/>
		</section>
	);
}
