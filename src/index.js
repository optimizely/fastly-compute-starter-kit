/**
 *    Copyright 2021-2022, Optimizely and contributors
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

import cookie from "cookie";
import { v4 } from "uuid";
import {
  createInstance,
  enums as OptimizelyEnums,
} from "@optimizely/optimizely-sdk/dist/optimizely.lite.es";
import {
  getDatafile,
  dispatchEvent,
} from "./optimizely_helper";

const FASTLY_CLIENT_ENGINE = "javascript-sdk/fastly";
const OPTIMIZELY_USER_ID_COOKIE_NAME = "optimizely_user_id";

addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));

async function handleRequest(event) {
  const cookies = cookie.parse(event.request.headers.get("Cookie") || '');

  // Fetch user Id from the cookie if available to make sure that a returning user from same browser session always sees the same variation.
  const userId = cookies[OPTIMIZELY_USER_ID_COOKIE_NAME] || v4();

  // fetch datafile from optimizely CDN and cache it with fastly for the given number of seconds
  const datafile = await getDatafile("YOUR_SDK_KEY_HERE", 600);

  const optimizelyClient = createInstance({
    datafile,

    // keep the LOG_LEVEL to ERROR in production. Setting LOG_LEVEL to INFO or DEBUG can adversely impact performance.
    logLevel: OptimizelyEnums.LOG_LEVEL.ERROR,

    clientEngine: FASTLY_CLIENT_ENGINE,

    /***
     * Optional event dispatcher. Please uncomment the following line if you want to dispatch an impression event to optimizely logx backend.
     * When enabled, an event is dispatched asynchronously. It does not impact the response time for a particular worker but it will
     * add to the total compute time of the worker and can impact fastly billing.
     */
    // eventDispatcher: { dispatchEvent }

    /* Add other Optimizely SDK initialization options here if needed */
  });

  const optimizelyUserContext = optimizelyClient.createUserContext(
    userId,
    {
      /* YOUR_OPTIONAL_ATTRIBUTES_HERE */
    }
  );

  // --- Using Optimizely Config
  const optimizelyConfig = optimizelyClient.getOptimizelyConfig();

  // --- For a single flag --- //
  const decision = optimizelyUserContext.decide("YOUR_FLAG_HERE");
  if (decision.enabled) {
    console.log(
      `The Flag ${
        decision.flagKey
      } was Enabled for the user ${decision.userContext.getUserId()}`
    );
  } else {
    console.log(
      `The Flag ${
        decision.flagKey
      } was Not Enabled for the user ${decision.userContext.getUserId()}`
    );
  }

  // --- For all flags --- //
  const allDecisions = optimizelyUserContext.decideAll();
  Object.entries(allDecisions).forEach(([flagKey, decision]) => {
    if (decision.enabled) {
      console.log(
        `The Flag ${
          decision.flagKey
        } was Enabled for the user ${decision.userContext.getUserId()}`
      );
    } else {
      console.log(
        `The Flag ${
          decision.flagKey
        } was Not Enabled for the user ${decision.userContext.getUserId()}`
      );
    }
  });

  let headers = new Headers();
  headers.set("Content-Type", "text/plain");
  headers.set("Set-Cookie", cookie.serialize(OPTIMIZELY_USER_ID_COOKIE_NAME, userId));
  let response = new Response(
    `Welcome to the Optimizely Starter Kit. Check "fastly logs tail" for decision results.`,
    {
      status: 200,
      headers,
    }
  );

  return response;
}
