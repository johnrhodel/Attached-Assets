# Mintoria - Commemorative NFT Minting Platform

## Overview
Mintoria is a multi-tenant SaaS platform for minting commemorative NFTs at tourist locations and events, built exclusively on the Stellar blockchain (testnet). Visitors scan QR codes, enter their email, and receive NFTs — no crypto wallet needed. The platform supports self-service organizer registration with a freemium model (Free/Starter/Professional/Enterprise), plan-based mint and location limits, admin oversight of all organizers, full internationalization (EN/PT/ES), PWA functionality, and social sharing.

## User Preferences
Preferred communication style: Simple, everyday language. User speaks Portuguese.

## System Architecture
Mintoria uses a client-server architecture with a React frontend, Node.js/Express backend, PostgreSQL database, and Stellar blockchain (testnet only). EVM and Solana chain routes return 503 (disabled).

### Multi-Tenant Model
The platform supports two user roles:
- **Admin**: Full platform control — manages all projects, locations, drops, organizers, pricing plans, settings, and system health. Can activate/deactivate organizer accounts.
- **Organizer**: Self-registers at `/register`, assigned the Free plan by default. Owns their projects, locations, and drops. Subject to plan-based limits (mints per drop, max locations). Data is isolated — organizers only see their own resources.

Middleware chain enforces access control: `requireAuth` → `requireAdmin` / `requireOrganizerOrAdmin` / `requireProjectOwnership` / `requireDropOwnership`.

### Frontend
React 18 + TypeScript + Tailwind CSS + `shadcn/ui` components. Wouter for routing, TanStack React Query for state management, Framer Motion for animations. Supports PWA (manifest + service worker), i18n (EN/PT/ES with auto browser language detection), and a professional blue-based color scheme. Local images served from `/client/public/images/`.

### Backend
Node.js Express in TypeScript (ESM). RESTful APIs for claim sessions, anti-fraud, blockchain interactions, multi-tenant CRUD, and organizer management. Zod for validation, Helmet for security headers, cookie-based sessions, scrypt-hashed passwords.

### Database Schema
PostgreSQL managed by Drizzle ORM. Tables:
- **users**: `id`, `email`, `passwordHash`, `role` (admin/organizer), `name`, `isActive`, `planSlug` (default "free"), `createdAt`
- **projects**: `id`, `name`, `slug`, `userId` (FK → users), `createdAt`
- **locations**: `id`, `projectId` (FK → projects), `name`, `slug`, `createdAt`
- **drops**: `id`, `locationId`, `title`, `month`, `year`, `imageUrl`, `metadataUrl`, `supply`, `mintedCount`, `status`, `enabledChains`, `accessCode`, `createdAt`
- **mints**: `id`, `dropId`, `chain`, `recipient`, `txHash`, `status`, `email`, `createdAt` (unique index on email+dropId)
- **claim_sessions**: `id`, `dropId`, `tokenHash`, `status`, `ipHash`, `expiresAt`, `consumedAt`, `createdAt`
- **walletless_users**: `id`, `email`, `verifiedAt`, `createdAt`
- **walletless_keys**: `id`, `walletlessUserId`, `chain`, `address`, `encryptedSecret`, `createdAt`
- **activity_logs**: `id`, `userId`, `action`, `entity`, `entityId`, `details`, `createdAt`
- **platform_settings**: `id`, `key`, `value`, `updatedAt`
- **notifications**: `id`, `type`, `title`, `message`, `read`, `createdAt`
- **pricing_plans**: `id`, `name`, `slug`, `description`, `price`, `pricePer`, `features`, `highlighted`, `sortOrder`, `isActive`, `maxMintsPerDrop`, `maxLocations`, `updatedAt`

### Blockchain Interaction
Stellar only via `stellar-sdk` + Horizon API (testnet). EVM and Solana routes return 503. NFTs minted using `manageData` operations. Server-side Stellar keypair generation. Custodial wallets use AES-256-CBC encryption via `WALLET_ENCRYPTION_SECRET`.

