# Optimizely Full Stack Feature Flags and Experimentation

[Optimizely Full Stack](https://docs.developers.optimizely.com/full-stack/docs) is a feature flagging and experimentation platform for websites, mobile apps, chatbots, APIs, smart devices, and anything else with a network connection.

You can deploy code behind feature flags, experiment with A/B tests, and roll out or roll back features immediately. All of this functionality is available with minimal performance impact via easy-to-use, open source SDKs.


# Optimizely Starter Kit
The Optimizely starter kit for Fastly's Compute@Edge embeds and extends our [Javascript SDK](https://docs.developers.optimizely.com/full-stack/v4.0/docs/javascript-node) to provide a starting point for you to implement experimentation and feature flagging for your experiences at the edge. For a guide to getting started with our platform more generally, this can be combined with the steps outlined in our [Javascript Quickstart here](https://docs.developers.optimizely.com/full-stack/v4.0/docs/javascript-node). 

### External Calls via Fastly Backends
This starter kit overrides the standard Optimizely Javascript SDK's external calls to use Compute@Edge's fetch against registered backend endpoints. This backend setup also provides performant caching for the [Optimizely Datafile](https://docs.developers.optimizely.com/full-stack/v4.0/docs/manage-config-datafile). 

### Identity Management
Out of the box, Optimizely's Full Stack SDKs require a user-provided identifier to be passed in at runtime to drive experiment and feature flag decisions. This starter kit does not implement a persistent user identifier. Common approaches would include reading a unique visitor ID from a cookie-based header, or other existing unique identifier available within your application. 

### Bucketing
For more information on how Optimizely Full Stack SDKs bucket visitors, see [here](https://docs.developers.optimizely.com/full-stack/v4.0/docs/how-bucketing-works) 

## How to use

1. Create a new folder and initialize a Fastly Compute@Edge service using the [fastly cli](https://developer.fastly.com/reference/cli/) from this template.
    ```sh
    fastly compute init --from https://github.com/optimizely/fastly-compute-starter-kit
    ```

2. Follow the wizard and provide the service name, description and any other information.

3. If you want to use an existing Fastly service, add your `service_id` to `fastly.toml`.

4. Update your Optimizely `sdkKey` and `flagKey` in `src/index.js`.

5. To build and publish:
    ```sh
    fastly compute publish
    ```
    
6. To monitor logs:
    ```sh
    fastly log-tail
    ```

### Contributing

Please see [CONTRIBUTING](CONTRIBUTING.md).
