import { ClientForm } from "@/components/clients/client-form";
import { getClientCategories } from "@/actions/settings";

export default async function AddClientPage() {
    const categories = await getClientCategories();
	return <ClientForm mode="create" categories={categories} />;
}
