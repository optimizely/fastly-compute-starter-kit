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

/// <reference types="@fastly/js-compute" />
import { parseCookie, stringifySetCookie } from "cookie";
import { getOptimizelyClient } from "./optimizely_helper";

/**
 * Cookie name used to store the Optimizely user ID so a returning user from the
 * same browser session consistently sees the same variation (sticky bucketing).
 * @type {string}
 */
const OPTIMIZELY_USER_ID_COOKIE_NAME = "optimizely_user_id";

addEventListener("fetch", (event) => {
	// waitUntil's first call must be made synchronously inside the fetch callback,
	// before any await. Event dispatches register later from deep in an async stack
	// (inside decide), so this synchronous prime is required to enable them.
	// https://js-compute-reference-docs.edgecompute.app/docs/globals/FetchEvent/prototype/waitUntil
	event.waitUntil(Promise.resolve());
	event.respondWith(handleRequest(event));
});

/**
 * Handle an incoming HTTP request and perform Optimizely feature flag decisions.
 *
 * Demonstrates:
 * - Retrieving or generating a user ID from cookies (sticky bucketing)
 * - Creating an Optimizely user context
 * - Making single and batch flag decisions
 * - Degrading gracefully so a response is always returned
 *
 * @param {FetchEvent} event - The incoming fetch event
 * @returns {Promise<Response>} HTTP response with a persistent user-ID cookie
 */
async function handleRequest(event) {
	const cookies = parseCookie(event.request.headers.get("Cookie") || "");

	// Reuse the user ID from the cookie if present so a returning user in the
	// same browser session always sees the same variation.
	const userId = cookies[OPTIMIZELY_USER_ID_COOKIE_NAME] || crypto.randomUUID();

	let optimizelyClient;
	try {
		// Pass event.waitUntil so fire-and-forget event dispatches stay alive past
		// respondWith and reach the Optimizely logx backend.
		optimizelyClient = await getOptimizelyClient((p) => event.waitUntil(p));
	} catch (error) {
		console.error(
			"Failed to initialize Optimizely client, continuing without feature flags:",
			error,
		);
		return buildResponse(
			"Welcome to the Optimizely Starter Kit. Feature flags unavailable.",
			userId,
		);
	}

	let optimizelyUserContext;
	try {
		optimizelyUserContext = optimizelyClient.createUserContext(userId, {
			// Add optional user attributes here as key-value pairs, for example:
			// location: "New York City",
			// device: "mobile"
		});
	} catch (error) {
		console.error(
			"Failed to create Optimizely user context, continuing without feature flags:",
			error,
		);
		return buildResponse(
			"Welcome to the Optimizely Starter Kit. Feature flags unavailable.",
			userId,
		);
	}

	// Decide for a single flag
	try {
		const decision = optimizelyUserContext.decide("YOUR_FLAG_HERE");
		logDecision(decision);
	} catch (error) {
		console.error("Failed to decide for single flag, continuing:", error);
	}

	// Decide for all flags
	try {
		const allDecisions = optimizelyUserContext.decideAll();
		for (const decision of Object.values(allDecisions)) {
			logDecision(decision);
		}
	} catch (error) {
		console.error("Failed to decide for all flags, continuing:", error);
	}

	// Track a conversion event
	try {
		optimizelyUserContext.trackEvent("YOUR_EVENT_HERE");
		console.info('Tracked event "YOUR_EVENT_HERE"');
	} catch (error) {
		console.error("Failed to track event, continuing:", error);
	}

	return buildResponse(
		'Welcome to the Optimizely Starter Kit. Check "fastly log-tail" for decision results.',
		userId,
	);
}

/**
 * Log a single flag decision result.
 * @param {Object} decision - An Optimizely decision object
 */
function logDecision(decision) {
	const state = decision.enabled ? "Enabled" : "Not Enabled";
	console.info(
		`The Flag "${decision.flagKey}" was ${state} for the user "${decision.userContext.getUserId()}"`,
	);
}

/**
 * Build a plain-text response that persists the Optimizely user ID cookie.
 * @param {string} body - Response body text
 * @param {string} userId - The Optimizely user ID to persist
 * @returns {Response}
 */
function buildResponse(body, userId) {
	const headers = new Headers();
	headers.set("Content-Type", "text/plain");
	headers.set(
		"Set-Cookie",
		stringifySetCookie({
			name: OPTIMIZELY_USER_ID_COOKIE_NAME,
			value: userId,
			path: "/",
		}),
	);
	return new Response(body, { status: 200, headers });
}
