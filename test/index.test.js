import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../src/index.js";

// Mock the optimizely_helper module
vi.mock("../src/optimizely_helper.js", () => ({
	getOptimizelyClient: vi.fn(),
}));

// Mock the cookie module (v2 named exports, as required under strict ESM)
vi.mock("cookie", () => ({
	parseCookie: vi.fn(),
	stringifySetCookie: vi.fn(),
}));

// Importing index.js above registered the fetch handler on the mocked
// addEventListener. Capture it so tests can invoke it directly.
const fetchListener = globalThis.addEventListener.mock.calls.find(
	(call) => call[0] === "fetch",
)[1];

/**
 * Invoke the registered fetch handler with a mock FetchEvent.
 * @param {Request} request
 * @returns {{response: Promise<Response>, event: {waitUntil: import("vitest").Mock}}}
 */
function invokeWithEvent(request) {
	let captured;
	const event = {
		request,
		waitUntil: vi.fn(),
		respondWith: (promise) => {
			captured = promise;
		},
	};
	fetchListener(event);
	return { response: captured, event };
}

/**
 * Invoke the registered fetch handler and return only the response promise.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
function invoke(request) {
	return invokeWithEvent(request).response;
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
		cookie.stringifySetCookie.mockReturnValue(
			"optimizely_user_id=test-uuid-123",
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("generates a new user ID when no cookie is present", async () => {
		cookie.parseCookie.mockReturnValue({});
		const response = await invoke(new Request("https://example.com"));

		expect(cookie.parseCookie).toHaveBeenCalledWith("");
		expect(mockOptimizelyClient.createUserContext).toHaveBeenCalledWith(
			"test-uuid-123",
			{},
		);
		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("text/plain");
	});

	it("reuses the user ID from an existing cookie", async () => {
		cookie.parseCookie.mockReturnValue({
			optimizely_user_id: "existing-user-456",
		});
		const response = await invoke(
			new Request("https://example.com", {
				headers: { Cookie: "optimizely_user_id=existing-user-456" },
			}),
		);

		expect(cookie.parseCookie).toHaveBeenCalledWith(
			"optimizely_user_id=existing-user-456",
		);
		expect(mockOptimizelyClient.createUserContext).toHaveBeenCalledWith(
			"existing-user-456",
			{},
		);
		expect(response.status).toBe(200);
	});

	it("decides a single flag and logs the result", async () => {
		cookie.parseCookie.mockReturnValue({});
		await invoke(new Request("https://example.com"));

		expect(mockUserContext.decide).toHaveBeenCalledWith("YOUR_FLAG_HERE");
		expect(global.console.info).toHaveBeenCalledWith(
			'The Flag "test-flag" was Enabled for the user "test-user-123"',
		);
	});

	it("logs a disabled flag decision", async () => {
		mockDecision.enabled = false;
		cookie.parseCookie.mockReturnValue({});
		await invoke(new Request("https://example.com"));

		expect(global.console.info).toHaveBeenCalledWith(
			'The Flag "test-flag" was Not Enabled for the user "test-user-123"',
		);
	});

	it("decides all flags and logs each result", async () => {
		cookie.parseCookie.mockReturnValue({});
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
		cookie.parseCookie.mockReturnValue({});
		const response = await invoke(new Request("https://example.com"));

		expect(response.headers.get("Content-Type")).toBe("text/plain");
		expect(cookie.stringifySetCookie).toHaveBeenCalledWith({
			name: "optimizely_user_id",
			value: "test-uuid-123",
			path: "/",
		});
		expect(response.headers.get("Set-Cookie")).toBe(
			"optimizely_user_id=test-uuid-123",
		);
	});

	it("returns the expected response body", async () => {
		cookie.parseCookie.mockReturnValue({});
		const response = await invoke(new Request("https://example.com"));
		const text = await response.text();

		expect(text).toBe(
			'Welcome to the Optimizely Starter Kit. Check "fastly log-tail" for decision results.',
		);
	});

	it("primes waitUntil synchronously inside the fetch callback", () => {
		cookie.parseCookie.mockReturnValue({});
		const { event } = invokeWithEvent(new Request("https://example.com"));

		// Must be called synchronously, before any await, so later event dispatches
		// can register keep-alive promises.
		expect(event.waitUntil).toHaveBeenCalledTimes(1);
		expect(event.waitUntil.mock.calls[0][0]).toBeInstanceOf(Promise);
	});

	it("passes a keepAlive registrar to getOptimizelyClient", async () => {
		cookie.parseCookie.mockReturnValue({});
		const { response, event } = invokeWithEvent(
			new Request("https://example.com"),
		);
		await response;

		expect(getOptimizelyClient).toHaveBeenCalledWith(expect.any(Function));

		// The registrar must route through event.waitUntil.
		const registrar = getOptimizelyClient.mock.calls[0][0];
		const promise = Promise.resolve();
		registrar(promise);
		expect(event.waitUntil).toHaveBeenCalledWith(promise);
	});

	it("degrades gracefully when the client fails to initialize", async () => {
		cookie.parseCookie.mockReturnValue({});
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
		cookie.parseCookie.mockReturnValue({});
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
		cookie.parseCookie.mockReturnValue({});
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
