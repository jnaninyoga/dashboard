import { getClientByIdAction } from "@/actions/clients";
import { ClientForm } from "@/components/clients/client-form";
import { notFound } from "next/navigation";

// Next.js 15+ params are promises
type Params = Promise<{ id: string }>;

export default async function EditClientPage(props: { params: Params }) {
	const params = await props.params;
	const { id } = params;

	const { client, error } = await getClientByIdAction(id);

	if (error || !client) {
		notFound();
	}

	// Cast DB client to FormValues
	// We need to map DB fields to our Form schema
	// Specifically ensuring intakeData is Record<string, string>
	// Drizzle jsonb is typed as unknown or any usually, we assume it matches

	// Also date handling: DB might return Date object or string depending on driver
	// HTML form expects "YYYY-MM-DD" string.

	const formattedDate = client.birthDate; // Drizzle 'date' type usually returns string "YYYY-MM-DD"

	const initialData = {
		...client,
		id: client.id,
		birthDate: formattedDate,
		intakeData: (client.intakeData as Record<string, string>) || {},
		// Ensure nullable fields are undefined if null for Reack Hook Form defaults (sometimes it prefers undefined)
		email: client.email || undefined,
		phone: client.phone, // not null
		address: client.address || undefined,
		profession: client.profession || undefined,
		consultationReason: client.consultationReason || "",
		referralSource: client.referralSource || undefined,
		gender: client.gender || undefined,
	};

	return <ClientForm mode="edit" initialData={initialData} />;
}
