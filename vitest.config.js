import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		setupFiles: ["./test/setup.js"],
		alias: {
			// Fastly runtime modules are not resolvable in Node; map to local mocks.
			"fastly:config-store": fileURLToPath(
				new URL("./test/mocks/fastly-config-store.js", import.meta.url),
			),
		},
	},
});
