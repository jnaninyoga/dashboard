import { getClientCategories } from "@/lib/actions/settings";
import { ClientForm } from "@/components/clients/form";

export default async function AddClientPage() {
    const categories = await getClientCategories();
	return <ClientForm mode="create" categories={categories} />;
}
