/**
 * Copyright 2021-2022, 2025 Optimizely
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * FastlyRequestHandler implements the Optimizely SDK request-handler interface
 * using the Fastly Compute Fetch API.
 *
 * Fastly requires every outbound fetch to name a backend that is registered in
 * fastly.toml, so the backend is bound at construction time. An optional
 * CacheOverride is applied to responses (used for datafile caching at the
 * Fastly edge cache layer).
 *
 * @see https://developer.fastly.com/reference/api/backends/
 */
export class FastlyRequestHandler {
	/**
	 * @param {string} backend - Name of the Fastly backend to route requests to (must exist in fastly.toml).
	 * @param {CacheOverride} [cacheOverride] - Optional Fastly CacheOverride applied to the request.
	 */
	constructor(backend, cacheOverride) {
		this.backend = backend;
		this.cacheOverride = cacheOverride;
	}

	/**
	 * Make a fetch request through the configured Fastly backend.
	 * @param {string} requestUrl - The request URL
	 * @param {Record<string,string>} headers - Plain object of headers
	 * @param {string} method - HTTP method (normalized to uppercase)
	 * @param {any} [data] - Request body
	 * @returns {{responsePromise: Promise<{statusCode:number,body:string,headers:Object}>, abort: ()=>void}}
	 */
	makeRequest(requestUrl, headers, method, data) {
		method = (method || "GET").toUpperCase();
		headers = new Headers(headers || {});

		// AbortController is not available in the Fastly Compute runtime, so only
		// wire up cancellation when the runtime provides it (e.g. under Node tests).
		const controller =
			typeof AbortController !== "undefined" ? new AbortController() : null;

		const requestOptions = {
			method,
			headers,
			backend: this.backend,
		};

		if (controller) {
			requestOptions.signal = controller.signal;
		}

		if (this.cacheOverride) {
			requestOptions.cacheOverride = this.cacheOverride;
		}

		if (data != null) {
			requestOptions.body = data;
		}

		const responsePromise = fetch(requestUrl, requestOptions)
			.then(async (response) => {
				const body = (await response.text()) ?? "";

				return {
					statusCode: response.status,
					body,
					headers:
						response.headers && typeof response.headers.entries === "function"
							? Object.fromEntries(response.headers.entries())
							: {},
				};
			})
			.catch((error) => {
				if (error && error.name === "AbortError") {
					const abortError = new Error("Request aborted");
					abortError.name = "AbortError";
					throw abortError;
				}
				throw error;
			});

		return {
			responsePromise,
			abort: () => {
				if (controller) {
					controller.abort();
				}
			},
		};
	}
}
