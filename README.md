# Optimizely Fastly Compute@Edge Starter Kit

This repository houses the Fastly Compute@Edge Starter Kit which provides a quickstart for users who would like to use Optimizely Feature Experimentation and Optimizely Full Stack (legacy) with Fastly Compute@Edge.

Optimizely Feature Experimentation is an A/B testing and feature management tool for product development teams that enables you to experiment at every step. Using Optimizely Feature Experimentation allows for every feature on your roadmap to be an opportunity to discover hidden insights. Learn more at [Optimizely.com](https://www.optimizely.com/products/experiment/feature-experimentation/), or see the [developer documentation](https://docs.developers.optimizely.com/feature-experimentation/docs/welcome).

Optimizely Rollouts is [free feature flags](https://www.optimizely.com/free-feature-flagging/) for development teams. You can easily roll out and roll back features in any application without code deploys, mitigating risk for every feature on your roadmap.

## Quick Start

Get up and running in a few minutes:

```bash
# 1. Initialize a project from this template using the Fastly CLI
#    (replace vX.Y.Z with the latest release tag from
#    https://github.com/optimizely/fastly-compute-starter-kit/releases)
fastly compute init --from https://github.com/optimizely/fastly-compute-starter-kit
cd my-project

# 2. Install dependencies
npm install

# 3. Set your Optimizely SDK key (get it from Settings > Environments in
#    your Optimizely dashboard). For local development, edit the sdk_key
#    value under [local_server.config_stores.optimizely.contents] in fastly.toml.

# 4. Start the local development server
npm run serve

# 5. Visit the printed local URL (default http://127.0.0.1:7676) to see it in action.
```

For detailed setup instructions, see the [Get Started](#get-started) section below.

## Features

- **Optimizely SDK v6**: Latest version of the Optimizely JavaScript SDK (Universal build).
- **Modern js-compute toolchain**: Builds directly to WebAssembly with `@fastly/js-compute` 3.x, no bundler required.
- **Fastly edge datafile caching**: Datafile fetched through a Fastly backend and cached with `CacheOverride` (stale-while-revalidate).
- **Externalized configuration**: SDK key and cache TTL read from a Fastly Config Store, not hardcoded.
- **Graceful degradation**: The service still returns a response even if Optimizely initialization fails.
- **Cookie-based user persistence**: Automatic user ID generation with `crypto.randomUUID()` and cookie persistence for sticky bucketing.
- **Development tools**: Biome for linting/formatting and Vitest for unit tests.

## Get Started

Refer to the [Optimizely Fastly Compute@Edge Starter Kit documentation](https://docs.developers.optimizely.com/feature-experimentation/docs/fastly-compute-at-edge) for detailed instructions about using this starter kit.

### Prerequisites

**System Requirements:**
- Node.js 22.x or higher (required by the dev toolchain, e.g. `cookie` v2 and Vitest 4)
- npm 9.x or higher

**Accounts & Tools:**

1. **Optimizely Account**: If you don't have an account, [register for a free account](https://www.optimizely.com/products/feature-experimentation/).

2. **Fastly Compute account**: Sign up for [Fastly](https://www.fastly.com/signup/) and enable Compute.

3. **Fastly CLI**: Install it by following the [Fastly CLI installation guide](https://www.fastly.com/documentation/reference/tools/cli/). The CLI bundles the local test runtime (Viceroy) used by `fastly compute serve`.

### Install the Starter Kit

1. Initialize a project from this template using the [Fastly CLI](https://www.fastly.com/documentation/reference/tools/cli/).

   ```bash
   fastly compute init --from https://github.com/optimizely/fastly-compute-starter-kit
   cd my-project
   ```

   Follow the wizard and provide the service name, description, and any other requested information.

2. Install node packages.

   ```bash
   npm install
   ```

3. **Configure your Optimizely SDK Key**.

   First, get your SDK key from the Optimizely dashboard:
   - Log into your [Optimizely account](https://app.optimizely.com/)
   - Navigate to **Settings > Environments**
   - Copy your SDK key from the desired environment (it looks like: `AbCdEf12345GhIjKlMnOp`)

   Then set it using one of these methods:

   **Option A: Local development (fastly.toml)**

   Edit the `optimizely` Config Store contents in `fastly.toml` and replace `YOUR_SDK_KEY_HERE`:

   ```toml
   [local_server.config_stores]
     [local_server.config_stores.optimizely]
       format = "inline-toml"
       [local_server.config_stores.optimizely.contents]
         sdk_key = "YOUR_SDK_KEY_HERE"
         datafile_ttl_seconds = "300"
   ```

   **Option B: Deployed service (Config Store)**

   The `[setup.config_stores]` block in `fastly.toml` provisions the `optimizely` Config Store the first time you run `fastly compute publish`; the CLI prompts you for the `sdk_key` value. You can also manage the entry directly with the CLI:

   ```bash
   fastly config-store-entry update --store-id <id> --key sdk_key --value <your_sdk_key>
   ```

## Project Structure

```
├── src/
│   ├── index.js                    # Main entry point (fetch event handler)
│   ├── optimizely_helper.js        # Optimizely SDK integration + datafile caching
│   └── request_handler.js          # Fastly-specific SDK request handler
├── test/
│   ├── index.test.js               # Tests for the entry handler
│   ├── optimizely_helper.test.js   # Tests for the Optimizely helper
│   ├── request_handler.test.js     # Tests for the request handler
│   ├── setup.js                    # Test environment setup (Fastly global mocks)
│   ├── test-utils.js               # Shared test utilities and mocks
│   └── mocks/                      # Mocks for Fastly runtime modules
├── biome.jsonc                     # Biome configuration for linting/formatting
├── fastly.toml                     # Fastly Compute service configuration
├── package.json                    # Node.js dependencies and scripts
└── vitest.config.js                # Vitest testing framework configuration
```

## Use the Fastly Compute@Edge Starter Kit

The Optimizely starter kit for Fastly Compute embeds and extends our [Javascript SDK](https://docs.developers.optimizely.com/feature-experimentation/docs/javascript-sdk). For a guide to getting started with our platform more generally, you can reference our [Javascript Quickstart developer documentation](https://docs.developers.optimizely.com/feature-experimentation/docs/javascript-sdk-quickstart).

> Note: This starter kit uses the "Universal" build of our JavaScript SDK, which excludes the polling datafile manager and batch event processor for better edge performance. The datafile is fetched from Optimizely's CDN and cached at the Fastly edge via `CacheOverride`, and events are dispatched through a Fastly backend using the platform-specific request handler in `src/request_handler.js`.

### Development

This template includes modern development tools:

- **Biome**: Fast formatter and linter for JavaScript
- **Vitest**: Fast unit testing framework
- **Fastly CLI + Viceroy**: Local development server that simulates Fastly Compute

Available commands:

```bash
npm run serve        # Build and serve locally with the Fastly CLI (Viceroy)
npm run build        # Compile src/index.js to a WebAssembly module (bin/main.wasm)
npm run deploy       # Build and deploy to Fastly
npm run format       # Format code with Biome
npm run lint         # Lint and auto-fix code with Biome
npm run test         # Run unit tests with Vitest
```

### Initialization

Sample code is included in `src/index.js` that shows examples of initializing and using the Optimizely JavaScript SDK for common functions such as creating a user context and making decisions.

Additional platform-specific code is included in `src/optimizely_helper.js` and `src/request_handler.js`, which provide:

- **Datafile Caching**: Fetching and caching the Optimizely datafile through a Fastly backend with `CacheOverride`.
- **Client Management**: Per-request client creation with module-scope datafile reuse and stale fallback.
- **Event Dispatching**: Event forwarding to Optimizely's logging backend.

To customize:

1. **Configure your feature flags**: Update the `YOUR_FLAG_HERE` placeholder in `src/index.js` with your actual flag key from the Optimizely dashboard.

2. Test and debug locally.

   ```bash
   npm run serve
   ```

### Publishing

1. Build and publish to Fastly.

   ```bash
   fastly compute publish
   ```

2. Monitor logs for decision results.

   ```bash
   fastly log-tail
   ```

## Additional Resources and Concepts

### Caching with Fastly

This template caches the [Optimizely Datafile](https://docs.developers.optimizely.com/feature-experimentation/docs/manage-config-datafile) at the Fastly edge using `CacheOverride`. The datafile is fetched from Optimizely's CDN through the `optlycdn` backend and cached for 5 minutes by default.

**Cache Configuration:**
- **Default TTL**: 5 minutes (300 seconds)
- **Configurable via**: the `datafile_ttl_seconds` key in the `optimizely` Config Store
- **Example values**: `300` (5 minutes), `600` (10 minutes), `1800` (30 minutes)
- **Behavior**: A stale-while-revalidate window and a module-scope fallback keep the last known datafile in use if a refresh fetch fails.

### Identity Management

Out of the box, Optimizely's Feature Experimentation SDKs require a user-provided identifier at runtime to drive experiment and feature flag decisions. This example generates a unique ID using `crypto.randomUUID()`, stores it in a cookie, and reuses it to make decisions sticky. Alternatively, you can use an existing unique identifier from your application and pass it in as the value for the `optimizely_user_id` cookie.

### Bucketing

For more information on how Optimizely Feature Experimentation SDKs assign users to feature flags and experiments, see [the documentation on how bucketing works](https://docs.developers.optimizely.com/feature-experimentation/docs/how-bucketing-works-feature-experimentation).

### External Calls via Fastly Backends

This starter kit routes the Optimizely SDK's external calls through Fastly Compute's `fetch` against registered backends declared in `fastly.toml` (`optlycdn` for the datafile CDN and `optlylogx` for event logging). Backends must be named in `fastly.toml` and referenced by name in each request.

### Fastly Compute@Edge

For more information about Fastly Compute, you may visit the following resources:

- [Fastly Compute documentation](https://www.fastly.com/documentation/guides/compute/)
- [JavaScript on Fastly Compute](https://www.fastly.com/documentation/guides/compute/javascript/)
- [Fastly Compute@Edge with Optimizely documentation](https://docs.developers.optimizely.com/feature-experimentation/docs/fastly-compute-at-edge)

## Troubleshooting

### Config Store "optimizely" not found

Ensure the `optimizely` Config Store exists. For local development, confirm the `[local_server.config_stores.optimizely]` block is present in `fastly.toml`. For a deployed service, run `fastly compute publish` so the `[setup.config_stores]` block provisions it.

### "sdk_key" is not set

Set the `sdk_key` value in the `optimizely` Config Store (see step 3 of [Install the Starter Kit](#install-the-starter-kit)). Confirm it matches an active Optimizely project environment.

### Datafile request failed

This usually means the SDK key is incorrect, does not match an active project, or the Optimizely CDN is temporarily unavailable. When a cached datafile is available it continues to be used (stale fallback).

### Feature flags not working as expected

- Verify your flag key matches exactly (case-sensitive).
- Check that the flag is enabled in your Optimizely project.
- Ensure the environment SDK key matches the environment where the flag is configured.
- Run `fastly log-tail` to inspect decision output.

**Need more help?**
- Check the [Optimizely Developer Docs](https://docs.developers.optimizely.com/feature-experimentation/docs/fastly-compute-at-edge)
- Visit the [Optimizely Community](https://community.optimizely.com/)
- Open an issue on [GitHub](https://github.com/optimizely/fastly-compute-starter-kit/issues)

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
