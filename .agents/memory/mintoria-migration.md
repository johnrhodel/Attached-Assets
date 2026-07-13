---
name: Mintoria migration quirks
description: Key decisions and gotchas from porting Mintoria (NFT SaaS) into pnpm_workspace
---

# Mintoria migration decisions

**Why:** Recorded after porting a large (~1800 line routes.ts) legacy fullstack app to the multi-artifact scaffold.

## Route pattern

Keep `registerRoutes(httpServer, app)` — do NOT convert to Express Router. The original routes have session middleware, PostgreSQL session store, and crypto setup that runs at module-level before any route handlers. Wrapping in a Router breaks this.

**How to apply:** In `app.ts`, import `registerRoutes` from `./routes/routes` and call it with the httpServer + app. Export the httpServer from `app.ts` and use it in `index.ts` instead of `app.listen`.

## @shared/routes in frontend

The frontend hooks import `api` and `buildUrl` from `@shared/routes`. Solution:
1. Copy `shared/routes.ts` to `artifacts/<name>/src/lib/shared-routes.ts`
2. Remove drizzle schema imports (replace `z.custom<typeof X>()` with `z.any()`, remove `.omit()/.partial()` chained calls from `z.any()`)
3. Add vite alias: `"@shared/routes": path.resolve(import.meta.dirname, "src/lib/shared-routes.ts")`

**Why:** Can't import `@workspace/db` in frontend (triggers DB connection code).

## Tailwind v3

The app uses Tailwind v3. Frontend copy script detects this and removes `@tailwindcss/vite`. Use `css.postcss.plugins` in vite.config.ts instead.

## Dependencies needed in api-server

These must be explicitly added (not in default scaffold):
- `express-session`, `connect-pg-simple` — session handling
- `express-rate-limit`, `helmet` — security middleware
- `qrcode`, `multer`, `resend` — features
- `@solana/web3.js`, `@metaplex-foundation/umi-bundle-defaults`, `@metaplex-foundation/mpl-core`, `@metaplex-foundation/umi`, `bs58` — Solana
- `ethers` — EVM
- `zod`, `pg` — runtime (not inherited from @workspace/db)

## zod/v4 in server files

The backend copy script updates `from "zod"` → `from "zod/v4"` in schema files. But esbuild can't resolve `zod/v4` unless `zod` is listed in the api-server's own `dependencies`. Add `zod` explicitly.

## DB push with data-loss warning

Use `drizzle-kit push --force` flag when running non-interactively (TTY unavailable).
