import { vi } from "vitest";

/**
 * Populate the mock Fastly Config Store used by src/optimizely_helper.js.
 * Pass null to simulate a missing store.
 * @param {Object|null} contents - Key/value pairs, or null for "no store".
 */
export function setConfigStore(contents) {
	globalThis.__CONFIG_STORE__ = contents;
}

/**
 * Build a mock fetch Response shaped like the object FastlyRequestHandler reads.
 * @param {string} body - Response body text
 * @param {Object} [options] - { status, contentType }
 * @returns {Object} Mock response
 */
export function mockFetchResponse(body, options = {}) {
	const { status = 200, contentType = "application/json" } = options;
	return {
		status,
		ok: status >= 200 && status < 300,
		headers: {
			get: (k) =>
				k.toLowerCase() === "content-type" ? contentType : undefined,
			entries: () => [["content-type", contentType]],
		},
		text: vi.fn().mockResolvedValue(body),
		json: vi.fn().mockResolvedValue(body),
	};
}
