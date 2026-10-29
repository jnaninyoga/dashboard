import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
	},
	test: {
		include: ["lib/**/*.test.ts"],
		environment: "node",
		// Dates are formatted in the studio's zone; pin the runner's own zone so
		// a test can't pass only because the machine happens to be in Morocco.
		env: { TZ: "UTC" },
	},
});
