# Contributing to @grapity/registry

## Prerequisites

- [Bun](https://bun.sh/) >= 1.3
- [oasdiff](https://github.com/Tufin/oasdiff) (required at runtime for compat checking)
- Node.js >= 18

Install oasdiff:

```bash
brew install tufin/tufin/oasdiff
```

## Setup

```bash
bun install
```

## Commands

```bash
bun run typecheck     # Type check
bun run build         # Build dist/
bun test              # Run tests
bun run dev           # Start dev server on :3750
bun run db:generate   # Generate Drizzle migrations
bun run db:migrate    # Run Drizzle migrations
```

## Local Development

The Grapity platform has three independent repos that depend on each other:

```
@grapity/core  ←  @grapity/registry  ←  @grapity/cli (peer dep)
```

### Linking all packages

The registry and CLI use `link:` protocol in package.json to resolve local @grapity/core and @grapity/registry. This is the Bun-native approach for monorepo-like linking without a workspace.

```bash
# 1. Build and link core
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

No `bun link @grapity/core` step needed. The `link:` protocol in package.json handles resolution automatically.

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