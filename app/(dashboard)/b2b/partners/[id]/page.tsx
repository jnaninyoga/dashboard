import Link from "next/link";
import { notFound } from "next/navigation";

import { getPartnerByIdAction } from "@/actions/b2b-partners";
import { ContactDialog } from "@/components/b2b/contact-dialog";
import { ContactList } from "@/components/b2b/contact-list";
import { CopyableTaxId } from "@/components/b2b/copyable-tax-id";
import { DocumentDialog } from "@/components/b2b/document-dialog";
import { DocumentList } from "@/components/b2b/document-list";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
	ArrowLeft,
	Buildings,
	Document,
	Location,
	UserAdd,
} from "iconsax-reactjs";

type Params = Promise<{ id: string }>;

export default async function PartnerDetailPage(props: { params: Params }) {
	const { id } = await props.params;
	const { partner, error } = await getPartnerByIdAction(id);

	if (error || !partner) {
		return notFound();
	}

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
			{/* Breadcrumb & Navigation */}
			<Link
				href="/b2b/partners"
				className="group text-muted-foreground hover:text-primary flex items-center gap-2 text-sm transition-colors"
			>
				<ArrowLeft
					size={16}
					className="transition-transform group-hover:-translate-x-1"
				/>
				Back to Partners
			</Link>

			{/* Header Section */}
			<div className="animate-slide-up border-secondary/20 bg-card relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl border p-8 shadow-sm md:flex-row">
				<div className="text-primary absolute -top-10 right-0 p-8 opacity-10  ">
					<Buildings size={230} variant="Bulk" />
				</div>
				<div className="relative z-10 flex flex-col gap-4">
					<div className="flex items-center gap-4">
						<div className="border-primary/20 bg-primary/10 text-primary flex size-16 min-h-16 min-w-16 items-center justify-center rounded-2xl border shadow-inner">
							<Buildings size={32} variant="Bulk" />
						</div>
						<div className="space-y-1">
							<h1 className="font-heading text-foreground text-4xl font-bold tracking-tight">
								{partner.companyName}
							</h1>
							<div className="flex flex-wrap items-center gap-3">
								{partner.taxId ? <CopyableTaxId taxId={partner.taxId} /> : null}
							</div>
						</div>
					</div>

					<div className="text-muted-foreground/90 mt-2 flex flex-col gap-4 sm:flex-row">
						{partner.address ? (
							<div className="flex max-w-sm items-start gap-2">
								<Location
									size={18}
									variant="Bulk"
									className="text-primary/60 shrink-0"
								/>
								<span className="text-sm leading-relaxed font-medium">
									{partner.address}
								</span>
							</div>
						) : null}
					</div>
				</div>

				<div className="relative z-10 flex shrink-0 flex-col justify-center gap-3">
					<div className="border-secondary-3/10 bg-secondary/60 flex items-center gap-4 rounded-2xl border px-6 py-4 shadow-xs backdrop-blur-sm">
						<div className="text-center">
							<div className="text-foreground text-2xl font-bold">
								{partner.contacts?.length || 0}
							</div>
							<div className="text-secondary-foreground text-xs font-bold tracking-widest uppercase">
								Contacts
							</div>
						</div>
						<Separator orientation="vertical" className="mx-2 h-8" />
						<div className="text-center">
							<div className="text-foreground text-2xl font-bold">
								{partner.documents?.length || 0}
							</div>
							<div className="text-secondary-foreground text-xs font-bold tracking-widest uppercase">
								Docs
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				{/* Contacts Column */}
				<div className="animate-slide-left space-y-6 lg:col-span-1">
					<div className="flex items-center justify-between px-2">
						<h2 className="font-heading flex items-center gap-2 text-xl font-bold">
							<UserAdd size={20} variant="Bulk" className="text-primary" />
							Contacts
						</h2>
						<ContactDialog partnerId={partner.id}>
							<Button
								size="sm"
								variant="outline"
								className="hover:bg-primary hover:text-primary-foreground rounded-full shadow-xs transition-all"
							>
								<UserAdd className="mr-2 h-4 w-4" variant="Outline" />
								New
							</Button>
						</ContactDialog>
					</div>
					<ContactList contacts={partner.contacts || []} />
				</div>

				{/* Documents Column */}
				<div className="animate-slide-right space-y-6 lg:col-span-2">
					<div className="flex items-center justify-between px-2">
						<h2 className="font-heading flex items-center gap-2 text-xl font-bold">
							<Document size={20} variant="Bulk" className="text-primary" />
							Documents (Quotes & Invoices)
						</h2>
						<DocumentDialog
							partnerId={partner.id}
							contacts={partner.contacts || []}
						>
							<Button
								size="sm"
								variant="outline"
								className="hover:bg-primary hover:text-primary-foreground rounded-full shadow-xs transition-all"
							>
								<Document size={16} className="mr-2" variant="Outline" />
								New Document
							</Button>
						</DocumentDialog>
					</div>
					<DocumentList
						documents={partner.documents || []}
						partnerId={partner.id}
						contacts={partner.contacts || []}
					/>
				</div>
			</div>
		</div>
	);
}
