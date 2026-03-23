# Mintoria - Commemorative NFT Minting Platform

## Overview
Mintoria is a plug-and-play platform for minting commemorative NFTs for visitors at tourist locations and events. It enables quick NFT claims via QR code on mobile devices and exclusively uses the Stellar blockchain for its efficiency. The platform includes an admin interface for creating monthly "drops" across various locations, supports internationalization (EN/PT/ES) with automatic browser language detection, and offers email-based custodial minting without requiring crypto wallets. Key features include embeddable widget integration, PWA functionality, and social sharing (Twitter/X + Instagram). The project is evolving from a single-admin tool to a multi-tenant platform with organizer self-registration and freemium plans. Future plans include Soroban smart contracts, an NFT marketplace, and AI-powered NFT generation.

## User Preferences
Preferred communication style: Simple, everyday language. User speaks Portuguese.

## System Architecture

### High-Level Architecture
Mintoria utilizes a client-server architecture. The frontend is a React application, and the backend is a Node.js Express server. Data is stored in PostgreSQL, and blockchain interactions are exclusively handled with Stellar (testnet). EVM and Solana routes exist but return 503 (disabled), directing all users to Stellar.

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│  React 18 + TypeScript + Tailwind + shadcn/ui       │
│  Wouter (routing) · TanStack Query (state)          │
│  Framer Motion (animations) · PWA + i18n (EN/PT/ES) │
│  Auto language detection · Local images (/images/)  │
└───────────────────────┬─────────────────────────────┘
                        │ REST API (JSON)
