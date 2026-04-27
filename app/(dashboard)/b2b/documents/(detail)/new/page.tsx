import Link from "next/link";

import { NewQuoteForm } from "@/components/b2b/documents/new-quote-form";
import { PartnerPickerList } from "@/components/b2b/documents/partner-picker-list";
import { peekNextDocumentNumber } from "@/lib/actions/b2b/documents";
import {
	getPartnerByIdAction,
	getPartnersAction,
} from "@/lib/actions/b2b/partners";

import { ArrowLeft, DocumentText } from "iconsax-reactjs";

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

	const previewNumber = await peekNextDocumentNumber("quote");

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
		<>
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
					<PartnerPickerList partners={partners} />
				)}
			</div>
		</>
	);
}
