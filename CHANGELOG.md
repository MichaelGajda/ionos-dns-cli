# Changelog

All notable changes are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); versioning is [semver](https://semver.org/).
While on `0.x`, minor versions may still move the furniture. `1.0` is where the
command surface, the piped-JSON output, and the library exports become a promise.

## [Unreleased]

_Next stop: an MCP server, so an LLM can manage your DNS while you do literally
anything else. See the [roadmap](ROADMAP.md)._

## [0.1.0] — 2026-07-07

The first one. It works, it's typed, it's tested, and it doesn't pretend to be official.

### Added

- CLI `ionosdns` for the IONOS Hosting API: DNS **zones** (list / get / find),
  **records** (full CRUD), **domains** (read + `explore`).
- Importable library: `DnsService`, `DomainsService`, `IonosHttpClient`,
  `loadConfig`, and the error types.
- **TTY-aware output** — readable columns in a terminal, JSON when piped, same command.
- **Zod-validated** responses; typed error mapping (`IonosError`, `NetworkError`,
  `RateLimitError`, `ValidationError`) with automatic 429 retry + backoff.
- 46 unit tests; CI on Node 18 / 20 / 22.
- esbuild bundle so the CLI runs on plain Node ≥ 18, no bundler gymnastics required.

[Unreleased]: https://github.com/MichaelGajda/ionos-dns-cli/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/MichaelGajda/ionos-dns-cli/releases/tag/v0.1.0
