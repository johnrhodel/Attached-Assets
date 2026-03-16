# Mintoria - Commemorative NFT Minting Platform

## Overview
Mintoria is a plug-and-play platform for minting commemorative NFTs for visitors at tourist locations and events. It enables quick NFT claims via QR code on mobile devices and exclusively uses the Stellar blockchain for its efficiency. The platform includes an admin interface for creating monthly "drops" across various locations, supports internationalization, and offers email-based custodial minting without requiring crypto wallets. Key features include embeddable widget integration and PWA functionality. The project aims to become a leading NFT minting solution for the tourism and event industries, with future plans for Soroban smart contracts, an NFT marketplace, and advanced features like AI-powered NFT generation.

## User Preferences
Preferred communication style: Simple, everyday language. User speaks Portuguese.

## System Architecture

### High-Level Architecture
Mintoria utilizes a client-server architecture. The frontend is a React application, and the backend is a Node.js Express server. Data is stored in PostgreSQL, and blockchain interactions are exclusively handled with Stellar.

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│  React 18 + TypeScript + Tailwind + shadcn/ui       │
│  Wouter (routing) · TanStack Query (state)          │
│  Framer Motion (animations) · PWA + i18n (EN/PT/ES) │
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
│  │               │   │                      │      │
│  │  Users        │   │  manageData ops      │      │
│  │  Projects     │   │  NFT metadata        │      │
│  │  Locations    │   │  Server keypair       │      │
│  │  Drops        │   │  Custodial wallets    │      │
│  │  ClaimSessions│   │  Testnet auto-fund    │      │
│  │  Mints        │   └──────────────────────┘      │
│  │  WalletlessKeys│                                 │
│  │  PricingPlans │   ┌──────────────────────┐      │
│  │  ActivityLogs │   │  Email Service       │      │
│  │  Notifications│   │  (Resend)            │      │
│  └───────────────┘   │  Verification codes  │      │
│                      │  Mint confirmations   │      │
│                      └──────────────────────┘      │
└─────────────────────────────────────────────────────┘
```

### Frontend
The UI is built with React 18, TypeScript, and Tailwind CSS, utilizing `shadcn/ui` components, Wouter for routing, and TanStack React Query for state management. Framer Motion handles animations. The application supports PWA functionality and internationalization for English, Portuguese, and Spanish, with a professional blue-based color scheme.

### Backend
The backend is a Node.js Express application in TypeScript (ESM), providing RESTful APIs for claim sessions, anti-fraud measures, and blockchain interactions. Zod is used for validation, and Helmet provides security headers. Authentication uses cookie-based sessions, and passwords are scrypt-hashed.

### Data Management
PostgreSQL, managed by Drizzle ORM, is the primary database, storing all application data including user, project, location, drop, and mint records.

### Blockchain Interaction
Mintoria integrates exclusively with the Stellar blockchain via `stellar-sdk` and the Horizon API (testnet). NFTs are minted by storing metadata on-chain using `manageData` operations. The platform supports server-side keypair generation and custodial wallet management for email-based minting. EVM and Solana routes exist but return 503 (disabled), directing users to Stellar.

### Core Features
- **Public Claim Pages**: `/claim/:locationId` and `/embed/:locationId` for visitor NFT claims.
- **NFT Gallery**: `/gallery/:locationId` displays minted NFTs for a location.
- **User NFT Lookup**: `/my-nfts` allows users to find their NFTs by email.
- **Admin Dashboard**: `/admin/dashboard` with analytics charts, project/location/drop management, and Reset Mints button (clears mints, walletless keys/users, and claim sessions).
- **Email Service**: For sending verification codes and mint confirmations via Resend.
- **Landing Page**: Includes pricing tiers, live platform stats, team section, and access code entry.
- **Internationalization (i18n)**: Full support for English, Portuguese, and Spanish with automatic language detection.
- **NFT Metadata API**: Serves on-chain NFT metadata resolved from the database.
- **Custodial Wallet System**: Generates and encrypts Stellar keypairs (AES-256-CBC) for server-side minting without user crypto wallets. Keypairs stored in `walletless_keys` table, user records in `walletless_users`.
- **Mint Reliability**: Supply checks before blockchain calls, orphaned transaction logging, automatic cleanup of expired claim sessions.
- **PWA & Embed**: PWA with manifest/service worker, iFrame embed, and script widget.
- **Social Sharing**: Allows sharing of minted NFTs to Twitter/X and Instagram, and direct image download.

### Security Features
- Helmet middleware for HTTP security headers (frameguard + CSP frame-ancestors).
- Session cookies with `httpOnly`, `secure` (production), and `sameSite: 'lax'`.
- Admin route authentication middleware (`requireAuth`) on all admin endpoints.
- Login rate limiting, production secrets enforcement, and sanitized error responses.
- Cryptographically secure verification tokens.
- Mint uniqueness enforced per email per drop, and supply check before blockchain calls.
- In-memory rate limiting on `/api/walletless/start`.
- Email format validation and normalization.
- Admin reset endpoint clears all mints, custodial wallets, and claim sessions (with double confirmation in UI).

## Visitor Mint Flow (Step-by-Step)

1. **Scan QR** — Visitor scans QR code at location, opens `/claim/:locationId`
2. **Click Claim** — Creates anti-fraud claim session (5-min expiry token)
3. **Enter Email** — `POST /api/walletless/start`: validates/normalizes email, rate-limits, generates 6-digit OTP, sends via Resend, creates custodial Stellar wallet (AES-256-CBC encrypted keypair)
4. **Enter Code** — `POST /api/walletless/mine`: verifies OTP, checks supply limit + mint uniqueness, decrypts custodial key, builds Stellar TX with `manageData`, submits to network
5. **Success** — Returns txHash + explorer URL. Visitor can view on Stellar Explorer, share on Twitter/X, share on Instagram, or download NFT image

## Admin Operation Flow (Step-by-Step)

1. **Login** — `/admin/login` with email + password (scrypt verify, session cookie created, back button to landing page)
2. **Create Project** — `POST /api/projects` (organization-level container)
3. **Create Location** — `POST /api/projects/:id/locations` (physical place with image)
4. **Create Drop** — `POST /api/drops` (title, image, supply limit, month/year, access code)
5. **Publish Drop** — `PATCH /api/drops/:id/publish` (changes status to published)
6. **Generate QR** — Creates QR code pointing to `/claim/:locationId`
7. **Monitor** — `/admin/dashboard`: total mints, mints by location chart, activity log, Stellar health, Reset Mints (double confirm)

## Social Sharing (Twitter/X and Instagram)

After minting, visitors can share their commemorative NFT:
- **Twitter/X**: Opens pre-formatted tweet with drop title + Stellar explorer link. Share text translated (EN/PT/ES).
- **Instagram**: Downloads NFT image to device, opens Instagram app via mobile deep link for posting.
- **Download**: Saves NFT image directly to device.

Icons use `react-icons/si` (SiX, SiInstagram). Share text templates are fully translated across all three languages.

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
- `stellar-sdk`

### UI/UX
- shadcn/ui
- Lucide React
- react-icons
- Embla Carousel
- Recharts

### Security
- `helmet`

### Email Service
- Resend

## Roadmap

### Current State (v1.0)
Fully functional commemorative NFT minting on Stellar classic (testnet). QR code claim flow, email-based custodial wallets, admin dashboard with analytics and full data reset, i18n (EN/PT/ES) with browser auto-detection, PWA, embeddable widget, access codes, 4 demo locations (Paris/Rio/Curitiba/Foz do Iguaçu), social sharing (Twitter/X + Instagram), NFT metadata API. Location images served locally from `client/public/images/`. Production deployed and security hardened. EVM/Solana routes disabled (503).

### Short-term (v1.1)
Enhanced analytics, multi-image drops, webhooks, branded email templates.

### Medium-term (v2.0)
Soroban smart contract migration, NFT marketplace, multi-admin RBAC, white-label solution, API access, advanced reporting.

### Long-term (v3.0+)
MPC custody, multi-chain expansion (Ethereum/Solana), AI-powered NFT generation, decentralized storage (IPFS/Arweave), mobile SDK, enterprise SSO.

## Business Model
- **Target**: Tourism operators, event organizers, museums, parks, festivals
- **Starter**: R$599/event (up to 500 mints, 1 location)
- **Professional**: R$1.497/month (unlimited mints, 5 locations, custom branding)
- **Enterprise**: R$4.997/month (unlimited everything, white-label, API access, dedicated support)
- **Revenue**: SaaS subscriptions, per-mint fees at scale, white-label licensing, marketplace commissions (v2.0+)