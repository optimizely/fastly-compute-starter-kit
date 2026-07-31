# Change Log
All notable changes to this project will be documented in this file.
 
The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).
 
## [1.0.0] - July 31, 2026

### Changed

- Updated `@optimizely/optimizely-sdk` to version `6.x` and migrated from the Lite API to the Universal API (`createInstance`, `createStaticProjectConfigManager`, `createForwardingEventProcessor`, `createEventDispatcher`).
- Updated `@fastly/js-compute` to version `3.x` and build directly to WebAssembly, removing the Webpack build step and `core-js` polyfill.
- Replaced the `uuid` package with the native `crypto.randomUUID()` for user ID generation.
- Updated the `cookie` package from `0.4.2` to `2.x` and switched to its named v2 API (`parseCookie`, `stringifySetCookie`).
- Externalized the SDK key: it is now read from a Fastly Config Store (`optimizely`) instead of being hardcoded in `src/index.js`.
- Implemented graceful degradation so the service still responds if Optimizely initialization or a decision fails.
- Improved datafile caching with a module-scope stale fallback layered on the Fastly edge `CacheOverride` cache, with a configurable TTL via the `datafile_ttl_seconds` Config Store key.
- Added JSDoc documentation throughout the codebase.
- Overhauled the README with a quick start, features, prerequisites, project structure, and troubleshooting.

### Added

- New `FastlyRequestHandler` class implementing the Optimizely SDK request-handler interface over Fastly's `fetch` with named backends and `CacheOverride`.
- New `getOptimizelyClient` and `getDatafile` helpers for client management and datafile fetching.
- Unit test suite using Vitest (`index.test.js`, `optimizely_helper.test.js`, `request_handler.test.js`) with Fastly runtime mocks.
- Biome configuration (`biome.jsonc`) for linting and formatting, and `vitest.config.js` for tests.
- `optimizely` Config Store setup in `fastly.toml` for local development and deployment.

### Removed

- Removed the `uuid` package dependency (replaced with the native Web Crypto API).
- Removed the Webpack build configuration (`webpack.config.js`).

## [0.2.0] - April 4, 2022

### Added
- Added cookie based user id memorization to support sticky [bucketing](https://docs.developers.optimizely.com/full-stack/v4.0/docs/how-bucketing-works).

### Changed
- Updated `@optimizely/optimizely-sdk` version to `4.9.1`.
  
## [0.1.0] - February 24, 2022
 
### Added
- First version of Fastly starter kit with datafile caching and event dispatcher.
