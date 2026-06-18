# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-06-18

### Added

- **Testing**: New vitest suite for `ChampSelectSession` with comprehensive unit tests

### Changed

- **Dependencies**: Update `@hasagi/core` dependency to version 0.8.0
- **Client Architecture**: Inherit `CoreClient<Hasagi.Events>` instead of wrapping it for better type safety and integration
- **Type Safety**: Type WebSocket event-data assertions instead of using `as any` casts
- **ChampSelectSession**: Populate via `Object.assign` instead of manual property assignment with `as-any` casts

### Performance

- **Client Initialization**: Drop fixed post-connect delay and seed initial state with race guard for faster initialization

### Build

- Add changelog stub and version:* release scripts for automated versioning

