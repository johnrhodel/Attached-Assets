# Mintoria - Commemorative NFT Minting Platform

## Overview

Mintoria is a plug-and-play platform for minting commemorative NFTs for visitors at tourist locations or events. It enables quick NFT claims via QR code on mobile devices and exclusively utilizes the Stellar blockchain. The platform includes an admin interface for creating monthly "drops" across various locations and supports internationalization (English, Spanish, Portuguese). Key capabilities include email-based custodial minting (no crypto wallet required), embeddable widget integration, and PWA functionality for mobile installation.

The project's vision is to leverage Stellar's efficiency for low-cost, fast, and energy-efficient NFT minting, targeting the tourism and event industries. Future ambitions include migrating to Soroban smart contracts, developing an NFT marketplace, and implementing advanced features like MPC custody and AI-powered NFT generation.

## User Preferences

Preferred communication style: Simple, everyday language. User speaks Portuguese.

## System Architecture

### Frontend
The frontend is built with React 18 and TypeScript, using Wouter for routing, TanStack React Query for state management, and Tailwind CSS with shadcn/ui for styling. Framer Motion handles animations. It's a Vite-based PWA with a custom i18n system supporting English, Portuguese, and Spanish, using a blue-based professional color scheme.

### Backend
The backend is a Node.js Express application written in TypeScript (ESM). It manages claim sessions, anti-fraud tokens, blockchain minting, and custodial wallet management. RESTful endpoints are defined with Zod schema validation.

### Data Storage
PostgreSQL is the primary database, managed via Drizzle ORM. The schema includes tables for Users (admins), Projects, Locations, Drops, ClaimSessions, Mints, WalletlessUsers, WalletlessKeys, PricingPlans, ActivityLogs, PlatformSettings, and Notifications.

### Authentication & Authorization
Admin users utilize cookie-based session authentication with PostgreSQL-backed session storage. Admin passwords are hashed using scrypt. Claim sessions employ cryptographically hashed tokens for one-time NFT minting. The walletless flow involves encrypted custodial keys and email verification.

### Blockchain Integration
The platform exclusively uses the **Stellar blockchain** for NFT minting, leveraging `stellar-sdk` for Horizon API interaction and `manageData` operations for on-chain NFT metadata storage. It supports server-side keypair generation and automatic funding for the Stellar testnet.

### Custodial Wallet System
For email-based minting, the system generates and encrypts Stellar keypairs, storing them in the database. The server mints NFTs on the user's behalf using the custodial wallet's public address, requiring no crypto wallet from the end user.

### PWA and Embed Features
The application functions as a PWA with manifest and service worker. It offers two embed options: a direct iFrame (`/embed/:locationId`) and a script widget (`widget.js`).

### Core Features
- **Public Claim Pages**: `/claim/:locationId` and `/embed/:locationId` for visitors.
- **NFT Gallery**: `/gallery/:locationId` to display minted NFTs.
- **User NFT Lookup**: `/my-nfts` allows users to find their NFTs by email.
- **Admin Dashboard**: Comprehensive `/admin/dashboard` with analytics charts, project/location/drop management, and Reset Mints button (with confirmation guard).
- **Admin Login**: `/admin/login` page includes a back-to-home button.
- **Email Service**: For verification codes and mint confirmations via Resend.
- **Landing Page**: Pricing section with 3 tiers (Starter R$599/event, Professional R$1.497/month, Enterprise R$4.997/month), live platform stats, team section, and access code entry via `/access` page.
- **Demo Locations**: 4 pre-seeded locations with access codes — Paris (PARIS2026), Rio de Janeiro (RIO2026), Curitiba (CURITIBA2026), Foz do Iguaçu (FOZ2026). Location images served from `client/public/images/`.
- **Full i18n**: All user-facing text translated (EN/PT/ES) with automatic language detection via `navigator.language` (pt→PT, es→ES, else EN). Pricing plan names, descriptions, and features are fully localized.

### Security Features
- Helmet middleware for HTTP security headers.
- Session cookies with `httpOnly`, `secure` (production), and `sameSite: 'lax'`.
- Admin route authentication middleware (`requireAuth`).
- Login rate limiting.
- Production secrets enforcement.
- Sanitized error responses in production.
- Cryptographically secure verification tokens.
- Mint uniqueness enforced per email per drop.
- In-memory rate limiting on `/api/walletless/start`.

## External Dependencies

### Database
- PostgreSQL
- Drizzle ORM

### Blockchain SDKs
- `stellar-sdk`

### UI Component Libraries
- shadcn/ui
- Lucide React
- Embla Carousel
- Recharts

### Security
- `helmet`

### Email Service
- Resend

### Development Tools
- Vite
- ESBuild
- TypeScript

## Roadmap

### Current State (v1.0)
Fully functional commemorative NFT minting on Stellar classic. QR code claim flow, email-based custodial wallets, admin dashboard with analytics, i18n (EN/PT/ES) with auto-detection, PWA, embeddable widget, access codes, 4 demo locations, security hardened (Helmet, session protection, rate limiting, auth middleware, secrets enforcement, sanitized errors, secure tokens). Pricing fully translated.

### Short-term (v1.1)
Enhanced analytics, multi-image drops, social sharing, webhooks, branded email templates.

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