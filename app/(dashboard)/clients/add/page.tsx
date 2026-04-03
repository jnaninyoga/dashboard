import { getClientCategories } from "@/actions/settings";
import { ClientForm } from "@/components/clients/client-form";

export default async function AddClientPage() {
    const categories = await getClientCategories();
	return <ClientForm mode="create" categories={categories} />;
}
