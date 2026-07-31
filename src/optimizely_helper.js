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

import { ConfigStore } from "fastly:config-store";
import {
	createEventDispatcher,
	createForwardingEventProcessor,
	createInstance,
	createStaticProjectConfigManager,
} from "@optimizely/optimizely-sdk/universal";
import { FastlyRequestHandler } from "./request_handler";

/**
 * Client engine identifier for Optimizely SDK telemetry.
 * @type {string}
 */
const FASTLY_CLIENT_ENGINE = "javascript-sdk/fastly";

/**
 * Name of the Fastly Config Store that holds Optimizely configuration.
 * Configure it in fastly.toml ([setup.config_stores] and [local_server.config_stores]).
 * @type {string}
 */
const CONFIG_STORE_NAME = "optimizely";

/**
 * Fastly backend names. These must match the backends declared in fastly.toml.
 * @type {string}
 */
const BACKEND_CDN = "optlycdn";
const BACKEND_LOGX = "optlylogx";

/**
 * Default cache TTL for the Optimizely datafile in seconds.
 * Overridable via the "datafile_ttl_seconds" key in the Config Store.
 * @type {number}
 */
const DEFAULT_DATAFILE_CACHE_TTL_SECONDS = 300; // 5 minutes

/**
 * Module-scope cache for the datafile. In Fastly Compute this is a secondary
 * cache that only helps when an instance is reused; the primary datafile cache
 * is the Fastly edge cache via CacheOverride in getDatafile().
 * @type {string|null}
 */
let cachedDatafile = null;

/**
 * Timestamp (ms since epoch) of the last datafile fetch attempt: a successful
 * fetch, or a failed refresh that fell back to the cached datafile. Used to
 * gate refreshes to at most once per TTL window.
 * @type {number}
 */
let lastDatafileUpdate = 0;

/**
 * Read Optimizely configuration from the Fastly Config Store.
 *
 * @returns {{sdkKey: string, datafileTtlSeconds: number}}
 * @throws {Error} If the Config Store is missing or the SDK key is not set.
 */
function getConfig() {
	let store;
	try {
		store = new ConfigStore(CONFIG_STORE_NAME);
	} catch (_error) {
		throw new Error(
			`Config Store "${CONFIG_STORE_NAME}" not found. Create it and add an "sdk_key" ` +
				"item (see fastly.toml and the README).",
		);
	}

	const sdkKey = store.get("sdk_key");
	if (!sdkKey) {
		throw new Error(
			`"sdk_key" is not set in the "${CONFIG_STORE_NAME}" Config Store. ` +
				"Add your Optimizely SDK key (see the README).",
		);
	}

	const ttlValue = store.get("datafile_ttl_seconds");
	const parsedTtl = Number.parseInt(ttlValue, 10);
	const datafileTtlSeconds =
		Number.isNaN(parsedTtl) || parsedTtl < 0
			? DEFAULT_DATAFILE_CACHE_TTL_SECONDS
			: parsedTtl;

	return { sdkKey, datafileTtlSeconds };
}

/**
 * Fetch the Optimizely datafile from the CDN through the Fastly backend,
 * caching it at the Fastly edge with a stale-while-revalidate window.
 *
 * @param {string} sdkKey - The Optimizely SDK key for the project
 * @param {number} ttl - Edge cache TTL in seconds
 * @returns {Promise<string>} The datafile JSON as a string
 * @throws {Error} If the request fails or returns a non-OK status
 * @see https://docs.developers.optimizely.com/feature-experimentation/docs/get-the-datafile
 */
export async function getDatafile(sdkKey, ttl) {
	const cacheOverride = new CacheOverride("override", { ttl, swr: 60 });
	const requestHandler = new FastlyRequestHandler(BACKEND_CDN, cacheOverride);
	const url = `https://cdn.optimizely.com/datafiles/${sdkKey}.json`;

	const { responsePromise } = requestHandler.makeRequest(url, {}, "GET");
	const response = await responsePromise;

	if (response.statusCode < 200 || response.statusCode >= 300) {
		throw new Error(
			`Datafile request failed with status ${response.statusCode} for SDK key ${sdkKey}.`,
		);
	}

	return response.body;
}

/**
 * Get an Optimizely client instance with cached datafile management.
 *
 * Caching strategy:
 * - Datafile is cached at the Fastly edge via CacheOverride (primary).
 * - A module-scope copy avoids re-parsing on instance reuse and provides a
 *   stale fallback if a refresh fetch fails (resilience pattern).
 * - A fresh client is created per request and wired for edge use:
 *   static project config manager (no polling) + forwarding event processor.
 *
 * @param {(p: Promise<unknown>) => void} [keepAlive] - Optional keep-alive registrar
 *   (e.g. `event.waitUntil`). Threaded to the event request handler only, so
 *   fire-and-forget event dispatches survive past the client response. The datafile
 *   handler does not need it — it is awaited during initialization.
 * @returns {Promise<Object>} Configured Optimizely client instance
 * @throws {Error} If configuration is missing or the initial datafile fetch fails
 * @see https://docs.developers.optimizely.com/feature-experimentation/docs/initialize-the-javascript-sdk
 */
export async function getOptimizelyClient(keepAlive) {
	const { sdkKey, datafileTtlSeconds } = getConfig();

	const now = Date.now();
	const isDatafileStale = now - lastDatafileUpdate > datafileTtlSeconds * 1000;

	if (!cachedDatafile || isDatafileStale) {
		try {
			cachedDatafile = await getDatafile(sdkKey, datafileTtlSeconds);
			lastDatafileUpdate = now;
		} catch (error) {
			if (cachedDatafile) {
				// Record the attempt so a failing CDN is retried at most once per
				// TTL window instead of on every request during an outage.
				lastDatafileUpdate = now;
				console.error(
					"Failed to fetch fresh datafile, using cached version:",
					error,
				);
			} else {
				console.error(
					"Failed to fetch datafile and no cached version available:",
					error,
				);
				throw new Error(`Unable to initialize Optimizely: ${error.message}`);
			}
		}
	}

	const projectConfigManager = createStaticProjectConfigManager({
		datafile: cachedDatafile,
	});

	// Events are dispatched to the Optimizely logx backend fire-and-forget, so the
	// keep-alive registrar is threaded here to keep those deliveries alive past the
	// client response.
	const eventRequestHandler = new FastlyRequestHandler(
		BACKEND_LOGX,
		undefined,
		keepAlive,
	);
	const eventDispatcher = createEventDispatcher(eventRequestHandler);
	const eventProcessor = createForwardingEventProcessor(eventDispatcher);

	return createInstance({
		projectConfigManager,
		eventProcessor,
		requestHandler: eventRequestHandler,
		clientEngine: FASTLY_CLIENT_ENGINE,
		disposable: true,
	});
}
