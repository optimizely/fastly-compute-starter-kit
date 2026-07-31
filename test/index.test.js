import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../src/index.js";

// Mock the optimizely_helper module
vi.mock("../src/optimizely_helper.js", () => ({
	getOptimizelyClient: vi.fn(),
}));

// Mock the cookie module (named exports, as required under strict ESM)
vi.mock("cookie", () => ({
	parse: vi.fn(),
	serialize: vi.fn(),
}));

// Importing index.js above registered the fetch handler on the mocked
// addEventListener. Capture it so tests can invoke it directly.
const fetchListener = globalThis.addEventListener.mock.calls.find(
	(call) => call[0] === "fetch",
)[1];

/**
 * Invoke the registered fetch handler with a mock FetchEvent.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
function invoke(request) {
	let captured;
	fetchListener({
		request,
		respondWith: (promise) => {
			captured = promise;
		},
	});
	return captured;
}

describe("index.js - Fastly Compute", () => {
	let mockOptimizelyClient;
	let mockUserContext;
	let mockDecision;
	let getOptimizelyClient;
	let cookie;

	beforeEach(async () => {
		vi.clearAllMocks();

		const optimizelyHelper = await import("../src/optimizely_helper.js");
		cookie = await import("cookie");
		getOptimizelyClient = optimizelyHelper.getOptimizelyClient;

		mockDecision = {
			enabled: true,
			flagKey: "test-flag",
			userContext: { getUserId: vi.fn(() => "test-user-123") },
		};

		mockUserContext = {
			decide: vi.fn(() => mockDecision),
			decideAll: vi.fn(() => ({
				"test-flag": mockDecision,
				"another-flag": {
					enabled: false,
					flagKey: "another-flag",
					userContext: { getUserId: vi.fn(() => "test-user-123") },
				},
			})),
		};

		mockOptimizelyClient = {
			createUserContext: vi.fn(() => mockUserContext),
		};

		getOptimizelyClient.mockResolvedValue(mockOptimizelyClient);
		cookie.serialize.mockReturnValue("optimizely_user_id=test-uuid-123");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("generates a new user ID when no cookie is present", async () => {
		cookie.parse.mockReturnValue({});
		const response = await invoke(new Request("https://example.com"));

		expect(cookie.parse).toHaveBeenCalledWith("");
		expect(mockOptimizelyClient.createUserContext).toHaveBeenCalledWith(
			"test-uuid-123",
			{},
		);
		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("text/plain");
	});

	it("reuses the user ID from an existing cookie", async () => {
		cookie.parse.mockReturnValue({ optimizely_user_id: "existing-user-456" });
		const response = await invoke(
			new Request("https://example.com", {
				headers: { Cookie: "optimizely_user_id=existing-user-456" },
			}),
		);

		expect(cookie.parse).toHaveBeenCalledWith(
			"optimizely_user_id=existing-user-456",
		);
		expect(mockOptimizelyClient.createUserContext).toHaveBeenCalledWith(
			"existing-user-456",
			{},
		);
		expect(response.status).toBe(200);
	});

	it("decides a single flag and logs the result", async () => {
		cookie.parse.mockReturnValue({});
		await invoke(new Request("https://example.com"));

		expect(mockUserContext.decide).toHaveBeenCalledWith("YOUR_FLAG_HERE");
		expect(global.console.info).toHaveBeenCalledWith(
			'The Flag "test-flag" was Enabled for the user "test-user-123"',
		);
	});

	it("logs a disabled flag decision", async () => {
		mockDecision.enabled = false;
		cookie.parse.mockReturnValue({});
		await invoke(new Request("https://example.com"));

		expect(global.console.info).toHaveBeenCalledWith(
			'The Flag "test-flag" was Not Enabled for the user "test-user-123"',
		);
	});

	it("decides all flags and logs each result", async () => {
		cookie.parse.mockReturnValue({});
		await invoke(new Request("https://example.com"));

		expect(mockUserContext.decideAll).toHaveBeenCalled();
		expect(global.console.info).toHaveBeenCalledWith(
			'The Flag "test-flag" was Enabled for the user "test-user-123"',
		);
		expect(global.console.info).toHaveBeenCalledWith(
			'The Flag "another-flag" was Not Enabled for the user "test-user-123"',
		);
	});

	it("sets the Content-Type and Set-Cookie headers", async () => {
		cookie.parse.mockReturnValue({});
		const response = await invoke(new Request("https://example.com"));

		expect(response.headers.get("Content-Type")).toBe("text/plain");
		expect(cookie.serialize).toHaveBeenCalledWith(
			"optimizely_user_id",
			"test-uuid-123",
		);
		expect(response.headers.get("Set-Cookie")).toBe(
			"optimizely_user_id=test-uuid-123",
		);
	});

	it("returns the expected response body", async () => {
		cookie.parse.mockReturnValue({});
		const response = await invoke(new Request("https://example.com"));
		const text = await response.text();

		expect(text).toBe(
			'Welcome to the Optimizely Starter Kit. Check "fastly log-tail" for decision results.',
		);
	});

	it("degrades gracefully when the client fails to initialize", async () => {
		cookie.parse.mockReturnValue({});
		getOptimizelyClient.mockRejectedValue(new Error("SDK key missing"));

		const response = await invoke(new Request("https://example.com"));
		expect(response.status).toBe(200);
		const text = await response.text();
		expect(text).toContain("Feature flags unavailable");
		expect(global.console.error).toHaveBeenCalledWith(
			"Failed to initialize Optimizely client, continuing without feature flags:",
			expect.any(Error),
		);
	});

	it("degrades gracefully when a single decision throws", async () => {
		cookie.parse.mockReturnValue({});
		mockUserContext.decide.mockImplementation(() => {
			throw new Error("Decision error");
		});

		const response = await invoke(new Request("https://example.com"));
		expect(response.status).toBe(200);
		expect(global.console.error).toHaveBeenCalledWith(
			"Failed to decide for single flag, continuing:",
			expect.any(Error),
		);
	});

	it("degrades gracefully when decideAll throws", async () => {
		cookie.parse.mockReturnValue({});
		mockUserContext.decideAll.mockImplementation(() => {
			throw new Error("DecideAll error");
		});

		const response = await invoke(new Request("https://example.com"));
		expect(response.status).toBe(200);
		expect(global.console.error).toHaveBeenCalledWith(
			"Failed to decide for all flags, continuing:",
			expect.any(Error),
		);
	});
});
