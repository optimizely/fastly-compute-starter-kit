import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FastlyRequestHandler } from "../src/request_handler";

describe("FastlyRequestHandler", () => {
	let originalFetch;

	beforeEach(() => {
		originalFetch = global.fetch;
	});

	afterEach(() => {
		global.fetch = originalFetch;
		vi.restoreAllMocks();
	});

	it("routes the request through the configured Fastly backend", async () => {
		let receivedInit;
		global.fetch = vi.fn((url, init) => {
			void url;
			receivedInit = init;
			return Promise.resolve({
				status: 200,
				headers: { entries: () => [] },
				text: async () => "ok",
			});
		});

		const rh = new FastlyRequestHandler("optlycdn");
		const { responsePromise } = rh.makeRequest(
			"https://cdn.optimizely.com/datafiles/key.json",
			{},
			"GET",
		);

		const res = await responsePromise;
		expect(res.statusCode).toBe(200);
		expect(res.body).toBe("ok");
		expect(receivedInit.backend).toBe("optlycdn");
		expect(receivedInit.method).toBe("GET");
		expect(receivedInit.headers).toBeInstanceOf(Headers);
		expect(receivedInit.signal).toBeInstanceOf(AbortSignal);
	});

	it("applies a CacheOverride when provided", async () => {
		let receivedInit;
		global.fetch = vi.fn((url, init) => {
			void url;
			receivedInit = init;
			return Promise.resolve({
				status: 200,
				headers: { entries: () => [] },
				text: async () => "",
			});
		});

		const cacheOverride = new CacheOverride("override", { ttl: 60, swr: 60 });
		const rh = new FastlyRequestHandler("optlycdn", cacheOverride);
		const { responsePromise } = rh.makeRequest("https://example.test", {}, "GET");

		await responsePromise;
		expect(receivedInit.cacheOverride).toBe(cacheOverride);
	});

	it("parses the response body and headers", async () => {
		global.fetch = vi.fn(() =>
			Promise.resolve({
				status: 201,
				headers: {
					entries: () => [["content-type", "text/plain; charset=utf-8"]],
				},
				text: async () => "plain text body",
			}),
		);

		const rh = new FastlyRequestHandler("optlylogx");
		const { responsePromise } = rh.makeRequest("https://example.test", {}, "GET");

		const res = await responsePromise;
		expect(res.statusCode).toBe(201);
		expect(res.body).toBe("plain text body");
		expect(res.headers["content-type"]).toContain("text/plain");
	});

	it("returns an aborted error when the request is aborted", async () => {
		const abortErr = new Error("The user aborted a request.");
		abortErr.name = "AbortError";
		global.fetch = vi.fn(() => Promise.reject(abortErr));

		const rh = new FastlyRequestHandler("optlylogx");
		const { responsePromise, abort } = rh.makeRequest(
			"https://example.test/abort",
			{},
			"GET",
		);

		abort();

		await expect(responsePromise).rejects.toMatchObject({ name: "AbortError" });
	});

	it("sends the body for a POST request", async () => {
		let receivedInit;
		global.fetch = vi.fn((url, init) => {
			void url;
			receivedInit = init;
			return Promise.resolve({
				status: 200,
				headers: { entries: () => [] },
				text: async () => "",
			});
		});

		const rh = new FastlyRequestHandler("optlylogx");
		const { responsePromise } = rh.makeRequest(
			"https://example.test/post",
			{ "Content-Type": "application/json" },
			"POST",
			'{"a":1}',
		);

		await responsePromise;
		expect(receivedInit.method).toBe("POST");
		expect(receivedInit.body).toBe('{"a":1}');
		expect(receivedInit.backend).toBe("optlylogx");
	});
});
