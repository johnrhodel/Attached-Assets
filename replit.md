# Mintoria - Commemorative NFT Minting Platform

## Overview
Mintoria is a multi-tenant SaaS platform enabling the minting of commemorative NFTs at tourist locations and events. Built on the Solana blockchain, it allows visitors to claim NFTs by scanning QR codes and entering their email, eliminating the need for a crypto wallet. The platform supports self-service organizer registration with a freemium model (Free/Starter/Professional/Enterprise), plan-based limits on mints and locations, and comprehensive admin oversight. It features full internationalization (EN/PT/ES), PWA functionality, and social sharing capabilities. Mintoria aims to revolutionize how physical experiences are commemorated with digital assets, offering a seamless and accessible entry point to NFTs for a broad audience.

## User Preferences
Preferred communication style: Simple, everyday language. User speaks Portuguese.

## System Architecture
Mintoria employs a client-server architecture. The frontend is built with React, TypeScript, Tailwind CSS, and `shadcn/ui`, utilizing Wouter for routing, TanStack React Query for state management, and Framer Motion for animations. It includes PWA features and supports i18n (EN/PT/ES) with a professional blue-based color scheme. The backend is a Node.js Express application in TypeScript, providing RESTful APIs for claim sessions, anti-fraud, blockchain interactions, multi-tenant CRUD, and organizer management. PostgreSQL, managed by Drizzle ORM, serves as the primary database.

The platform supports two main user roles: Admin and Organizer. Admins have full platform control, managing all aspects, while Organizers can self-register, manage their own projects, locations, and NFT drops within plan-based limits, with data isolation enforced by middleware.

NFTs are minted on the Solana devnet using Metaplex Core. The system uses a persistent server keypair loaded from `SOLANA_KEYPAIR_JSON` (preferred — accepts a JSON array of 64 integers), with `SOLANA_SERVER_SECRET_KEY` (base58 string) as fallback. Dynamic NFT metadata is served via a dedicated API endpoint to ensure proper display in Solana explorers and wallets. Custodial wallets use AES-256-CBC encryption.

The JSON-array format is preferred because it is immune to invisible-character corruption that can happen when pasting base58 strings into Secrets panels — any tampering breaks JSON parse explicitly instead of silently producing a wrong key.

**Stellar legacy code**: Mintoria originally supported multi-chain (Ethereum/Solana/Stellar) but migrated fully to Solana. The Stellar mint endpoint (`/api/mint/stellar/xdr`) returns HTTP 503 (disabled). The `server/services/stellar.ts` file remains as dead code (not invoked by any active route) and no longer requires `STELLAR_SERVER_SECRET_KEY` to boot — if absent in production, Stellar uses an ephemeral keypair (harmless because no real Stellar mints occur). The secret can be safely deleted from both Workspace and Deployment Secrets panels.

**Deployment Secrets requirement (operational rule)**: `SOLANA_SERVER_SECRET_KEY` must be configured in the **Deployment's Secrets pane**, which is **separate from workspace Secrets** — workspace secrets do **not** automatically propagate to the deployed runtime. In `NODE_ENV=production`, the server **fails fast on startup with `process.exit(1)`** if the secret is missing or fails to parse, with no silent fallback to an ephemeral keypair (this prevents minting against a throwaway wallet that would lose all SOL on every redeploy). In development, an ephemeral keypair is generated with a warning so local work continues. The `/api/blockchain/status` endpoint exposes `isEphemeral: boolean`, and the admin dashboard renders a prominent red banner whenever an ephemeral wallet is detected. The secret loader sanitizes the env value (trim, BOM strip, single matching wrapping-quote removal) before parsing, so common copy-paste accidents in the Secrets panel do not break boot.

**Wallet policy (devnet)**: dev and production currently share the **same Solana wallet** — the same `SOLANA_SERVER_SECRET_KEY` value lives in both the workspace Secrets panel and the Deployment Secrets panel. This keeps a single saldo and a single public key visible across environments while running in devnet (where SOL has no monetary value). Before migrating to mainnet, split into two distinct wallets (separate keypairs, separate funding) so that test mints in dev cannot drain real-money SOL from production.

**Wallet rotation procedure**: when a wallet must be replaced (e.g. compromised secret, or current secret value got corrupted in the Secrets panel), follow these steps:
1. Generate a new Solana keypair locally and verify the secret is clean base58 (87–88 chars, alphabet `[1-9A-HJ-NP-Za-km-z]`).
2. From the existing wallet, transfer the full balance (minus the network fee, ~5000 lamports) to the new wallet's public address. Confirm the tx on the devnet explorer.
3. Replace `SOLANA_SERVER_SECRET_KEY` with the new secret value in **both** the workspace Secrets panel **and** the Deployment Secrets panel (same name, same value).
4. Click **Republish** on the deployment.
5. Verify in the deployment logs: `[SOLANA] Loaded persistent keypair. Public key: <new address>`, balance > 0, and the admin ephemeral-wallet banner is hidden.

Core features include public claim pages, an NFT gallery, user NFT lookup by email, comprehensive admin and organizer dashboards, self-service organizer registration, and a password recovery flow. The system also integrates an email service for verification codes and mint confirmations, full internationalization, and robust security measures including Helmet middleware, secure session management, and rate limiting. Plan-based limits are enforced server-side, with structured error codes.

## External Dependencies
- PostgreSQL
- Drizzle ORM
- `@solana/web3.js`
- `shadcn/ui`
- Lucide React
- react-icons
- Embla Carousel
- Recharts
- Framer Motion
- `helmet`
- Resend (Email Service)