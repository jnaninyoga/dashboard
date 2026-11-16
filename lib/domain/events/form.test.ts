import { describe, expect, it } from "vitest";

import { eventFormValues } from "./form";

describe("eventFormValues", () => {
	it("shows a saved outdoor session in Marrakech time", () => {
		// June 2026: Marrakech is UTC+1 in every version of the zone data.
		const values = eventFormValues({
			title: "Lever de soleil",
			titleEn: null,
			descriptionFr: "Une heure.",
			descriptionEn: null,
			startsAt: new Date("2026-06-20T06:00:00Z"),
			endsAt: new Date("2026-06-20T08:30:00Z"),
			placeName: null,
			placeMapsUrl: null,
			price: "250.00",
			capacity: 8,
			onWebsite: true,
		} as never);
		expect(values).toMatchObject({
			title: "Lever de soleil",
			date: "2026-06-20",
			startTime: "07:00",
			endTime: "09:30",
			price: "250",
			onWebsite: true,
			limited: true,
			capacity: "8",
			titleEn: "",
			placeName: "",
		});
	});

	it("reads a session without a price as free", () => {
		expect(eventFormValues({ title: "A", startsAt: new Date(), endsAt: new Date(), price: null, capacity: null, onWebsite: false } as never)).toMatchObject({
			price: "0",
			limited: false,
		});
	});
});
