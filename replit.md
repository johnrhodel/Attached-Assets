# Mintoria

Plataforma SaaS multi-tenant para mintagem de NFTs comemorativos na Solana devnet. Os usuários escaneiam QR codes em eventos, shows e atrações turísticas para mintar NFTs digitais únicos. Disponível em EN/PT/ES. Live em https://mintoria.xyz.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — rodar o servidor API (porta 8080)
- `pnpm --filter @workspace/mintoria run dev` — rodar o frontend (porta 24783)
- `pnpm run typecheck` — typecheck completo em todos os pacotes
- `pnpm run build` — typecheck + build de todos os pacotes
- `pnpm --filter @workspace/db run push` — push de mudanças no schema do DB (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v3 + Wouter
- API: Express 5 + pino logging
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Blockchain: Solana devnet + Metaplex MPL Core, EVM (Sepolia), Stellar testnet
- i18n: EN / PT / ES (client/src/lib/i18n/)
- Build: esbuild (CJS bundle) for server, Vite for frontend

## Where things live

- `artifacts/mintoria/` — frontend React app (previewPath: `/`)
- `artifacts/api-server/` — backend Express API (previewPath: `/api`)
- `lib/db/src/schema/schema.ts` — Drizzle schema (source of truth)
- `artifacts/api-server/src/routes/routes.ts` — all API routes (~1800 lines)
- `artifacts/api-server/src/storage.ts` — database storage layer
- `artifacts/api-server/src/services/` — solana, evm, stellar, wallet, email services
- `artifacts/mintoria/src/lib/shared-routes.ts` — frontend-safe copy of API route definitions

## Architecture decisions

- Routes use `registerRoutes(httpServer, app)` pattern (NOT Express Router) — complex session/auth middleware requires direct app access
- Frontend `@shared/routes` resolves to `artifacts/mintoria/src/lib/shared-routes.ts` via Vite alias — frontend-safe version without drizzle imports
- Tailwind v3 (not v4) — uses postcss plugins, not `@tailwindcss/vite`
- No OpenAPI codegen — legacy app uses existing fetch layer in hooks (use-auth, use-drops, etc.)
- Session stored in PostgreSQL via `connect-pg-simple`

## Product

- **Homepage**: landing com slides de localizações, estatísticas de NFTs mintados
- **Claim flow**: usuário escaneia QR → acessa `/claim/:locationId` → escolhe chain → minta NFT
- **Walletless**: mint via email + OTP (sem carteira própria) na Solana
- **Admin dashboard**: gerencia projetos, localizações, drops, organizadores
- **Organizer dashboard**: painel do organizador com suas localizações
- **i18n**: EN/PT/ES com troca dinâmica

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `@workspace/db` exports `db` (drizzle instance) AND all schema tables/types — use `@workspace/db` for both in server code
- `api-server/src/db.ts` is a local wrapper around `@workspace/db` schema (needed for `registerRoutes` imports)
- Run `pnpm approve-builds` if packages with native modules (bufferutil, utf-8-validate) warn about build scripts
- The seed function in routes.ts runs on startup — duplicate key errors on re-start are expected and harmless

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
