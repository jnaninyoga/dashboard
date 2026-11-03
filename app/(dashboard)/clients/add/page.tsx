import { ClientForm } from "@/components/clients/form";
import { getDiscounts } from "@/lib/actions/settings";

export default async function AddClientPage() {
    const discounts = await getDiscounts();
	return <ClientForm mode="create" discounts={discounts} />;
}
