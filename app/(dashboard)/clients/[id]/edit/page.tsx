import { notFound } from "next/navigation";

import { getClientByIdAction } from "@/actions/clients/queries";
import { getClientCategories } from "@/actions/settings";
import { ClientForm } from "@/components/clients/client-form";
import { Gender, HealthCategory, HealthSeverity, ReferralSource } from "@/lib/types";

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
		healthLogs: (client.healthLogs || []).map((log: { 
            id: string;
            clientId: string;
            category: string; 
            condition: string; 
            treatment: string | null; 
            severity: string; 
            isAlert: boolean; 
            startDate: string; 
            endDate: string | null;
        }) => ({
            id: log.id,
            clientId: log.clientId,
			category: log.category as HealthCategory,
			condition: log.condition,
			treatment: log.treatment || "",
			severity: log.severity as HealthSeverity,
			isAlert: log.isAlert,
			startDate: log.startDate,
            endDate: log.endDate,
		})),
		// Map active product for display
		activeProductId: client.activeProductId || undefined,
	};

	return <ClientForm mode="edit" initialData={initialData} categories={categories} />;
}
