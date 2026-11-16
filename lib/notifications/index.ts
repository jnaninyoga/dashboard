import { type BookingRequest } from "@/services/database/schema";

/** Tells Ouarda a booking arrived. Replaced by the real channels in the next commit. */
export async function notifyNewRequest(request: BookingRequest): Promise<void> {
	void request;
}
