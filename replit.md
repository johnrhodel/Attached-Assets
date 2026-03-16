# Mintoria - Commemorative NFT Minting Platform

## Overview
Mintoria is a plug-and-play platform designed for minting commemorative NFTs for visitors at tourist locations or events. It facilitates quick NFT claims via QR code on mobile devices and exclusively utilizes the Stellar blockchain for its low-cost, fast, and energy-efficient transactions. The platform includes an admin interface for creating monthly "drops" across various locations, supports internationalization (English, Spanish, Portuguese), and offers email-based custodial minting, eliminating the need for crypto wallets. Key features include embeddable widget integration and PWA functionality. The project aims to become a leading NFT minting solution for the tourism and event industries, with future plans for Soroban smart contracts, an NFT marketplace, and advanced features like AI-powered NFT generation.

## User Preferences
Preferred communication style: Simple, everyday language. User speaks Portuguese.

## System Architecture

### High-Level Architecture
Mintoria uses a client-server architecture. The frontend is a React application, and the backend is a Node.js Express server. Data is persisted in PostgreSQL, and blockchain interactions are handled exclusively with Stellar.

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
The user interface is built with React 18, TypeScript, and Tailwind CSS, leveraging `shadcn/ui` for components. Routing is handled by Wouter, and `TanStack React Query` manages global state. Animations are implemented with Framer Motion. The application functions as a Progressive Web App (PWA) and supports internationalization for English, Portuguese, and Spanish, with a professional blue-based color scheme.

### Backend
The backend is a Node.js Express application written in TypeScript (ESM). It provides RESTful APIs for managing claim sessions, anti-fraud measures, blockchain interactions, and custodial wallets. Zod is used for schema validation, and Helmet provides security headers.

### Data Management
PostgreSQL serves as the primary database, managed through Drizzle ORM. It stores user data, project details, location information, drop configurations, claim sessions, mint records, walletless user data, pricing plans, activity logs, and notifications.

### Authentication and Security
Admin authentication uses cookie-based sessions with PostgreSQL storage. Passwords are hashed using scrypt. Claim sessions use cryptographically hashed tokens. The walletless flow involves AES-256-CBC encrypted custodial keys and email verification. Security features include Helmet middleware, rate limiting for login attempts, and enforcement of production secrets.

### Blockchain Interaction
Mintoria exclusively integrates with the Stellar blockchain using `stellar-sdk` to interact with the Horizon API. NFTs are minted by storing metadata on-chain via `manageData` operations. The platform supports server-side keypair generation and custodial wallet management for email-based minting, removing the need for users to have a crypto wallet.

### Core Features
- **Public Claim Pages**: `/claim/:locationId` and `/embed/:locationId` for visitor NFT claims.
- **NFT Gallery**: `/gallery/:locationId` to display minted NFTs.
- **User NFT Lookup**: `/my-nfts` allows users to find their NFTs by email.
- **Admin Dashboard**: `/admin/dashboard` provides analytics, project/location/drop management, and a "Reset Mints" function.
- **Email Service**: For sending verification codes and mint confirmations.
- **Landing Page**: Features pricing tiers (Starter, Professional, Enterprise), live platform stats, and an access code entry page (`/access`).
- **Internationalization (i18n)**: Full support for English, Portuguese, and Spanish, with automatic language detection. Pricing plan details are localized.
- **NFT Metadata API**: `/api/metadata/:locationSlug/:dropSlug` serves on-chain NFT metadata.
- **Custodial Wallet System**: Generates and encrypts Stellar keypairs for users, enabling server-side minting without direct user crypto wallet interaction.
- **Mint Reliability**: Includes supply checks, orphaned transaction handling, and automatic cleanup of expired claim sessions.
- **PWA & Embed**: Supports PWA features and provides options for iframe (`/embed/:locationId`) and script widget (`widget.js`) embedding.

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