import { type PaymentMethod } from "@/lib/validators/document";

import { Bank, Card, type Icon, Moneys, Note } from "iconsax-reactjs";

/** How a partner paid, in her words, with its icon. */
export const PAYMENT_METHOD: Record<PaymentMethod, { label: string; icon: Icon }> = {
	transfer: { label: "Transfer", icon: Bank },
	cheque: { label: "Cheque", icon: Note },
	cash: { label: "Cash", icon: Moneys },
	card: { label: "Card", icon: Card },
};
