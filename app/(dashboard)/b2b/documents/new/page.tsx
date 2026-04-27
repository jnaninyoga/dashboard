import Link from "next/link";

import { NewQuoteForm } from "@/components/b2b/documents/new-quote-form";
import {
	getNextDocumentNumber,
} from "@/lib/actions/b2b/documents";
import {
	getPartnerByIdAction,
	getPartnersAction,
} from "@/lib/actions/b2b/partners";

import { ArrowLeft, Buildings, DocumentText } from "iconsax-reactjs";

type SearchParams = Promise<{ partner?: string }>;

export default async function NewQuotePage(props: { searchParams: SearchParams }) {
	const { partner: partnerId } = await props.searchParams;

	if (!partnerId) {
		return <PartnerPicker />;
	}

	const { partner } = await getPartnerByIdAction(partnerId);
	if (!partner) {
		return <PartnerPicker missing />;
	}

	const previewNumber = await getNextDocumentNumber("quote");

	return (
		<NewQuoteForm
			partner={partner}
			contacts={partner.contacts || []}
			previewNumber={previewNumber}
		/>
	);
}

async function PartnerPicker({ missing = false }: { missing?: boolean }) {
	const { partners = [] } = await getPartnersAction();

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
			<Link
				href="/b2b/documents"
				className="group text-muted-foreground hover:text-primary flex w-fit items-center gap-2 text-sm transition-colors"
			>
				<ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
				Back to Documents
			</Link>

			<div className="bg-card animate-slide-up rounded-3xl border p-8 shadow-sm">
				<div className="mb-6 flex items-center gap-4">
					<div className="border-primary/20 bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl border shadow-inner">
						<DocumentText size={28} variant="Bulk" />
					</div>
					<div>
						<h1 className="font-heading text-foreground text-2xl font-black tracking-tight">
							New Quotation
						</h1>
						<p className="text-muted-foreground text-sm">
							{missing
								? "We couldn't find that partner — choose another to continue."
								: "Choose the partner this quotation is for."}
						</p>
					</div>
				</div>

				{partners.length === 0 ? (
					<div className="border-secondary/10 bg-secondary/5 rounded-2xl border-2 border-dashed p-10 text-center">
						<p className="text-muted-foreground mb-4 text-sm">
							You don't have any partners yet.
						</p>
						<Link href="/b2b/partners">
							<span className="text-primary text-sm font-bold hover:underline">
								Create your first partner →
							</span>
						</Link>
					</div>
				) : (
					<ul className="divide-secondary/15 divide-y">
						{partners.map((p) => (
							<li key={p.id}>
								<Link
									href={`/b2b/documents/new?partner=${p.id}`}
									className="hover:bg-primary/5 group flex items-center justify-between rounded-xl px-3 py-3 transition-colors"
								>
									<div className="flex items-center gap-3">
										<div className="bg-secondary/40 text-secondary-3 group-hover:bg-primary/10 group-hover:text-primary flex size-10 items-center justify-center rounded-xl transition-colors">
											<Buildings size={18} variant="Bulk" />
										</div>
										<div className="flex flex-col">
											<span className="text-foreground text-sm font-bold">
												{p.companyName}
											</span>
											{p.taxId ? (
												<span className="text-muted-foreground/60 font-mono text-[10px]">
													ICE {p.taxId}
												</span>
											) : (
												<span className="text-amber-700/70 font-mono text-[10px]">
													ICE missing
												</span>
											)}
										</div>
									</div>
									<span className="text-muted-foreground/40 group-hover:text-primary text-xs font-bold tracking-widest uppercase transition-colors">
										Continue →
									</span>
								</Link>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
