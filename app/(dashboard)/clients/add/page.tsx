import { ClientForm } from "@/components/clients/form";
import { getClientCategories } from "@/lib/actions/settings";

export default async function AddClientPage() {
    const categories = await getClientCategories();
	return <ClientForm mode="create" categories={categories} />;
}
