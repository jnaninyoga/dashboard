"use client";

import { useState } from "react";
import Link from "next/link";

import { ClientAvatar } from "@/components/clients/client-card";
import { Button } from "@/components/ui/button";
import { type RenewalDue } from "@/lib/actions/clients/renewals";
import { type Renewal, renewalLine, renewalMessage } from "@/lib/domain/clients/renewal";
import { whatsappHref } from "@/lib/utils/contact";
import { formatDay } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";

import { ArrowDown2, Bag2, Whatsapp } from "iconsax-reactjs";

/** Enough to act on at a glance; the rest a tap away. */
const FIRST = 5;

const canComeIn = (r: Renewal) => r.reason === "ends" || r.reason === "low";

/** "2 without a card, 1 ending this week, 1 nearly used up". */
function summary(due: RenewalDue[]) {
	const count = (reasons: Renewal["reason"][]) => due.filter((d) => reasons.includes(d.renewal.reason)).length;
	return [
		[count(["expired", "used-up"]), "without a card"],
		[count(["ends"]), "ending this week"],
		[count(["low"]), "nearly used up"],
	]
		.filter(([n]) => n)
		.map(([n, label]) => `${n} ${label}`)
		.join(", ");
}

/**
 * On Home: the clients to ask about a new card before they're turned away at
 * the door, the most pressing first. Each comes with the WhatsApp message,
 * written for them, and the sale a tap away.
 */
export function Renewals({ due, error, today, signature }: { due: RenewalDue[]; error?: string; today: string; signature: string }) {
	const [all, setAll] = useState(false);
	if (!due.length && !error) return null;
	const shown = all ? due : due.slice(0, FIRST);

	return (
		<section aria-labelledby="renewals" className="bg-card border-secondary/20 flex flex-col gap-4 rounded-3xl border p-5 sm:p-6">
			<div className="flex flex-col gap-1">
				<h2 id="renewals" className="font-heading text-foreground text-xl font-semibold">
					Cards to renew
				</h2>
				<p className="text-muted-foreground text-sm">{error ?? summary(due)}</p>
			</div>

			{due.length ? (
				<ul className="divide-border -mx-2 flex flex-col divide-y">
					{shown.map(({ client, renewal }) => (
						<li key={client.id} className="flex items-center gap-3 px-2 py-3">
							<Link
								href={`/clients/${client.id}`}
								className="focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 rounded-2xl outline-none focus-visible:ring-2"
							>
								<ClientAvatar client={client} className="size-10 sm:size-11" />
								<span className="flex min-w-0 flex-col">
									<span className="text-foreground truncate font-semibold">{client.fullName}</span>
									<span className={cn("text-sm", canComeIn(renewal) ? "text-warning" : "text-destructive")}>
										{renewalLine(renewal, today, (day) => formatDay(day, { weekday: "short", day: "numeric", month: "short" }))}
									</span>
								</span>
							</Link>
							<a
								href={`${whatsappHref(client.phone)}?text=${encodeURIComponent(renewalMessage(renewal, client, today, signature))}`}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={`Ask ${client.fullName} on WhatsApp`}
								title="Ask on WhatsApp, with the message written"
								className="bg-primary/10 text-primary hover:bg-primary/15 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors active:scale-95"
							>
								<Whatsapp size={20} variant="Bold" />
							</a>
							{/* A word from tablets up; on a phone the bag says it and leaves the reason room. */}
							<Button asChild variant="outline" className="size-11 shrink-0 rounded-full p-0 font-semibold sm:w-auto sm:px-4">
								<Link href={`/clients/${client.id}?sell=1`} aria-label={`Sell ${client.fullName} a membership`}>
									<Bag2 size={18} variant="Bold" className="sm:hidden" />
									<span className="max-sm:hidden">Sell</span>
								</Link>
							</Button>
						</li>
					))}
				</ul>
			) : null}

			{due.length > FIRST ? (
				<button
					type="button"
					onClick={() => setAll(!all)}
					aria-expanded={all}
					className="text-primary focus-visible:ring-ring -ml-2 inline-flex min-h-10 items-center gap-1 self-start rounded-full px-2 text-sm font-semibold outline-none hover:underline focus-visible:ring-2"
				>
					{all ? "Show fewer" : `Show all ${due.length}`}
					<ArrowDown2 size={16} className={cn("transition-transform motion-reduce:transition-none", all && "rotate-180")} />
				</button>
			) : null}
		</section>
	);
}
