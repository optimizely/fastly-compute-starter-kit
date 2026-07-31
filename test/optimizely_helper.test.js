import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockFetchResponse, setConfigStore } from "./test-utils.js";

vi.mock("@optimizely/optimizely-sdk/universal", () => ({
	createInstance: vi.fn(),
	createStaticProjectConfigManager: vi.fn(),
	createForwardingEventProcessor: vi.fn(),
	createEventDispatcher: vi.fn(() => ({})),
}));

let getDatafile;
let getOptimizelyClient;

describe("Optimizely Helper", () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		vi.resetModules();
		setConfigStore({ sdk_key: "test-key" });

		const mod = await import("../src/optimizely_helper.js");
		getDatafile = mod.getDatafile;
		getOptimizelyClient = mod.getOptimizelyClient;
	});

	afterEach(() => {
		vi.restoreAllMocks();
		setConfigStore(null);
	});

	describe("getDatafile", () => {
		it("fetches the datafile through the CDN backend with a CacheOverride", async () => {
			global.fetch = vi
				.fn()
				.mockResolvedValue(mockFetchResponse('{"version":"4"}'));

			const result = await getDatafile("test-sdk-key", 600);

			expect(global.fetch).toHaveBeenCalledWith(
				"https://cdn.optimizely.com/datafiles/test-sdk-key.json",
				expect.objectContaining({
					method: "GET",
					backend: "optlycdn",
					headers: expect.any(Headers),
					signal: expect.any(AbortSignal),
					cacheOverride: expect.any(CacheOverride),
				}),
			);
			expect(result).toBe('{"version":"4"}');
		});

		it("throws on a non-2xx status", async () => {
			global.fetch = vi
				.fn()
				.mockResolvedValue(mockFetchResponse("not found", { status: 404 }));

			await expect(getDatafile("test-sdk-key", 600)).rejects.toThrow(
				/status 404/,
			);
		});

		it("propagates fetch errors", async () => {
			global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

			await expect(getDatafile("test-sdk-key", 600)).rejects.toThrow(
				"Network error",
			);
		});
	});

	describe("getOptimizelyClient", () => {
		let mockCreateInstance;
		let mockCreateStaticProjectConfigManager;
		let mockCreateForwardingEventProcessor;
		let mockClient;
		let mockProjectConfigManager;
		let mockEventProcessor;

		beforeEach(async () => {
			const {
				createInstance,
				createStaticProjectConfigManager,
				createForwardingEventProcessor,
			} = await import("@optimizely/optimizely-sdk/universal");

			mockCreateInstance = createInstance;
			mockCreateStaticProjectConfigManager = createStaticProjectConfigManager;
			mockCreateForwardingEventProcessor = createForwardingEventProcessor;

			mockClient = { setDatafile: vi.fn() };
			mockProjectConfigManager = {};
			mockEventProcessor = {};

			mockCreateInstance.mockReturnValue(mockClient);
			mockCreateStaticProjectConfigManager.mockReturnValue(
				mockProjectConfigManager,
			);
			mockCreateForwardingEventProcessor.mockReturnValue(mockEventProcessor);

			global.fetch = vi
				.fn()
				.mockResolvedValue(mockFetchResponse('{"version":"4"}'));
		});

		it("throws when the Config Store is missing", async () => {
			setConfigStore(null);
			await expect(getOptimizelyClient()).rejects.toThrow(/not found/);
		});

		it("throws when the sdk_key is not set", async () => {
			setConfigStore({});
			await expect(getOptimizelyClient()).rejects.toThrow(/sdk_key/);
		});

		it("creates a client on the first call", async () => {
			const client = await getOptimizelyClient();

			expect(global.fetch).toHaveBeenCalledWith(
				"https://cdn.optimizely.com/datafiles/test-key.json",
				expect.objectContaining({
					method: "GET",
					backend: "optlycdn",
					signal: expect.any(AbortSignal),
				}),
			);
			expect(mockCreateStaticProjectConfigManager).toHaveBeenCalledWith({
				datafile: '{"version":"4"}',
			});
			expect(mockCreateForwardingEventProcessor).toHaveBeenCalledWith(
				expect.any(Object),
			);
			expect(mockCreateInstance).toHaveBeenCalledWith({
				projectConfigManager: mockProjectConfigManager,
				eventProcessor: mockEventProcessor,
				requestHandler: expect.any(Object),
				clientEngine: "javascript-sdk/fastly",
				disposable: true,
			});
			expect(client).toBe(mockClient);
		});

		it("does not re-fetch the datafile within the TTL", async () => {
			await getOptimizelyClient();

			global.fetch.mockClear();

			await getOptimizelyClient();

			expect(global.fetch).not.toHaveBeenCalled();
		});

		it("refreshes the datafile after the TTL expires", async () => {
			const originalDateNow = Date.now;
			let currentTime = 1000000000000;
			Date.now = vi.fn(() => currentTime);

			try {
				await getOptimizelyClient();

				currentTime += 301000; // beyond the 300s default TTL

				global.fetch = vi
					.fn()
					.mockResolvedValue(mockFetchResponse('{"version":"5"}'));

				await getOptimizelyClient();

				expect(global.fetch).toHaveBeenCalledTimes(1);
				expect(mockCreateStaticProjectConfigManager).toHaveBeenCalledTimes(2);
				expect(mockCreateInstance).toHaveBeenCalledTimes(2);
			} finally {
				Date.now = originalDateNow;
			}
		});
	});
});
