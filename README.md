# Optimizely Akamai Edgeworkers Starter Kit

This repository houses the Akamai Edgeworkers Starter Kit which provides a quickstart for users who would like to use Optimizely Feature Experimentation and Optimizely Full Stack (legacy) with Akamai Edgeworkers.

Optimizely Feature Experimentation is an A/B testing and feature management tool for product development teams that enables you to experiment at every step. Using Optimizely Feature Experimentation allows for every feature on your roadmap to be an opportunity to discover hidden insights. Learn more at [Optimizely.com](https://www.optimizely.com/products/experiment/feature-experimentation/), or see the [developer documentation](https://docs.developers.optimizely.com/experimentation/v4.0.0-full-stack/docs/welcome).

Optimizely Rollouts is [free feature flags](https://www.optimizely.com/free-feature-flagging/) for development teams. You can easily roll out and roll back features in any application without code deploys, mitigating risk for every feature on your roadmap.

## Get Started

Refer to the [Optimizely Akamai EdgeWorkers Starter Kit documentation](https://docs.developers.optimizely.com/experimentation/v4.0.0-full-stack/docs/akamai-edgeworkers) for detailed instructions about using this starter kit.

### Prerequisites

1. You will need an **Optimizely Account**. If you do not have an account, you can [register for a free account](https://www.optimizely.com/products/intelligence/full-stack-experimentation/).

2. You will need a **Fastly Compute@Edge** account and the Fastly CLI installed. For more information view the Compute@Edge getting started [documentation](https://developer.fastly.com/learning/compute/).

### Requirements

You must first have an Fastly Compute@Edge service set up. To do so, you may take the following steps:


### Install the Starter Kit

After you succesfully have an Fastly Compute@Edge service set up, you can clone this starter kit, edit it, build it, and upload the build to your EdgeWorker.


1. Create a new folder and initialize a Fastly Compute@Edge service using the [Fastly CLI](https://developer.fastly.com/reference/cli/) from this template.
    ```sh
    fastly compute init --from https://github.com/optimizely/fastly-compute-starter-kit
    ```

2. Follow the wizard and provide the service name, description and any other information.
   a) Add your `service_id` to `fastly.toml`, if you want to use an existing Fastly service.

## Use the Fastly Compute@Edge Starter Kit

The Optimizely starter kit for Fastly's Compute@Edge service embeds and extends our [Javascript (Node) SDK](https://docs.developers.optimizely.com/experimentation/v4.0.0-full-stack/docs/javascript-node-sdk). For a guide to getting started with our platform more generally, you can reference our [Javascript (Node) Quickstart developer documentation](https://docs.developers.optimizely.com/experimentation/v4.0.0-full-stack/docs/javascript-node-quickstart).

> Note: This starter kit in particular makes use of the "Lite" version of our Javascript SDK for Node.js which explicitly excludes the datafile manager and event processor features for better performance. As a result, it is expected that you will provide the datafile manually to the Optimizely SDK either through a local file reference or by using the provided platform-specific `getDatafile()` helper to load in your Optimizely project's datafile.

### Initialization

Sample code is included in `src/index.js` that shows examples of initializing and using the Optimizely JavaScript (Node) SDK interface for performing common functions such as creating user context, adding a notification listener, and making a decision based on the created user context.

Additional platform-specific code is included in `src/optimizely_helper.js` which provide workarounds for otherwise common features of the Optimizely SDK.

### Publishing

1. Update your Optimizely `sdkKey` and `flagKey` in `src/index.js`. Your SDK keys can be found in the Optimizely application under **Settings**.

2. Build and publish:
    ```sh
    fastly compute publish
    ```
    
3. Monitor logs:
    ```sh
    fastly log-tail
    ```

## Additional Resources and Concepts

### Identity Management

Out of the box, Optimizely's Feature Experimentation SDKs require a user-provided identifier to be passed in at runtime to drive experiment and feature flag decisions. This example generates a unique ID, stores it in a cookie and reuses it to make the decisions sticky. Alternatively, you can use an existing unique identifier available within your application and pass it in as the value for the `OPTIMIZELY_USER_ID` cookie.

### Bucketing

For more information on how Optimizely Feature Experimentation SDKs assign users to feature flags and experiments, see [the documentation on how bucketing works](https://docs.developers.optimizely.com/experimentation/v4.0.0-full-stack/docs/how-bucketing-works). 

### External Calls via Fastly Backends

This starter kit overrides the standard Optimizely Javascript SDK's external calls to use Compute@Edge's fetch against registered backend endpoints. This backend setup also provides performant caching for the [Optimizely Datafile](https://docs.developers.optimizely.com/experimentation/v4.0.0-full-stack/docs/manage-config-datafile). 

### Fastly Compute@Edge

For more information about Fastly Compute@Edge, you may visit the following resources:

- [Fastly - Compute@Edge official documentation](https://docs.fastly.com/products/compute-at-edge)
- [Compute@Edge application code in JavaScript](https://docs.fastly.com/products/compute-at-edge)
- [Fastly Compute@Edge with Optimizely documentation](https://docs.developers.optimizely.com/experimentation/v4.0.0-full-stack/docs/fastly-compute-at-edge)

## SDK Development

### Contributing

Please see [CONTRIBUTING](CONTRIBUTING.md).

### Other Optimizely SDKs

- Agent - https://github.com/optimizely/agent

- Android - https://github.com/optimizely/android-sdk

- C# - https://github.com/optimizely/csharp-sdk

- Flutter - https://github.com/optimizely/optimizely-flutter-sdk

- Go - https://github.com/optimizely/go-sdk

- Java - https://github.com/optimizely/java-sdk

- JavaScript - https://github.com/optimizely/javascript-sdk

- PHP - https://github.com/optimizely/php-sdk

- Python - https://github.com/optimizely/python-sdk

- React - https://github.com/optimizely/react-sdk

- Ruby - https://github.com/optimizely/ruby-sdk

- Swift - https://github.com/optimizely/swift-sdk

### Other Optimizely Edge Starter Kits

- Akamai EdgeWorkers - https://github.com/optimizely/akamai-edgeworker-starter-kit

- AWS Lambda@Edge - https://github.com/optimizely/aws-lambda-at-edge-starter-kit

- Cloudflare Workers - https://github.com/optimizely/cloudflare-worker-template

- Vercel Functions - https://github.com/optimizely/vercel-examples/tree/main/edge-functions/feature-flag-optimizely