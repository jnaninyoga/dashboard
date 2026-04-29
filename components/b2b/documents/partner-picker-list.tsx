"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { type B2BPartner } from "@/lib/types/b2b";

import { Buildings, SearchNormal } from "iconsax-reactjs";

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
					className="text-muted-foreground/60 absolute top-1/2 left-3 -translate-y-1/2"
					variant="Outline"
				/>
				<Input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					autoFocus
					placeholder="Search by company, ICE, or address…"
					className="bg-secondary/5 focus-visible:ring-primary/20 h-11 rounded-xl border pl-10"
				/>
			</div>

			{filtered.length === 0 ? (
				<div className="border-secondary/10 bg-secondary/5 rounded-2xl border-2 border-dashed p-10 text-center">
					<p className="text-muted-foreground text-sm">
						No partners match{" "}
						<span className="font-mono font-bold">&quot;{query}&quot;</span>.
					</p>
				</div>
			) : (
				<ul className="divide-secondary/15 max-h-[60vh] divide-y overflow-y-auto">
					{filtered.map((p) => (
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
											<span className="font-mono text-[10px] text-amber-700/70">
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
	);
}
