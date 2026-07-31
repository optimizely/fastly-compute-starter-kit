// Test setup: mock the Fastly Compute globals that are not present in Node.
import { vi } from "vitest";

// fetch is mocked per-test; provide a default so imports don't crash.
global.fetch = vi.fn();

// crypto.randomUUID: force a deterministic value for assertions.
if (!globalThis.crypto) {
	globalThis.crypto = {};
}
globalThis.crypto.randomUUID = vi.fn(() => "test-uuid-123");

// Fastly's CacheOverride global (records its arguments for assertions).
globalThis.CacheOverride = class CacheOverride {
	constructor(mode, options) {
		this.mode = mode;
		this.options = options;
	}
};

// Fastly registers the request handler via addEventListener("fetch", ...).
// Mock it so index.js can register during import and tests can capture it.
globalThis.addEventListener = vi.fn();

// Mock console methods so tests can assert on log output.
global.console = {
	...console,
	info: vi.fn(),
	log: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
};
