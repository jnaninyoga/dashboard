import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentSection } from "@/components/b2b/documents/document-section";
import { BookingChoicePanel } from "@/components/requests/booking-choice";
import { requestTitle } from "@/components/requests/labels";
import { RequestMenu, RequestReplyActions } from "@/components/requests/request-actions";
import { RequestStatus } from "@/components/requests/request-status";
import { getRequest, type RequestClient } from "@/lib/actions/requests/queries";
import { toE164 } from "@/lib/domain/requests/phone";
import { receivedLabel } from "@/lib/domain/requests/received";
import { cn } from "@/lib/utils/ui";

import {
	ArrowLeft,
	Call,
	Card,
	Clock,
	CloseCircle,
	Eraser,
	Hashtag,
	type Icon,
	LanguageSquare,
	MessageText,
	People,
	Profile,
	TickCircle,
} from "iconsax-reactjs";

const LANGS = { fr: "French", en: "English" } as const;

/** One detail: its icon on a soft tile, the label, then the value. */
function Fact({ icon: FactIcon, label, children }: { icon: Icon; label: string; children: React.ReactNode }) {
	return (
		<div className="flex items-center gap-4 py-3.5">
			<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
				<FactIcon size={20} variant="Bulk" />
			</span>
			<div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-6">
				<dt className="shrink-0 text-sm text-muted-foreground sm:w-28">{label}</dt>
				<dd className="min-w-0 text-foreground">{children}</dd>
			</div>
		</div>
	);
}

/** The client's card in words: "2 of 10 credits left", "No card", "Expired". */
function creditsText({ credits }: RequestClient): { text: string; tone?: "low" | "alert" } {
	if (credits.count === null) return { text: "No card" };
	if (credits.tone === "expired") return { text: "Expired", tone: "alert" };
	const text = credits.total ? `${credits.count} of ${credits.total} credits left` : `${credits.count} credits left`;
	return credits.tone === "low" ? { text, tone: "low" } : { text };
}

const STATUS_FACT = {
	new: { label: "Reopened", icon: Clock },
	confirmed: { label: "Confirmed", icon: TickCircle },
	declined: { label: "Declined", icon: CloseCircle },
} as const;

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const { data: request, error } = await getRequest(id);
	if (error) throw new Error(error);
	if (!request) notFound();

	const card = request.client ? creditsText(request.client) : null;
	const status = STATUS_FACT[request.status];

	return (
		<>
			<Link
				href="/bookings"
				className="-ml-2 flex h-10 w-fit items-center gap-2 rounded-full px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft size={18} />
				Bookings
			</Link>

			<header className="flex items-start justify-between gap-4">
				<div className="min-w-0 space-y-2">
					<div className="flex flex-wrap items-center gap-3">
						<h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">
							{requestTitle(request)}
						</h1>
						<RequestStatus status={request.status} />
					</div>
					<p className="flex items-center gap-1.5 text-sm text-muted-foreground">
						<Clock size={16} aria-hidden />
						Received {request.received}
					</p>
				</div>
				<RequestMenu request={request} />
			</header>

			<DocumentSection id="booking-choice" title="What they'd like">
				<BookingChoicePanel request={request} />
			</DocumentSection>

			<RequestReplyActions request={request} className="max-w-md" />

			{request.message ? (
				<DocumentSection id="booking-message" title="Their message">
					<div className="flex gap-4 rounded-3xl border border-secondary/20 bg-card p-5 sm:p-6">
						<MessageText size={22} variant="Bulk" className="mt-0.5 shrink-0 text-primary" aria-hidden />
						<p className="min-w-0 whitespace-pre-line text-foreground">{request.message}</p>
					</div>
				</DocumentSection>
			) : null}

			<DocumentSection id="booking-details" title="Details">
				<dl className="divide-y divide-border/60 rounded-3xl border border-secondary/20 bg-card px-4 py-1 sm:px-6">
					<Fact icon={Call} label="Phone">
						{request.erasedAt ? (
							"Erased"
						) : (
							<a href={`tel:${toE164(request.phone) ?? request.phone}`} className="font-medium tabular-nums hover:text-primary">
								{request.phone}
							</a>
						)}
					</Fact>
					{request.kind === "event" ? (
						<Fact icon={People} label="People">
							{request.partySize}
							{request.arrivedWhenFull ? <span className="ml-2 text-sm text-warning">came in when the event was full</span> : null}
						</Fact>
					) : null}
					<Fact icon={LanguageSquare} label="Language">
						{LANGS[request.lang]}
					</Fact>
					<Fact icon={Profile} label="Client">
						{request.client ? (
							<Link href={`/clients/${request.client.id}`} className="font-medium hover:text-primary">
								{request.client.fullName}
							</Link>
						) : request.erasedAt ? (
							"—"
						) : (
							"New to the studio"
						)}
					</Fact>
					{card ? (
						<Fact icon={Card} label="Their card">
							<span
								className={cn(
									"font-medium",
									card.tone === "low" && "text-warning",
									card.tone === "alert" && "text-destructive",
								)}
							>
								{card.text}
							</span>
						</Fact>
					) : null}
					{request.statusChangedAt ? (
						<Fact icon={status.icon} label={status.label}>
							{receivedLabel(request.statusChangedAt)}
						</Fact>
					) : null}
					{request.erasedAt ? (
						<Fact icon={Eraser} label="Erased">
							{receivedLabel(request.erasedAt)}
						</Fact>
					) : null}
					{request.ref ? (
						<Fact icon={Hashtag} label="Reference">
							<span className="font-mono text-sm">{request.ref}</span>
						</Fact>
					) : null}
				</dl>
			</DocumentSection>
		</>
	);
}
