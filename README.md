# Optimizely Full Stack Feature Flags and Experimentation

[Optimizely Full Stack](https://docs.developers.optimizely.com/experimentation/v4.0.0-full-stack/docs) is a feature flagging and experimentation platform for websites, mobile apps, chatbots, APIs, smart devices, and anything else with a network connection.

You can deploy code behind feature flags, experiment with A/B tests, and roll out or roll back features immediately. All of this functionality is available with minimal performance impact through easy-to-use, open source SDKs.

---

# Optimizely + Fastly Compute@Edge Starter Kit

> Starter Kit for running Optimizely Full Stack feature flags and experiments on [Fastly's Compute@Edge offering](https://www.fastly.com/products/edge-compute).

The Optimizely starter kit for Fastly's Compute@Edge embeds and extends our [Javascript SDK](https://docs.developers.optimizely.com/experimentation/v4.0.0-full-stack/docs/javascript-node-sdk) to provide a starting point for you to implement experimentation and feature flagging for your experiences at the edge. 

For a guide to getting started with our platform more generally, this can be combined with the steps outlined in our [Javascript Quickstart here](https://docs.developers.optimizely.com/experimentation/v4.0.0-full-stack/docs/javascript-node-quickstart). 

### External Calls via Fastly Backends
This starter kit overrides the standard Optimizely Javascript SDK's external calls to use Compute@Edge's fetch against registered backend endpoints. This backend setup also provides performant caching for the [Optimizely Datafile](https://docs.developers.optimizely.com/experimentation/v4.0.0-full-stack/docs/manage-config-datafile). 

### Identity Management
Out of the box, Optimizely's Full Stack SDKs require a user-provided identifier to be passed in at runtime to drive experiment and feature flag decisions. This example generates a unique ID, stores it in a cookie and reuses it to make the decisions sticky. Alternatively, you can use an existing unique identifier available within your application and pass it in as the value for the `OPTIMIZELY_USER_ID` cookie.

### Bucketing
For more information on how Optimizely Full Stack SDKs assign users to feature flags and experiments, see [the documentation on how bucketing works](https://docs.developers.optimizely.com/experimentation/v4.0.0-full-stack/docs/how-bucketing-works). 

## How to use

### Prerequisites
You will need to complete the following prerequisites to use this template:

   - Have a Compute@Edge account and the Fastly CLI installed. For more information view the Compute@Edge getting started [documentation](https://developer.fastly.com/learning/compute/).
   - Have an Optimizely account. If you do not have an account, you can [register for a free account](https://www.optimizely.com/products/intelligence/full-stack-experimentation/).


### Get started
1. Create a new folder and initialize a Fastly Compute@Edge service using the [Fastly CLI](https://developer.fastly.com/reference/cli/) from this template.
    ```sh
    fastly compute init --from https://github.com/optimizely/fastly-compute-starter-kit
    ```

2. Follow the wizard and provide the service name, description and any other information.
   a) Add your `service_id` to `fastly.toml`, if you want to use an existing Fastly service.

3. Update your Optimizely `sdkKey` and `flagKey` in `src/index.js`. Your SDK keys can be found in the Optimizely application under **Settings**.

4. Build and publish:
    ```sh
    fastly compute publish
    ```
    
5. Monitor logs:
    ```sh
    fastly log-tail
    ```
## Contributing

Please see [CONTRIBUTING](https://github.com/optimizely/fastly-compute-starter-kit/blob/main/CONTRIBUTING.md).

## Additional resources
- [Fastly - Compute@Edge official documentation](https://docs.fastly.com/products/compute-at-edge)
- [Compute@Edge application code in JavaScript](https://docs.fastly.com/products/compute-at-edge)
- [Fastly Compute@Edge with Optimizely documentation](https://docs.developers.optimizely.com/experimentation/v4.0.0-full-stack/docs/fastly-compute-at-edge)
