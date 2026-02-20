import { getClientByIdAction } from "@/actions/clients";
import { ClientForm } from "@/components/clients/client-form";
import { Gender, ReferralSource } from "@/lib/types";
import { notFound } from "next/navigation";
import { getClientCategories } from "@/actions/settings";

// Next.js 15+ params are promises
type Params = Promise<{ id: string }>;

export default async function EditClientPage(props: { params: Params }) {
	const params = await props.params;
	const { id } = params;

    const [clientResult, categories] = await Promise.all([
        getClientByIdAction(id),
        getClientCategories()
    ]);
    
    const { client, error } = clientResult;

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
		categoryId: client.categoryId || undefined,
		gender: (client.gender as Exclude<Gender, Gender.ALL>) || Gender.MALE,
		referralSource: (client.referralSource as ReferralSource) || undefined,
		intakeData: (client.intakeData as Record<string, string>) || {},
		// Map existing active health logs for the form
		healthLogs: (client.healthLogs || []).map((log: any) => ({
			category: log.category,
			condition: log.condition,
			treatment: log.treatment || "",
			severity: log.severity,
			isAlert: log.isAlert,
			startDate: log.startDate,
		})),
		// Map active product for display
		activeProductId: client.activeProductId || undefined,
	};

	return <ClientForm mode="edit" initialData={initialData} categories={categories} />;
}
