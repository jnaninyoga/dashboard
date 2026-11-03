"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { type B2BPartner } from "@/lib/types/b2b";

import { ArrowRight2, Buildings, SearchNormal, Warning2 } from "iconsax-reactjs";

export function PartnerPickerList({ partners }: { partners: B2BPartner[] }) {
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return partners;
		const qDigits = q.replace(/\D/g, "");
		return partners.filter((p) => {
			if (p.companyName.toLowerCase().includes(q)) return true;
			if (p.address?.toLowerCase().includes(q)) return true;
			// Tax id match: tolerate any separators the user typed.
			if (qDigits && p.taxId?.replace(/\D/g, "").includes(qDigits)) return true;
			return false;
		});
	}, [partners, query]);

	return (
		<div className="space-y-4">
			<div className="relative">
				<SearchNormal
					size={16}
					className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground/60"
					variant="Outline"
				/>
				<Input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					autoFocus
					placeholder="Search by company, ICE, or address…"
					className="h-11 rounded-xl pl-10"
				/>
			</div>

			{filtered.length === 0 ? (
				<div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
					<p className="text-sm text-muted-foreground">
						No partner matches <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span>.
					</p>
				</div>
			) : (
				<ul className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
					{filtered.map((p) => (
						<li key={p.id}>
							<Link
								href={`/b2b/documents/new?partner=${p.id}`}
								className="group flex min-h-16 items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
							>
								<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
									<Buildings size={20} variant="Bulk" />
								</span>
								<span className="flex min-w-0 flex-1 flex-col">
									<span className="truncate font-semibold text-foreground">{p.companyName}</span>
									{p.taxId ? (
										<span className="truncate text-sm text-muted-foreground tabular-nums">ICE {p.taxId}</span>
									) : (
										// Flagged: the partner's ICE (tax id) is printed on their documents.
										<span className="flex items-center gap-1 text-sm text-warning">
											<Warning2 size={14} variant="Bold" aria-hidden />
											No ICE yet
										</span>
									)}
								</span>
								<ArrowRight2
									size={18}
									className="shrink-0 text-muted-foreground transition-[color,translate] group-hover:translate-x-0.5 group-hover:text-primary"
								/>
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
