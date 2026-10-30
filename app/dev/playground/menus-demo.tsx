"use client";

import { PartnerGrid } from "@/components/b2b/partners/grid";
import { PartnerTable } from "@/components/b2b/partners/table";
import { ClientsGrid } from "@/components/clients/grid";
import { ClientsTable } from "@/components/clients/table";

// Sample rows so every ⋮ menu can be clicked without signing in.
const now = new Date("2026-10-01T10:00:00Z");
const partners = [
	{ id: "p-1", companyName: "Hotel Villa Taj", address: "Marrakech", taxId: "001524300000089", createdAt: now, updatedAt: now, contacts: [], documents: [] },
] as unknown as React.ComponentProps<typeof PartnerGrid>["partners"];
const clients = [
	{
		id: "c-1", fullName: "Salma Bennani", phone: "+212600000001", email: null, address: null,
		birthDate: "1990-04-02", gender: "female", profession: null, consultationReason: null,
		referralSource: null, discountId: null, intakeData: {}, createdAt: now, photoUrl: null,
		googleContactResourceName: null, wallets: [], healthLogs: [], category: null,
	},
] as unknown as React.ComponentProps<typeof ClientsTable>["clients"];

export function MenusDemo() {
	return (
		<section className="bg-card grid gap-6 rounded-3xl border p-6" data-testid="menus-demo">
			<h2 className="text-xl">Row and card menus</h2>
			<PartnerGrid partners={partners} />
			<PartnerTable partners={partners} />
			<ClientsGrid clients={clients as unknown as React.ComponentProps<typeof ClientsGrid>["clients"]} />
			<ClientsTable clients={clients} />
		</section>
	);
}
