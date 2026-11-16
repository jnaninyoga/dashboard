"use client";

import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { type RequestView } from "@/lib/actions/requests/queries";
import { messageExcerpt } from "@/lib/domain/requests/choice";

import { type ColumnDef } from "@tanstack/react-table";
import { Whatsapp } from "iconsax-reactjs";

import { BookingChoiceLine } from "./booking-choice";
import { replyHref, requestTitle } from "./labels";
import { RequestMenu } from "./request-actions";
import { RequestCard } from "./request-card";
import { RequestStatus } from "./request-status";

const columns: ColumnDef<RequestView>[] = [
	{
		id: "name",
		header: "From",
		accessorFn: (request) => requestTitle(request),
		// Who and what they asked for take the spare width, and shorten first when there's none.
		meta: { className: "w-full max-w-0" },
		cell: ({ row }) => {
			const request = row.original;
			return (
				<div className="flex min-w-0 flex-col gap-1">
					<div className="flex min-w-0 items-center gap-3">
						<Link
							href={`/bookings/${request.id}`}
							className="truncate rounded-sm font-medium text-foreground transition-colors outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
						>
							{requestTitle(request)}
						</Link>
						<RequestStatus status={request.status} />
					</div>
					<BookingChoiceLine request={request} />
					{request.message ? (
						<span className="truncate text-sm text-muted-foreground italic">“{messageExcerpt(request.message)}”</span>
					) : null}
				</div>
			);
		},
	},
	{
		id: "client",
		header: "Client",
		accessorFn: (request) => request.client?.fullName ?? "",
		meta: { className: "px-5" },
		cell: ({ row }) => {
			const client = row.original.client;
			return client ? (
				<Link href={`/clients/${client.id}`} className="whitespace-nowrap text-foreground hover:text-primary">
					{client.fullName}
				</Link>
			) : (
				<span className="whitespace-nowrap text-muted-foreground">{row.original.erasedAt ? "—" : "Not a client yet"}</span>
			);
		},
	},
	{
		id: "received",
		header: "Received",
		accessorFn: (request) => new Date(request.createdAt).getTime(),
		sortDescFirst: true,
		meta: { className: "px-5" },
		cell: ({ row }) => (
			<span className="whitespace-nowrap text-muted-foreground tabular-nums">{row.original.received}</span>
		),
	},
	{
		id: "actions",
		header: () => <span className="sr-only">Actions</span>,
		enableSorting: false,
		cell: ({ row }) => {
			const href = replyHref(row.original);
			return (
				<div className="flex items-center justify-end gap-1">
					{href ? (
						<a
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={`Reply to ${row.original.name} on WhatsApp`}
							className="flex size-9 items-center justify-center rounded-full bg-[#25D366]/15 text-[#128C7E] transition-colors hover:bg-[#25D366]/25 active:scale-95"
						>
							<Whatsapp size={18} variant="Bold" />
						</a>
					) : null}
					<RequestMenu request={row.original} />
				</div>
			);
		},
	},
];

/** Bookings as a table on a computer and as cards on a phone. */
export function RequestsList({ requests, empty }: { requests: RequestView[]; empty: React.ReactNode }) {
	return (
		<DataTable
			data={requests}
			columns={columns}
			noun={{ one: "booking", many: "bookings" }}
			getRowHref={(request) => `/bookings/${request.id}`}
			initialSorting={[{ id: "received", desc: true }]}
			empty={empty}
			renderCard={(request) => <RequestCard request={request} />}
			cardIsSelfContained
			// A table needs the room left beside the sidebar on a wide screen; cards until then.
			cardsBelow="xl"
		/>
	);
}
