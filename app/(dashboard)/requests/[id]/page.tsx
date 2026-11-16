import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentSection } from "@/components/b2b/documents/document-section";
import { requestTitle } from "@/components/requests/labels";
import { RequestMenu, RequestReplyActions } from "@/components/requests/request-actions";
import { RequestClientFigure } from "@/components/requests/request-card";
import { RequestStatus } from "@/components/requests/request-status";
import { getRequest } from "@/lib/actions/requests/queries";
import { receivedLabel } from "@/lib/domain/requests/received";

import { ArrowLeft } from "iconsax-reactjs";

const LANGS = { fr: "French", en: "English" } as const;

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-6">
			<dt className="w-32 shrink-0 text-sm text-muted-foreground">{label}</dt>
			<dd className="min-w-0 text-foreground">{children}</dd>
		</div>
	);
}

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const { data: request, error } = await getRequest(id);
	if (error) throw new Error(error);
	if (!request) notFound();

	return (
		<>
			<Link
				href="/requests"
				className="-ml-2 flex h-10 w-fit items-center gap-2 rounded-full px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft size={18} />
				Requests
			</Link>

			<header className="flex items-start justify-between gap-4">
				<div className="min-w-0 space-y-2">
					<div className="flex flex-wrap items-center gap-3">
						<h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">
							{requestTitle(request)}
						</h1>
						<RequestStatus status={request.status} />
					</div>
					<p className="text-md text-muted-foreground">
						{request.choiceLabel} · {receivedLabel(request.createdAt)}
					</p>
				</div>
				<RequestMenu request={request} />
			</header>

			<RequestReplyActions request={request} className="max-w-md" />

			{request.message ? (
				<DocumentSection id="request-message" title="Their message">
					<p className="rounded-3xl border border-secondary/20 bg-card p-6 whitespace-pre-line text-foreground">
						{request.message}
					</p>
				</DocumentSection>
			) : null}

			<DocumentSection id="request-details" title="Details">
				<dl className="divide-y divide-border/60 rounded-3xl border border-secondary/20 bg-card px-6 py-2">
					<Fact label="Phone">{request.erasedAt ? "Erased" : request.phone}</Fact>
					<Fact label="Language">{LANGS[request.lang]}</Fact>
					<Fact label="Client">
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
					{request.client ? (
						<Fact label="Card">
							<dl>
								<RequestClientFigure request={request} />
							</dl>
						</Fact>
					) : null}
					{request.statusChangedAt ? (
						<Fact label={request.status === "new" ? "Reopened" : request.status === "confirmed" ? "Confirmed" : "Declined"}>
							{receivedLabel(request.statusChangedAt)}
						</Fact>
					) : null}
					{request.erasedAt ? <Fact label="Erased">{receivedLabel(request.erasedAt)}</Fact> : null}
					{request.ref ? (
						<Fact label="Reference">
							<span className="font-mono text-sm">{request.ref}</span>
						</Fact>
					) : null}
				</dl>
			</DocumentSection>
		</>
	);
}
