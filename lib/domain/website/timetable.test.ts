import { DEFAULT_HOURS } from "@/lib/config/schedule";

import { describe, expect, it } from "vitest";

import { daysWords, hoursHeadline, siteHours } from "./timetable";

const period = (start: string, end: string) => ({ start, end });
const six = DEFAULT_HOURS["1"].periods;

describe("siteHours", () => {
	it("says the website's week as it always has", () => {
		expect(siteHours(DEFAULT_HOURS)).toEqual({
			groups: [
				{
					days: [1, 4],
					periods: six,
					words: { fr: { daysAnd: "lundi et jeudi", daysOr: "lundi ou jeudi" }, en: { daysAnd: "Monday and Thursday", daysOr: "Monday or Thursday" } },
				},
			],
			words: { fr: { headline: "Lundi et jeudi, six rendez-vous." }, en: { headline: "Mondays and Thursdays, six sessions." } },
		});
	});
});

describe("hoursHeadline", () => {
	it("says a straight day by its hours", () => {
		expect(hoursHeadline([{ days: [3], periods: [period("09:00", "18:30")] }])).toEqual({
			fr: "Le mercredi, de 9h à 18h30.",
			en: "Wednesdays, 9:00 to 18:30.",
		});
	});

	it("counts the days when they don't share their periods", () => {
		expect(hoursHeadline([{ days: [1, 4], periods: six }, { days: [2], periods: [period("09:00", "18:00")] }])).toEqual({
			fr: "Trois jours par semaine.",
			en: "Three days a week.",
		});
	});

	it("says every day, and by appointment when the studio is closed all week", () => {
		expect(hoursHeadline([{ days: [0, 1, 2, 3, 4, 5, 6], periods: six }]).fr).toBe("Tous les jours, six rendez-vous.");
		expect(hoursHeadline([])).toEqual({ fr: "Sur rendez-vous.", en: "By appointment." });
	});

	it("uses digits above twelve", () => {
		const many = Array.from({ length: 13 }, (_, i) => period(`${String(8 + i).padStart(2, "0")}:00`, `${String(8 + i).padStart(2, "0")}:45`));
		expect(hoursHeadline([{ days: [1], periods: many }]).en).toBe("Mondays, 13 sessions.");
	});
});

describe("daysWords", () => {
	it("joins the days with and and with or, Saturday before Sunday", () => {
		expect(daysWords([1, 3, 5]).en).toEqual({ daysAnd: "Monday, Wednesday and Friday", daysOr: "Monday, Wednesday or Friday" });
		expect(daysWords([6, 0]).fr.daysAnd).toBe("samedi et dimanche");
		expect(daysWords([0, 1, 2, 3, 4, 5, 6]).en.daysOr).toBe("any day");
	});
});
