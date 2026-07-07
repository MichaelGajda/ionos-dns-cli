# Changelog

All notable changes are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); versioning is [semver](https://semver.org/).
While on `0.x`, minor versions may still move the furniture. `1.0` is where the
command surface, the piped-JSON output, and the library exports become a promise.

## [Unreleased]

_Toward 1.0: publish to npm and freeze the contract. See the [roadmap](ROADMAP.md)._

## [0.2.1] — 2026-07-07

### Fixed

- `--version` reported `0.1.0` while the package was `0.2.0` — a hardcoded string
  that drifted. The version now lives in one place (`src/version.ts`), shared by
  the CLI and the MCP server, and a test fails CI if it ever disagrees with
  `package.json` again.

## [0.2.0] — 2026-07-07

Now with more robots. Same DNS, now talkable-to by an LLM.

### Added

- **MCP server** — a second binary, `ionosdns-mcp`, exposing the DNS/domains
  capabilities as [Model Context Protocol](https://modelcontextprotocol.io/)
  tools over stdio, so an MCP client (Claude Desktop, etc.) can manage DNS
  conversationally. 11 tools; read tools flagged read-only, `delete_record`
  flagged destructive. Same `IONOS_API_*` auth as the CLI.
- `package-lock.json` committed for reproducible installs and CI.

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

[Unreleased]: https://github.com/MichaelGajda/ionos-dns-cli/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/MichaelGajda/ionos-dns-cli/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/MichaelGajda/ionos-dns-cli/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/MichaelGajda/ionos-dns-cli/releases/tag/v0.1.0
