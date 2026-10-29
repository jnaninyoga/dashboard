"use client";

import { DocumentDashboardTable } from "@/components/b2b/documents/dashboard-table";

// 25 sample documents: enough to page, a mix of types and statuses.
const statuses = ["draft", "sent", "accepted", "unpaid", "partially_paid", "paid"] as const;
const docs = Array.from({ length: 25 }, (_, i) => {
	const type = i % 3 === 0 ? "quote" : "invoice";
	const total = 1000 + i * 150;
	return {
		id: `d-${i}`,
		type,
		status: statuses[i % statuses.length],
		documentNumber: `${type === "quote" ? "DEV" : "FAC"}-2026-${String(i + 1).padStart(3, "0")}`,
		issueDate: `2026-10-${String((i % 27) + 1).padStart(2, "0")}`,
		totalAmount: total.toFixed(2),
		partnerId: "p-1",
		parentDocumentId: type === "invoice" && i % 2 ? "q-1" : null,
		partner: { id: "p-1", companyName: i % 2 ? "Hotel Villa Taj" : "Riad Jnane" },
		contact: null,
		payments: statuses[i % statuses.length] === "partially_paid" ? [{ amount: "400.00" }] : [],
	};
}) as unknown as React.ComponentProps<typeof DocumentDashboardTable>["documents"];

export function TablesDemo() {
	return (
		<section className="bg-card grid gap-6 rounded-3xl border p-6">
			<h2 className="text-xl">Tables</h2>
			<div data-testid="docs-table">
				<DocumentDashboardTable documents={docs} />
			</div>
			<div data-testid="docs-empty">
				<DocumentDashboardTable documents={[]} />
			</div>
		</section>
	);
}
