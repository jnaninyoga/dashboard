import { getClientByIdAction } from "@/actions/clients";
import { ClientForm } from "@/components/clients/client-form";
import { ClientCategory, Gender, ReferralSource } from "@/lib/types";
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

	const formattedDate = client.birthDate;

	const initialData = {
		id: client.id,
		fullName: client.fullName,
		email: client.email || undefined,
		phone: client.phone,
		address: client.address || undefined,
		birthDate: formattedDate,
		profession: client.profession || undefined,
		consultationReason: client.consultationReason || "",
// ...
		// Use ClientFormValues['category'] or Exclude<ClientCategory, ClientCategory.ALL>
		category: (client.category as Exclude<ClientCategory, ClientCategory.ALL>) || ClientCategory.ADULT,
// Use Exclude to narrow the type to allowed values
		gender: (client.gender as Exclude<Gender, Gender.ALL>) || Gender.MALE,
		referralSource: (client.referralSource as ReferralSource) || undefined,
		intakeData: (client.intakeData as Record<string, string>) || {},
	};

	return <ClientForm mode="edit" initialData={initialData} />;
}
