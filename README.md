# Optimizely Full Stack Feature Flags and Experimentation

[Optimizely Full Stack](https://docs.developers.optimizely.com/full-stack/docs) is a feature flagging and experimentation platform for websites, mobile apps, chatbots, APIs, smart devices, and anything else with a network connection.

You can deploy code behind feature flags, experiment with A/B tests, and roll out or roll back features immediately. All of this functionality is available with minimal performance impact via easy-to-use, open source SDKs.


# Optimizely Starter Kit
Optimizely starter kit for Fastly's Compute@Edge. This template provides a JavaScript package . 

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