┌───────────────────────▼─────────────────────────────┐
│                    BACKEND                          │
│  Node.js + Express + TypeScript (ESM)               │
│  Zod validation · Session auth · Helmet security    │
│  Claim sessions · Anti-fraud tokens                 │
├──────────┬────────────────────────┬─────────────────┤
│          │                        │                 │
│  ┌───────▼───────┐   ┌───────────▼──────────┐      │
│  │  PostgreSQL   │   │  Stellar Blockchain  │      │
│  │  (Drizzle ORM)│   │  (stellar-sdk)       │      │
│  │               │   │  Testnet only         │      │
│  │  Users        │   │  manageData ops      │      │
│  │  Projects     │   │  NFT metadata        │      │
│  │  Locations    │   │  Server keypair       │      │
│  │  Drops        │   │  Custodial wallets    │      │
│  │  ClaimSessions│   │  Testnet auto-fund    │      │
│  │  Mints        │   └──────────────────────┘      │
│  │  WalletlessKeys│                                 │
│  │  WalletlessUsers│  ┌──────────────────────┐      │
│  │  PricingPlans │   │  Email Service       │      │
│  │  ActivityLogs │   │  (Resend)            │      │
│  │  Notifications│   │  Verification codes  │      │
│  └───────────────┘   │  Mint confirmations   │      │
│                      └──────────────────────┘      │
└─────────────────────────────────────────────────────┘
```

### Frontend
The UI is built with React 18, TypeScript, and Tailwind CSS, utilizing `shadcn/ui` components, Wouter for routing, and TanStack React Query for state management. Framer Motion handles animations. The application supports PWA functionality and internationalization for English, Portuguese, and Spanish with automatic browser language detection and a professional blue-based color scheme. Location images are served locally from `client/public/images/`.

### Backend
The backend is a Node.js Express application in TypeScript (ESM), providing RESTful APIs for claim sessions, anti-fraud measures, and blockchain interactions. Zod is used for validation, and Helmet provides security headers. Authentication uses cookie-based sessions, and passwords are scrypt-hashed. EVM and Solana mint routes exist but return 503 (disabled), directing all minting to Stellar.

### Data Management
PostgreSQL, managed by Drizzle ORM, is the primary database, storing all application data including user, project, location, drop, mint, and custodial wallet records. The `users` table includes a `role` field supporting "admin" and "organizer" roles. Projects have a `userId` field linking them to their owner.

### Blockchain Interaction
Mintoria integrates exclusively with the Stellar blockchain via `stellar-sdk` and the Horizon API (testnet only). NFTs are minted by storing metadata on-chain using `manageData` operations. The platform uses server-side Stellar keypair generation only. Custodial wallets are encrypted with AES-256-CBC using `WALLET_ENCRYPTION_SECRET` and stored in the `walletless_keys` table. EVM and Solana routes exist in the codebase but return 503, directing all users to Stellar.

### Core Features
- **Public Claim Pages**: `/claim/:locationId` and `/embed/:locationId` for visitor NFT claims.
- **NFT Gallery**: `/gallery/:locationId` displays minted NFTs for a location.
- **User NFT Lookup**: `/my-nfts` allows users to find their NFTs by email.
- **Admin Dashboard**: `/admin/dashboard` with analytics charts (Recharts), project/location/drop management, activity log, Stellar network health status, and Reset Mints button (clears all mints, walletless keys/users, and claim sessions with double confirmation in UI).
- **Admin Login**: `/admin/login` with email + password authentication and back button to landing page.
- **Email Service**: For sending verification codes and mint confirmations via Resend.
- **Landing Page**: Includes pricing tiers (Starter/Professional/Enterprise), live platform stats, team section, and access code entry.
- **Internationalization (i18n)**: Full support for English, Portuguese, and Spanish with automatic browser language detection based on `navigator.language`.
- **NFT Metadata API**: Serves on-chain NFT metadata resolved from the database.
- **Custodial Wallet System**: Generates and encrypts Stellar keypairs (AES-256-CBC) for server-side minting without user crypto wallets. Encrypted keypairs stored in `walletless_keys` table, user records in `walletless_users` table.
- **Mint Reliability**: Supply checks before blockchain calls, orphaned transaction logging, automatic cleanup of expired claim sessions.
- **PWA & Embed**: PWA with manifest/service worker, iFrame embed, and script widget.
- **Social Sharing**: After minting, visitors can share their NFT to Twitter/X (pre-formatted tweet with explorer link), Instagram (Web Share API on mobile, fallback to download + deep link), or download the NFT image directly. Icons use `react-icons/si` (SiX, SiInstagram). Share text templates fully translated across all three languages.
- **4 Demo Locations**: Paris (Eiffel Tower), Rio de Janeiro (Cristo Redentor), Curitiba (Palácio de Cristal), Foz do Iguaçu (Cataratas) with local images served from `client/public/images/`.

### Security Features
- Helmet middleware for HTTP security headers (frameguard + CSP frame-ancestors).
- Session cookies with `httpOnly`, `secure` (production), and `sameSite: 'lax'`.
- Admin route authentication middleware (`requireAuth`) on all admin endpoints.
- Login rate limiting, production secrets enforcement, and sanitized error responses.
- Cryptographically secure verification tokens.
- Mint uniqueness enforced per email per drop, and supply check before blockchain calls.
- In-memory rate limiting on `/api/walletless/start`.
- Email format validation and normalization.
- Admin reset endpoint (`/api/admin/reset-mints`) clears all mints, custodial wallets (`walletless_keys` + `walletless_users`), and claim sessions. UI requires double confirmation before executing.

## Visitor Mint Flow (Step-by-Step)

1. **Scan QR** — Visitor scans QR code at location, opens `/claim/:locationId`
2. **Click Claim** — Creates anti-fraud claim session (5-min expiry token)
3. **Enter Email** — `POST /api/walletless/start`: validates/normalizes email, rate-limits, generates 6-digit OTP, sends via Resend, creates custodial Stellar wallet (AES-256-CBC encrypted keypair)
4. **Enter Code** — `POST /api/walletless/mine`: verifies OTP, checks supply limit + mint uniqueness, decrypts custodial key, builds Stellar TX with `manageData`, submits to network
5. **Success** — Returns txHash + explorer URL. Visitor can view on Stellar Explorer, share on Twitter/X, share on Instagram (Web Share API or download + deep link), or download NFT image

## Admin Operation Flow (Step-by-Step)

1. **Login** — `/admin/login` with email + password (scrypt verify, session cookie created, back button to landing page)
2. **Create Project** — `POST /api/projects` (organization-level container)
3. **Create Location** — `POST /api/projects/:id/locations` (physical place with image)
4. **Create Drop** — `POST /api/drops` (title, image, supply limit, month/year, access code)
5. **Publish Drop** — `PATCH /api/drops/:id/publish` (changes status to published)
6. **Generate QR** — Creates QR code pointing to `/claim/:locationId`
7. **Monitor** — `/admin/dashboard`: total mints, mints by location chart, activity log, Stellar health, Reset Mints (double confirm)
8. **Reset Mints** — Clears all mints, walletless keys/users, and claim sessions (development/testing utility)

## Social Sharing (Twitter/X and Instagram)

After minting, visitors can share their commemorative NFT:
- **Twitter/X**: Opens pre-formatted tweet with drop title + Stellar explorer link. Share text translated (EN/PT/ES).
- **Instagram**: Uses Web Share API on mobile (with canShare guard and AbortError handling); falls back to download + Instagram deep link + toast notification.
- **Download**: Saves NFT image directly to device.

Share buttons displayed in grid layout (X and Instagram side by side), with translated divider label, Download as outline button, and back as ghost button. Icons use `react-icons/si` (SiX, SiInstagram). Share text templates fully translated across all three languages.

## Demo Locations

| Location | Access Code | Claim URL |
|----------|-------------|-----------|
| Paris (Eiffel Tower) | PARIS2026 | `/claim/1` |
| Rio de Janeiro (Cristo Redentor) | RIO2026 | `/claim/3` |
| Curitiba (Palácio de Cristal) | CURITIBA2026 | `/claim/4` |
| Foz do Iguaçu (Cataratas) | FOZ2026 | `/claim/5` |

Location images served from `client/public/images/`.

## External Dependencies

### Database
- PostgreSQL
- Drizzle ORM

### Blockchain
- `stellar-sdk` (Stellar testnet only)

### UI/UX
- shadcn/ui
- Lucide React
- react-icons (SiX, SiInstagram for social sharing)
- Embla Carousel
- Recharts (admin analytics charts)
- Framer Motion (animations)

### Security
- `helmet`

### Email Service
- Resend

## Roadmap

### Current State (v1.0)
Fully functional commemorative NFT minting on Stellar classic (testnet). QR code claim flow, email-based custodial wallets (AES-256-CBC encrypted Stellar keypairs), admin dashboard with analytics and full data reset, i18n (EN/PT/ES) with browser auto-detection, PWA, embeddable widget, access codes, 4 demo locations (Paris/Rio/Curitiba/Foz do Iguaçu) with local images, social sharing (Twitter/X + Instagram with Web Share API), NFT metadata API. Admin login with back button to landing page. Production deployed and security hardened. EVM/Solana routes disabled (503). Multi-tenant schema in progress (users.role, projects.userId).

### Short-term (v1.1) — In Progress
Organizer self-registration and authentication, dedicated organizer dashboard, plan-based mint limits (freemium model), admin organizer management panel.

### Medium-term (v2.0)
Soroban smart contract migration, NFT marketplace, multi-admin RBAC, white-label solution, API access, advanced reporting, enhanced analytics, multi-image drops, webhooks, branded email templates.

### Long-term (v3.0+)
MPC custody, multi-chain expansion (Ethereum/Solana), AI-powered NFT generation, decentralized storage (IPFS/Arweave), mobile SDK, enterprise SSO.

## Business Model
- **Target**: Tourism operators, event organizers, museums, parks, festivals
- **Free**: Up to 50 mints/event, 1 location (freemium tier — in development)
- **Starter**: R$599/event (up to 500 mints, 1 location)
- **Professional**: R$1.497/month (unlimited mints, 5 locations, custom branding)
- **Enterprise**: R$4.997/month (unlimited everything, white-label, API access, dedicated support)
- **Revenue**: SaaS subscriptions, per-mint fees at scale, white-label licensing, marketplace commissions (v2.0+)
