import { createInstance, enums as OptimizelyEnums } from '@optimizely/optimizely-sdk/dist/optimizely.lite.es';
import { getDatafile, dispatchEvent } from './optimizely_helper';

addEventListener('fetch', handleRequest);

async function handleRequest(event) {
  
  // fetch datafile from optimizely CDN and cache it with fastly for the given number of seconds
  const datafile = await getDatafile('YOUR_SDK_KEY_HERE', 600);

  const optimizelyClient = createInstance({
    datafile,

    // keep the LOG_LEVEL to ERROR in production. Setting LOG_LEVEL to INFO or DEBUG can adversely impact performance.
    logLevel: OptimizelyEnums.LOG_LEVEL.ERROR,

    /***
     * Optional event dispatcher. Please uncomment this line if you want to dispatch impression event to optimizely logx backend.
     * When enabled, event is dispatched asynchronously. It does not impact the response time for a particular worker but it will
     * add to the total compute time of the worker and can impact fastly billing.
    */
    // eventDispatcher: { dispatchEvent }

    /* Add other Optimizely SDK initialization options here if needed*/
  });

  const optimizelyUserContext = optimizelyClient.createUserContext('USER_ID_HERE', {/* YOUR_OPTIONAL_ATTRIBUTES_HERE */});  

  // --- Using Optimizely Config
  const optimizelyConfig = optimizelyClient.getOptimizelyConfig();

  // --- For a single flag --- //
  const decision = optimizelyUserContext.decide('YOUR_FLAG_HERE');
  if (decision.enabled) {
    console.log(`The Flag ${decision.flagKey} was Enabled for the user ${decision.userContext.getUserId()}`)
  } else {
    console.log(`The Flag ${decision.flagKey} was Not Enabled for the user ${decision.userContext.getUserId()}`)
  }

  // --- For all flags --- //
  const allDecisions = optimizelyUserContext.decideAll();
  Object.entries(allDecisions).forEach(([flagKey, decision]) => {
    if (decision.enabled) {
      console.log(`The Flag ${decision.flagKey} was Enabled for the user ${decision.userContext.getUserId()}`)
    } else {
      console.log(`The Flag ${decision.flagKey} was Not Enabled for the user ${decision.userContext.getUserId()}`)
    }
  });

  let headers = new Headers();
  headers.set('Content-Type', 'text/plain');
  let response = new Response(`Welcome to the Optimizely Starter Kit. Check "fastly logs tail" for decision results.`, {
    status: 200,
    headers
  });
  event.respondWith(response);
}
