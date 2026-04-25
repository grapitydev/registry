# Contributing to @grapity/registry

## Prerequisites

- [Bun](https://bun.sh/) >= 1.3
- Node.js >= 18

## Setup

```bash
bun install
```

## Commands

```bash
bun run typecheck          # Type check
bun run build              # Build dist/
bun test                   # Run tests
bun run dev                # Start dev server on :3750
bun run db:generate:sqlite # Generate SQLite migrations
bun run db:generate:pg     # Generate PostgreSQL migrations
bun run db:migrate:sqlite  # Run SQLite migrations
bun run db:migrate:pg      # Run PostgreSQL migrations
```

## Local Development

The Grapity platform has three independent repos that depend on each other:

```
@grapity/core  ←  @grapity/registry  ←  @grapity/cli (peer dep)
```

### Linking all packages

The registry and CLI use `link:` protocol in package.json to resolve local @grapity/core and @grapity/registry. This is the Bun-native approach for monorepo-like linking without a workspace.

```bash
# 1. Build and link core (registers it globally via bun link)
cd ~/workspace/grapity/core
bun install && bun run build
bun link

# 2. Install registry (resolves @grapity/core via link:)
cd ~/workspace/grapity/registry
bun install
bun run build
bun link

# 3. Install cli (resolves both via link:)
cd ~/workspace/grapity/cli
bun install
bun run build
```

`bun link` in steps 1-2 registers the packages globally. The `link:` protocol in each consumer's package.json then resolves them automatically — no `bun link @grapity/core` step needed in the consumer.

### Checking link status

```bash
ls -la node_modules/@grapity/core
# Symlink: node_modules/@grapity/core -> /Users/you/workspace/grapity/core
# npm:      node_modules/@grapity/core/  (regular directory)
```

### Unlinking (restore npm versions)

Before pushing changes that affect package.json, revert `link:` references to version ranges:

```json
// Change in package.json before pushing:
"@grapity/core": "^0.0.1"    // ← npm version range
// NOT:
"@grapity/core": "link:@grapity/core"  // ← local dev only
```

The CI pipeline publishes to npm and expects version ranges, not `link:` references.

### After changes in core

```bash
cd ~/workspace/grapity/core
bun run build   # Rebuild. link: references pick up changes via symlink.
```

## Publishing

Publishing is handled by GitHub Actions. Do not publish manually.

## License

Apache-2.0
