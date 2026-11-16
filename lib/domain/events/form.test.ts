import { describe, expect, it } from "vitest";

import { eventFormValues } from "./form";

describe("eventFormValues", () => {
	it("shows a saved event in Marrakech time, across days", () => {
		// June 2026: Marrakech is UTC+1 in every version of the zone data.
		const values = eventFormValues({
			titleFr: "Retraite",
			titleEn: null,
			descriptionFr: "Deux jours.",
			descriptionEn: null,
			startsAt: new Date("2026-06-20T06:00:00Z"),
			endsAt: new Date("2026-06-21T16:30:00Z"),
			placeName: "Atlas",
			placeMapsUrl: null,
			price: "1200.00",
			capacity: 8,
		} as never);
		expect(values).toMatchObject({
			startDate: "2026-06-20",
			startTime: "07:00",
			endDate: "2026-06-21",
			endTime: "17:30",
			price: "1200",
			limited: true,
			capacity: "8",
			titleEn: "",
		});
	});

	it("starts a new event on the next Sunday morning", () => {
		const values = eventFormValues(null, new Date("2026-06-10T10:00:00Z"));
		expect(values).toMatchObject({ startDate: "2026-06-14", startTime: "08:00", endDate: "2026-06-14", limited: false });
	});
});