### Core Features
- **Public Claim Pages**: `/claim/:locationId` and `/embed/:locationId` for visitor NFT claims with access code verification.
- **NFT Gallery**: `/gallery/:locationId` displays minted NFTs for a location.
- **User NFT Lookup**: `/my-nfts` allows users to find their NFTs by email.
- **Admin Dashboard**: Project/location/drop management, analytics (mints by month, by location), Stellar health monitor, mint reset, CSV export, organizer summary cards (total organizers, active, conversion rate).
- **Admin Organizer Panel**: `/admin/organizers` — list all organizers with filters (plan, search, date), pagination, activate/deactivate. `/admin/organizers/:id` — organizer detail with projects/locations/drops/mints hierarchy. Global stats: total, active, new this month, plan distribution, free→paid conversion.
- **Organizer Dashboard**: `/organizer/dashboard` — stat cards, plan usage bar, projects list, create project, mints chart, drops overview, recent mints. Organizers only see their own data.
- **Organizer Registration**: Self-registration at `/register` with email/password/name. Assigned Free plan. Redirected to login page (`/admin/login`). After login, role-based redirects (admin → `/admin/dashboard`, organizer → `/organizer/dashboard`).
- **Email Service**: Verification codes and mint confirmations via Resend.
- **Internationalization (i18n)**: Full EN/PT/ES with automatic browser language detection.
- **Custodial Wallet System**: Stellar keypairs encrypted with AES-256-CBC for server-side minting.
- **PWA & Embed**: PWA with manifest/service worker, iFrame embed, and script widget.
- **Social Sharing**: Twitter/X, Instagram, download NFT image after minting.
- **Plan-Based Limits**: Server-side enforcement — mint limits per drop and location limits per plan. Admin bypasses limits. Structured error codes: `PLAN_MINT_LIMIT`, `PLAN_LOCATION_LIMIT`.
- **Reset Mints**: Admin-only endpoint (`POST /api/admin/reset-mints`).
- **Demo Locations**: 4 seeded locations — Paris (PARIS2026), Rio de Janeiro (RIO2026), Curitiba (CURITIBA2026), Foz do Iguaçu (FOZ2026).

### Key Flows

**Visitor Mint Flow**:
1. Visitor scans QR code → opens `/claim/:locationId`
2. Enters access code (if required by drop)
3. Clicks "Claim Your Memory" → system creates anti-fraud session (5-min expiry)
4. Enters email → system sends 6-digit verification code
5. Enters code → system validates
6. **Plan limit check**: system verifies organizer's plan allows more mints for this drop
7. Server generates custodial Stellar wallet → mints NFT via `manageData` → records in DB
8. Confirmation email sent → visitor can share on social media

**Organizer Registration Flow**:
1. Visits `/register` → enters name, email, password
2. System creates user with `role: "organizer"`, `planSlug: "free"`, `isActive: true`
3. Redirected to login page (`/admin/login`)
4. Logs in → role-based redirect to `/organizer/dashboard`
5. Creates projects → locations → drops within plan limits
6. Generates QR codes, monitors mints on their dashboard

**Admin Organizer Management Flow**:
1. Admin views `/admin/organizers` → sees all organizers with metrics
2. Filters by plan, searches by email/name, filters by registration date
3. Views organizer details → sees their projects, locations, drops, mint counts
4. Can activate/deactivate organizer accounts

### Business Model / Pricing Tiers
- **Free**: 50 mints/drop, 1 location (default for organizer registration)
- **Starter**: R$599/event, up to 500 mints, 1 location, QR codes, basic analytics, email support
- **Professional**: R$1,497/month, unlimited mints, up to 5 locations, advanced analytics, priority support, custom branding
- **Enterprise**: R$4,997/month, everything unlimited, white-label, API access, dedicated support, custom integrations

### Security Features
- Helmet middleware for HTTP security headers.
- Session cookies with `httpOnly`, `secure`, and `sameSite: 'lax'`.
- Middleware chain: `requireAuth`, `requireAdmin`, `requireOrganizerOrAdmin`, `requireProjectOwnership`, `requireDropOwnership`.
- Login rate limiting (5 attempts/15min), registration rate limiting, production secrets enforcement, sanitized error responses.
- Cryptographically secure verification tokens.
- Admin-only mint reset capability.
- Plan-based enforcement with structured error codes.
- Data isolation: organizers only access their own projects/locations/drops via ownership middleware.
- Organizer detail API strips `passwordHash` from responses.
- Organizer toggle validates target role before status change.

### Current State & Roadmap

**v1.0 — Complete**: Core visitor flow (QR → Claim → Email → Verify → Mint → Share), custodial Stellar wallets, admin dashboard, 4 demo locations, social sharing, i18n (EN/PT/ES), PWA, embeddable widget, production security.

**v1.5 — Complete (Multi-Tenant)**: Self-service organizer registration, freemium model (Free plan default), dedicated organizer dashboard, plan-based enforcement (server-side limits with structured error codes), admin organizer management panel (list/filter/search/detail/activate/deactivate), platform metrics (organizer stats, conversion rates), data isolation via ownership middleware, full i18n for organizer features.

**v2.0 — Next**: Enhanced analytics, multi-image drops, webhook notifications, branded email templates, Stripe payment integration for plan upgrades.

**v3.0 — Future**: Soroban smart contracts, NFT marketplace, white-label solution, public API, advanced reporting.

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
