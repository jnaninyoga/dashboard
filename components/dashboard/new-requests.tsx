import Link from "next/link";

import { replyHref, requestTitle } from "@/components/requests/labels";
import { type RequestView } from "@/lib/actions/requests/queries";

import { ArrowRight2, DirectInbox, Whatsapp } from "iconsax-reactjs";

/**
 * On Home, first thing while any wait: the bookings from the website she
 * hasn't answered, each with WhatsApp a tap away.
 */
export function NewRequests({ requests, count }: { requests: RequestView[]; count: number }) {
	if (!count) return null;
	return (
		<section aria-labelledby="new-requests" className="flex min-w-0 flex-col gap-4 rounded-3xl border border-primary/25 bg-card p-5 sm:p-6">
			<div className="flex items-start justify-between gap-3">
				<div className="flex flex-col gap-1">
					<h2 id="new-requests" className="font-heading text-xl font-semibold text-foreground">
						{count === 1 ? "1 new request" : `${count} new requests`}
					</h2>
					<p className="text-sm text-muted-foreground">Bookings from jnaninyoga.com, waiting for your answer.</p>
				</div>
				<DirectInbox size={28} variant="Bulk" className="shrink-0 text-primary" aria-hidden />
			</div>
			<ul className="-mx-2 flex flex-col divide-y divide-border">
				{requests.map((request) => {
					const href = replyHref(request);
					return (
						<li key={request.id} className="flex items-center gap-3 px-2 py-3">
							<Link
								href={`/requests/${request.id}`}
								className="flex min-w-0 flex-1 flex-col rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<span className="truncate font-semibold text-foreground">{requestTitle(request)}</span>
								<span className="truncate text-sm text-muted-foreground">
									{request.received} · {request.choiceLabel}
								</span>
							</Link>
							{href ? (
								<a
									href={href}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={`Reply to ${request.name} on WhatsApp`}
									className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#25D366]/15 text-[#128C7E] transition-colors hover:bg-[#25D366]/25 active:scale-95"
								>
									<Whatsapp size={20} variant="Bold" />
								</a>
							) : null}
						</li>
					);
				})}
			</ul>
			<Link
				href="/requests"
				className="flex h-11 w-fit items-center gap-1.5 rounded-full px-1 text-sm font-semibold text-primary hover:text-primary/80"
			>
				Open requests
				<ArrowRight2 size={16} />
			</Link>
		</section>
	);
}
