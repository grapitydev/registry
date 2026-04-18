# Contributing to @grapity/registry

## Prerequisites

- [Bun](https://bun.sh/) >= 1.3
- [oasdiff](https://github.com/Tufin/oasdiff) (required at runtime for compat checking)
- Node.js >= 18 (for type checking)

Install oasdiff:

```bash
brew install tufin/tufin/oasdiff
```

## Setup

```bash
bun install
```

## Development

```bash
# Type check
bun run typecheck

# Build
bun run build

# Run tests
bun run test

# Start dev server
bun run dev
```

## Local Linking for Development

@grapity/registry depends on @grapity/core and is a peer dependency of @grapity/cli.

```bash
# First, link core (one time)
cd ../core && bun run build && bun link

# Then, in this repo (registry/)
bun link @grapity/core
bun install
bun run build
bun link
```

Then in cli/:

```bash
bun link @grapity/core
bun link @grapity/registry
bun install
```

**Always unlink before pushing:**

```bash
bun unlink @grapity/core
bun install
```

Check if a link is active:

```bash
ls -la node_modules/@grapity/core
# A symlink shows: node_modules/@grapity/core -> /path/to/core
```

## Publishing

Publishing is handled by GitHub Actions. Do not publish manually.

## License

Apache-2.0