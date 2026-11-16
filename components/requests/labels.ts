// Plain words about a request, for server and client components alike (a
// server component can't call a function exported from a "use client" file).

import { type BookingRequest } from "@/services/database/schema";

/** Who the request is from, or that their details were erased. */
export function requestTitle(request: Pick<BookingRequest, "name" | "erasedAt">): string {
	return request.erasedAt ? "Details erased" : request.name;
}
