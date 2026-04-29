# Changelog

## [0.2.0](https://github.com/grapitydev/registry/compare/v0.1.0...v0.2.0) (2026-04-29)


### Features

* adopt data envelope for all responses and add version pagination ([9a93ef4](https://github.com/grapitydev/registry/commit/9a93ef42e580d41dc7b40e9317cba55f39471065))

## [0.1.0](https://github.com/grapitydev/registry/compare/v0.0.9...v0.1.0) (2026-04-26)


### Features

* add SVG favicon to welcome page ([e2764fd](https://github.com/grapitydev/registry/commit/e2764fdf970a1eebe468e79fff14b0364a58e93d))
* add welcome page at / with RGB glitch logo and API endpoint reference ([58f63bc](https://github.com/grapitydev/registry/commit/58f63bc0cf73219311c4cae93e0b3b7837141142))


### Bug Fixes

* correct RGB chromatic glitch logo using single SVG with blended layers ([536fbcf](https://github.com/grapitydev/registry/commit/536fbcf69e9dc533cc12906bd69f10cd2474e778))
* run dev server with Node.js via tsx to avoid Bun/better-sqlite3 ABI incompatibility ([8aff181](https://github.com/grapitydev/registry/commit/8aff1816d8caab674bbbba14351fc819eb90624d))

## [0.0.9](https://github.com/grapitydev/registry/compare/v0.0.8...v0.0.9) (2026-04-25)


### Bug Fixes

* resolve migration paths from src/ level for bundled output ([921d4f4](https://github.com/grapitydev/registry/commit/921d4f44e41eaa6f7a4329d1b4a702095510fbf9))

## [0.0.8](https://github.com/grapitydev/registry/compare/v0.0.7...v0.0.8) (2026-04-25)


### Bug Fixes

* include drizzle migrations in published package ([1cb7e81](https://github.com/grapitydev/registry/commit/1cb7e811219d01e128be35fca1e902fe979b809e))

## [0.0.7](https://github.com/grapitydev/registry/compare/v0.0.6...v0.0.7) (2026-04-25)


### Bug Fixes

* move fileURLToPath usage to module level to avoid tsup bundling issue ([fcbf675](https://github.com/grapitydev/registry/commit/fcbf675050afe6fb3a9156733684112f228e69af))
* use new URL() instead of fileURLToPath to avoid bundler issues ([4e55516](https://github.com/grapitydev/registry/commit/4e55516cc910a48299fefa0f451b2412385ea25b))

## [0.0.6](https://github.com/grapitydev/registry/compare/v0.0.5...v0.0.6) (2026-04-25)


### Bug Fixes

* replace Bun-specific APIs (import.meta.dir/main) with Node-compatible equivalents ([410eee9](https://github.com/grapitydev/registry/commit/410eee93a15fed911efb658fccebe170e0758a8f))

## [0.0.5](https://github.com/grapitydev/registry/compare/v0.0.4...v0.0.5) (2026-04-25)


### Bug Fixes

* add backend info to README ([21cfe63](https://github.com/grapitydev/registry/commit/21cfe63ce6c59940a42246e7a98f6f0d99a2d952))

## [0.0.4](https://github.com/grapitydev/registry/compare/v0.0.3...v0.0.4) (2026-04-25)


### Bug Fixes

* replace bun:sqlite with better-sqlite3 for Node.js compatibility ([2f6144c](https://github.com/grapitydev/registry/commit/2f6144c1c0c80b73845f39c560c1b31e4c160c41))

## [0.0.3](https://github.com/grapitydev/registry/compare/v0.0.2...v0.0.3) (2026-04-25)


### Bug Fixes

* bump @grapity/core dependency to ^0.0.4 ([48550b6](https://github.com/grapitydev/registry/commit/48550b602ed387743518543bb0f473461ac2d15d))
* switch to ESM-only with type: module and .js output ([4a58924](https://github.com/grapitydev/registry/commit/4a5892410748c64f180856b76c5905ec220d6d34))

## [0.0.2](https://github.com/grapitydev/registry/compare/v0.0.1...v0.0.2) (2026-04-25)


### Bug Fixes

* update @grapity/core dependency to ^0.0.3 ([a30a651](https://github.com/grapitydev/registry/commit/a30a6513be25ed22e73de95448a4ab599c47c7a7))
* update development instructions to use mise tasks ([60d2506](https://github.com/grapitydev/registry/commit/60d250615cac92a7afd5d98ab3dfc7b82522cc78))
