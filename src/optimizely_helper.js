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

const BACKEND_CDN = "optlycdn";
const BACKEND_LOGX = "optlylogx";

export async function getDatafile(sdkKey, ttl) {
  const dataFileRequest = new Request(
    `https://cdn.optimizely.com/datafiles/${sdkKey}.json`
  );
  
  const cacheOverride = new CacheOverride("override", {
    ttl: ttl,
    swr: 60,
  });

  const fetchedDatafile = await fetch(dataFileRequest, {
    backend: BACKEND_CDN,
    cacheOverride,
  });
  return await fetchedDatafile.text();
}

export function dispatchEvent({ url, params }) {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  const eventRequest = new Request(url, {
    method: "POST",
    body: JSON.stringify(params),
    headers,
  });
  fetch(eventRequest, { backend: BACKEND_LOGX });
}
