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

From any repo, you can link local packages for development:

```bash
# 1. Build and link core
cd ~/workspace/grapity/core
bun install && bun run build
bun link

# 2. Link and build registry
cd ~/workspace/grapity/registry
bun install
bun link @grapity/core
bun run build
bun link

# 3. Link and build cli
cd ~/workspace/grapity/cli
bun install
bun link @grapity/core
bun link @grapity/registry
bun run build
```

### Checking link status

```bash
ls -la node_modules/@grapity/core
# Symlink: node_modules/@grapity/core -> /Users/you/workspace/grapity/core
# npm:      node_modules/@grapity/core/  (regular directory)
```

### Unlinking (restore npm versions)

Always unlink before pushing to ensure CI resolves packages from npm:

```bash
# In registry/
bun unlink @grapity/core && bun install

# In cli/
bun unlink @grapity/core @grapity/registry && bun install
```

### After changes in core

```bash
cd ~/workspace/grapity/core
bun run build   # Rebuild. Symlinks pick up changes automatically.
```

## Publishing

Publishing is handled by GitHub Actions. Do not publish manually.

## License

Apache-2.0