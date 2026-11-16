import { ClientForm } from "@/components/clients/form";
import { getRequest } from "@/lib/actions/requests/queries";
import { getDiscounts } from "@/lib/actions/settings";
import { toE164 } from "@/lib/domain/requests/phone";
import { ReferralSource } from "@/lib/types/global";

/**
 * A new client. From a website booking (`?fromBooking=<id>`), the name and
 * phone they sent are already filled in, and the client is marked as having
 * found the studio through the website.
 */
export default async function AddClientPage({ searchParams }: { searchParams: Promise<{ fromBooking?: string }> }) {
	const { fromBooking } = await searchParams;
	const [discounts, request] = await Promise.all([
		getDiscounts(),
		fromBooking ? getRequest(fromBooking).then((result) => result.data ?? null) : Promise.resolve(null),
	]);
	const initialData =
		request && !request.erasedAt
			? { fullName: request.name, phone: toE164(request.phone) ?? request.phone, referralSource: ReferralSource.WEBSITE }
			: undefined;

	return (
		<ClientForm
			mode="create"
			discounts={discounts}
			initialData={initialData}
			// Its own draft: an old half-filled form mustn't show another person here.
			draftSource={initialData ? `booking-${fromBooking}` : undefined}
		/>
	);
}
