import { notFound } from "next/navigation";

import { NewQuoteForm } from "@/components/b2b/documents/new-quote-form";
import { getNextDocumentNumber } from "@/lib/actions/b2b/documents";
import { getPartnerByIdAction } from "@/lib/actions/b2b/partners";

type Params = Promise<{ id: string }>;

export default async function NewQuotePage(props: { params: Params }) {
	const { id } = await props.params;
	const { partner } = await getPartnerByIdAction(id);
	if (!partner) return notFound();

	// Preview only — the canonical number is reserved server-side at insert.
	const previewNumber = await getNextDocumentNumber("quote");

	return (
		<NewQuoteForm
			partner={partner}
			contacts={partner.contacts || []}
			previewNumber={previewNumber}
		/>
	);
}
