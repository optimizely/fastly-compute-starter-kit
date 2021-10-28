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
  headers.set("Content-type", "application/json");
  const eventRequest = new Request(url, {
    method: "POST",
    body: JSON.stringify(params),
    headers,
  });
  fetch(eventRequest, { backend: BACKEND_LOGX });
}
