# Mintoria - Commemorative NFT Minting Platform

## Overview
Mintoria is a plug-and-play platform for minting commemorative NFTs for visitors at tourist locations and events. It enables quick NFT claims via QR code on mobile devices and exclusively uses the Stellar blockchain (testnet) for its efficiency. EVM and Solana chain routes return 503 (disabled). The platform includes an admin interface for creating monthly "drops" across various locations, supports internationalization (EN/PT/ES) with automatic browser language detection, and offers email-based custodial minting without requiring crypto wallets. Key features include embeddable widget integration, PWA functionality, and social sharing (Twitter/X + Instagram). The project is evolving from a single-admin tool to a multi-tenant platform with organizer self-registration and freemium plans (Free/Starter/Professional/Enterprise). Plan-based mint limits and location limits are enforced server-side. Future plans include Soroban smart contracts, an NFT marketplace, and AI-powered NFT generation.

## User Preferences
Preferred communication style: Simple, everyday language. User speaks Portuguese.

## System Architecture
Mintoria utilizes a client-server architecture. The frontend is a React application, and the backend is a Node.js Express server. Data is stored in PostgreSQL, and blockchain interactions are exclusively handled with Stellar (testnet). EVM and Solana routes return 503.

### Frontend
The UI is built with React 18, TypeScript, and Tailwind CSS, utilizing `shadcn/ui` components, Wouter for routing, and TanStack React Query for state management. Framer Motion handles animations. The application supports PWA functionality and internationalization for English, Portuguese, and Spanish with automatic browser language detection and a professional blue-based color scheme. Local images are served from `/client/public/images/` (e.g., `rio-cristo-redentor.png`, `curitiba-jardim-botanico.png`, `foz-cataratas.png`).

### Backend
The backend is a Node.js Express application in TypeScript (ESM), providing RESTful APIs for claim sessions, anti-fraud measures, and blockchain interactions. Zod is used for validation, and Helmet provides security headers. Authentication uses cookie-based sessions, and passwords are scrypt-hashed. Middleware chain: `requireAuth` → `requireAdmin` / `requireOrganizerOrAdmin` / `requireProjectOwnership` / `requireDropOwnership`.

### Data Management
PostgreSQL, managed by Drizzle ORM, is the primary database, storing all application data including user, project, location, drop, mint, custodial wallet, pricing plan, and notification records. Users have a `planSlug` field (default "free") linking to pricing plans. Pricing plans include `slug`, `maxMintsPerDrop`, and `maxLocations` fields for enforcement.

### Blockchain Interaction
Mintoria integrates exclusively with the Stellar blockchain via `stellar-sdk` and the Horizon API (testnet only). EVM and Solana routes return 503 (disabled). NFTs are minted by storing metadata on-chain using `manageData` operations. Server-side Stellar keypair generation only. Custodial wallets use Stellar keypairs encrypted with AES-256-CBC via `WALLET_ENCRYPTION_SECRET`.

### Core Features
- **Public Claim Pages**: `/claim/:locationId` and `/embed/:locationId` for visitor NFT claims with access code verification.
- **NFT Gallery**: `/gallery/:locationId` displays minted NFTs for a location.
- **User NFT Lookup**: `/my-nfts` allows users to find their NFTs by email.
- **Admin Dashboard**: For project, location, and drop management, analytics, system health, and mint reset capability.
- **Organizer Dashboard**: Dedicated layout (`/organizer`) for organizers with stat cards, plan usage bar, projects list, create project dialog, mints chart, drops overview, and recent mints.
- **Organizer Registration**: Self-registration at `/register` with role-based redirects (admin → `/admin`, organizer → `/organizer`).
- **Email Service**: For sending verification codes and mint confirmations via Resend.
- **Internationalization (i18n)**: Full support for English, Portuguese, and Spanish with automatic browser language detection.
- **Custodial Wallet System**: Generates and encrypts Stellar keypairs for server-side minting without user crypto wallets.
- **PWA & Embed**: PWA with manifest/service worker, iFrame embed, and script widget.
- **Social Sharing**: After minting, visitors can share their NFT to Twitter/X, Instagram, or download the NFT image.
- **Plan-Based Limits**: Server-side enforcement of mint limits per drop and location limits per plan (Free: 50 mints/drop, 1 location).
- **Reset Mints**: Admin-only endpoint (`POST /api/admin/reset-mints`) to reset all mint counts.
- **Demo Locations**: 4 seeded locations with access codes — Paris (PARIS2026), Rio de Janeiro (RIO2026), Curitiba (CURITIBA2026), Foz do Iguaçu (FOZ2026).

### Business Model / Pricing Tiers
- **Free**: 50 mints/event, 1 location (default for organizer registration)
- **Starter**: R$599/event, up to 500 mints, QR code generation, basic analytics, email support
- **Professional**: R$1,497/month, unlimited mints, up to 5 locations, advanced analytics, priority support, custom branding
- **Enterprise**: R$4,997/month, everything unlimited, white-label, API access, dedicated support, custom integrations

### Security Features
- Helmet middleware for HTTP security headers.
- Session cookies with `httpOnly`, `secure`, and `sameSite: 'lax'`.
- Middleware chain: `requireAuth`, `requireAdmin`, `requireOrganizerOrAdmin`, `requireProjectOwnership`, `requireDropOwnership`.
- Login rate limiting (5 attempts/15min), registration rate limiting, production secrets enforcement, and sanitized error responses.
- Cryptographically secure verification tokens.
- Admin-only mint reset capability.
- Plan-based enforcement returns structured error codes (`PLAN_MINT_LIMIT`, `PLAN_LOCATION_LIMIT`).

### Key Credentials (Dev/Seed)
- Seeded admin and demo location access codes exist for development testing.
- Server keypair loaded from `STELLAR_SERVER_SECRET_KEY` environment variable.

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
- Framer Motion

### Security
- `helmet`

### Email Service
- Resend
