"use client";

import Link from "next/link";

import { DocumentSection } from "@/components/b2b/documents/document-section";
import { discountTerms } from "@/components/clients/sell-membership-sheet";
import { ageOn } from "@/lib/domain/clients/health";
import { type Discount } from "@/lib/types";
import { formatPhone } from "@/lib/utils/phone";
import { formatDay, studioDateString } from "@/lib/utils/time";
import { type Client } from "@/services/database/schema";

import { Briefcase, Cake, CalendarTick, Call, DiscountShape, Edit2, type Icon, Location, MessageText1, People, Sms } from "iconsax-reactjs";

const FOUND_US: Record<string, string> = {
	social_media: "Social media",
	website: "The website",
	friend: "A friend",
	professional_network: "Professional network",
	other: "Other",
};

const longDay = (date: string) => formatDay(date, { day: "numeric", month: "long", year: "numeric" });

/**
 * Who the client is: how to reach them, their birthday and age, their
 * discount, since when and how they came to the studio, and why. Only what
 * was filled in shows; the rest is in Edit.
 */
export function AboutSection({ client, discount }: { client: Client; discount?: Discount | null }) {
	const today = studioDateString();
	// Each detail with its icon, so the list is read by shape before words.
	const rows: [Icon, string, React.ReactNode][] = [
		[
			Call,
			"Phone",
			<a key="phone" href={`tel:${client.phone}`} className="tabular-nums hover:text-primary">
				{formatPhone(client.phone)}
			</a>,
		],
	];
	if (client.email) {
		rows.push([
			Sms,
			"Email",
			<a key="email" href={`mailto:${client.email}`} className="break-all hover:text-primary">
				{client.email}
			</a>,
		]);
	}
	if (client.address) rows.push([Location, "Address", client.address]);
	if (client.birthDate) rows.push([Cake, "Birthday", `${longDay(client.birthDate)} (${ageOn(client.birthDate, today)})`]);
	if (client.profession) rows.push([Briefcase, "Work", client.profession]);
	rows.push([DiscountShape, "Discount", discount ? `${discount.name} ${discountTerms(discount)}` : "None"]);
	rows.push([CalendarTick, "Client since", longDay(studioDateString(new Date(client.createdAt)))]);
	if (client.referralSource) rows.push([People, "Found us through", FOUND_US[client.referralSource] ?? client.referralSource]);
	if (client.consultationReason) rows.push([MessageText1, "Why they came", client.consultationReason]);

	return (
		<DocumentSection
			id="about"
			title="About"
			aside={
				<Link
					href={`/clients/${client.id}/edit`}
					className="-mr-2 inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
				>
					<Edit2 size={16} />
					Edit
				</Link>
			}
		>
			<dl className="divide-y divide-border rounded-2xl border bg-card">
				{rows.map(([RowIcon, label, value]) => (
					<div key={label} className="flex items-start gap-3 px-5 py-3">
						<span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
							<RowIcon size={18} variant="Bulk" />
						</span>
						<div className="grid min-w-0 flex-1 gap-0.5 pt-0.5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4 sm:pt-1.5">
							<dt className="text-sm text-muted-foreground">{label}</dt>
							<dd className="font-medium wrap-break-word whitespace-pre-line text-foreground">{value}</dd>
						</div>
					</div>
				))}
			</dl>
		</DocumentSection>
	);
}
