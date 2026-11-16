import { type RebuildOutcome } from "@/lib/website/rebuild";

import { notify } from "./notify";

/** After a save the website shows: when it will be live, or that it didn't update. */
export function notifyWebsite(outcome: RebuildOutcome | undefined) {
	if (outcome === "requested") notify.info("On the website in about 2 minutes");
	else if (outcome === "failed") notify.warning("Saved. The website didn't update", "Try again in a minute, or tell the developer.");
}
