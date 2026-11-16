import { describe, expect, it } from "vitest";

import { clientDraftKey } from "./draft";

describe("clientDraftKey", () => {
	it("keeps one draft for a new client and one per client being edited", () => {
		expect(clientDraftKey("create")).toBe("client-form-progress-create-new");
		expect(clientDraftKey("edit", "c-1")).toBe("client-form-progress-edit-c-1");
	});

	it("gives a client added from a booking a draft of their own", () => {
		expect(clientDraftKey("create", undefined, "booking-abc")).toBe("client-form-progress-create-booking-abc");
		expect(clientDraftKey("create", undefined, "booking-abc")).not.toBe(clientDraftKey("create"));
		expect(clientDraftKey("create", undefined, "booking-abc")).not.toBe(clientDraftKey("create", undefined, "booking-xyz"));
	});
});
