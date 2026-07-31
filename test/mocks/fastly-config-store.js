/**
 * Test mock for the Fastly `fastly:config-store` runtime module.
 *
 * Backed by `globalThis.__CONFIG_STORE__`:
 * - set it to an object to simulate an existing store with those key/value pairs
 * - set it to null/undefined to simulate a missing store (constructor throws)
 */
export class ConfigStore {
	constructor(name) {
		this.name = name;
		if (!globalThis.__CONFIG_STORE__) {
			throw new TypeError(`ConfigStore "${name}" not found`);
		}
	}

	get(key) {
		const value = globalThis.__CONFIG_STORE__[key];
		return value === undefined ? null : value;
	}
}
