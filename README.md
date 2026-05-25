# @grapity/registry

Grapity Registry Server - spec validation, backward compatibility checking, and versioned storage for API specs.

**Documentation:** [grapity.dev/docs/platform/registry/overview](https://grapity.dev/docs/platform/registry/overview) · [Quickstart](https://grapity.dev/docs/getting-started/quickstart)

<p align="center">
  <img src="./assets/grapity-registry.gif" alt="grapity Registry demo" width="600">
</p>

This is the server component. The CLI (`@grapity/cli`) communicates with this server over HTTP. Supports both SQLite (local) and PostgreSQL (production) backends.

## Usage

### Local mode (SQLite)

Zero infrastructure. Data stored in `~/.grapity/registry.db`.

```bash
npm install -g @grapity/cli @grapity/registry
grapity init --local
grapity serve
# Server running on http://localhost:3750
```

### Self-hosted (PostgreSQL)

```bash
npm install -g @grapity/cli @grapity/registry
grapity serve --db postgresql://user:pass@host:5432/grapity --auth jwt
```

Auth modes: `none` (default), `api-key`, `jwt`. Custom port via `-p <port>`.

### Remote / SaaS

Point the CLI at a hosted Grapity instance. No server to run.

```bash
npm install -g @grapity/cli
grapity init --remote --url https://api.grapity.dev --api-key <key>
```

## Requirements

- Node.js 20+ or Bun 1.3.5+
- SQLite (local) or PostgreSQL 14+ (production)

## Development

```bash
mise install       # Install pinned tools (bun, npm, semver)
mise run setup     # Install dependencies
mise run build     # Build the package
mise run dev       # Start the dev server
```

## License

Apache-2.0
