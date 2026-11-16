import { ClientForm } from "@/components/clients/form";
import { getRequest } from "@/lib/actions/requests/queries";
import { getDiscounts } from "@/lib/actions/settings";
import { toE164 } from "@/lib/domain/requests/phone";
import { ReferralSource } from "@/lib/types/global";

/**
 * A new client. From a website booking (`?fromRequest=<id>`), the name and
 * phone they sent are already filled in, and the client is marked as having
 * found the studio through the website.
 */
export default async function AddClientPage({ searchParams }: { searchParams: Promise<{ fromRequest?: string }> }) {
	const { fromRequest } = await searchParams;
	const [discounts, request] = await Promise.all([
		getDiscounts(),
		fromRequest ? getRequest(fromRequest).then((result) => result.data ?? null) : Promise.resolve(null),
	]);
	const initialData =
		request && !request.erasedAt
			? { fullName: request.name, phone: toE164(request.phone) ?? request.phone, referralSource: ReferralSource.WEBSITE }
			: undefined;

	return <ClientForm mode="create" discounts={discounts} initialData={initialData} />;
}
