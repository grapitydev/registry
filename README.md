# @grapity/registry

Grapity Registry Server - spec validation, backward compatibility checking, and versioned storage for API specs.

This is the server component. The CLI (`@grapity/cli`) communicates with this server over HTTP.

## Usage

### Local mode (SQLite)

```bash
grapity serve
# Starts on http://localhost:3750
# Data stored in ~/.grapity/registry.db
```

### Self-hosted (PostgreSQL)

```bash
grapity serve --db postgresql://user:pass@db:5432/grapity --auth jwt
```

## Development

```bash
mise install       # Install pinned tools (bun, npm, semver)
mise run setup     # Install dependencies
mise run build     # Build the package
mise run dev       # Start the dev server
```

## License

Apache-2.0