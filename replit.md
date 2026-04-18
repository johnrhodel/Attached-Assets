# Mintoria - Commemorative NFT Minting Platform

## Overview
Mintoria is a multi-tenant SaaS platform enabling the minting of commemorative NFTs at tourist locations and events. Built on the Solana blockchain, it allows visitors to claim NFTs by scanning QR codes and entering their email, eliminating the need for a crypto wallet. The platform supports self-service organizer registration with a freemium model (Free/Starter/Professional/Enterprise), plan-based limits on mints and locations, and comprehensive admin oversight. It features full internationalization (EN/PT/ES), PWA functionality, and social sharing capabilities. The vision is to offer a seamless, accessible way for event organizers and tourist attractions to leverage NFTs for visitor engagement and memorabilia.

## User Preferences
Preferred communication style: Simple, everyday language. User speaks Portuguese.

## System Architecture
Mintoria utilizes a client-server architecture, comprising a React frontend, a Node.js/Express backend, a PostgreSQL database, and integrates with the Solana blockchain (devnet). EVM and Stellar chain routes are disabled.

### Multi-Tenant Model
The platform supports two primary roles: **Admin** with full system control, and **Organizer** who manages their own projects, locations, and drops within plan-based limits. Data is isolated per organizer. Access control is enforced via a middleware chain including `requireAuth`, `requireAdmin`, `requireOrganizerOrAdmin`, `requireProjectOwnership`, and `requireDropOwnership`.

### Frontend
Developed with React 18, TypeScript, Tailwind CSS, and `shadcn/ui` components. It uses Wouter for routing, TanStack React Query for state management, and Framer Motion for animations. Key features include PWA support, i18n (EN/PT/ES with auto-detection), and a professional blue-based color scheme.

### Backend
Built with Node.js Express in TypeScript (ESM), providing RESTful APIs for claim sessions, anti-fraud, blockchain interactions, multi-tenant CRUD, and organizer management. Zod is used for validation, Helmet for security headers, and cookie-based sessions with scrypt-hashed passwords.

### Database Schema
PostgreSQL is managed by Drizzle ORM. Key tables include `users`, `projects`, `locations`, `drops`, `mints`, `claim_sessions`, `walletless_users`, `walletless_keys`, `activity_logs`, `platform_settings`, `notifications`, and `pricing_plans`.

### Blockchain Interaction
Interacts with Solana (devnet) via `@solana/web3.js`. NFTs are minted using Metaplex Core (`mpl-core`). A persistent server keypair, loaded from `SOLANA_SERVER_SECRET_KEY`, is used for custodial wallet operations. Dynamic NFT metadata is served via `/api/metadata/drop/:dropId`, ensuring Metaplex-compatible JSON for on-chain URIs. The system performs non-blocking airdrops for server funding and handles `INSUFFICIENT_SOL` errors gracefully. Custodial wallets use AES-256-CBC encryption.

### Core Features
- **Public Claim Pages**: `/claim/:locationId` and `/embed/:locationId` for NFT claims with optional access code verification.
- **NFT Gallery**: Displays minted NFTs per location at `/gallery/:locationId`.
- **User NFT Lookup**: `/my-nfts` allows users to find their NFTs by email.
- **Admin Dashboard**: Comprehensive management of projects, locations, drops, organizers, analytics, and Solana health monitoring. Includes organizer activation/deactivation and mint reset functionality.
- **Organizer Dashboard**: Provides organizers with project, location, and drop management, mint statistics, and plan usage insights. Organizers only access their own data.
- **Organizer Registration**: Self-service registration at `/register` assigns a default "Free" plan and redirects to the organizer dashboard.
- **Login & Password Recovery**: Standard login at `/admin/login` and an email-based password recovery flow using 6-digit verification codes.
- **Email Service**: Utilizes Resend for verification codes and mint confirmations.
- **Internationalization (i18n)**: Full EN/PT/ES support with automatic browser language detection.
- **PWA & Embed**: Progressive Web App functionality, iFrame embed, and script widget with a service worker for caching static assets.
- **Social Sharing**: Options to share NFTs on Twitter/X, Instagram, and download the NFT image.
- **Plan-Based Limits**: Server-side enforcement of mints per drop and locations per plan, with structured error codes (`PLAN_MINT_LIMIT`, `PLAN_LOCATION_LIMIT`).
- **QR Code with Embedded Access Code**: `/api/qr/:locationId` generates QR codes that can pre-fill access codes on claim pages.
- **Security Features**: Helmet middleware, secure session cookies, granular access control (`requireAuth`, `requireAdmin`, etc.), rate limiting for authentication flows, production secrets enforcement, and data isolation.

### Business Model
A freemium model with "Free", "Starter", "Professional", and "Enterprise" plans, each offering different mint limits, location capacities, and features. Plans are sorted by `sortOrder` for consistent display.

## External Dependencies

### Database
- PostgreSQL
- Drizzle ORM

### Blockchain
- `@solana/web3.js`

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