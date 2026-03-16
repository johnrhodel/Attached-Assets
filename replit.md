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
Mintoria integrates exclusively with the Stellar blockchain via `stellar-sdk` and the Horizon API. NFTs are minted by storing metadata on-chain using `manageData` operations. The platform supports server-side keypair generation and custodial wallet management for email-based minting.

### Core Features
- **Public Claim Pages**: For visitor NFT claims and embedded widgets.
- **NFT Gallery**: Displays minted NFTs.
- **User NFT Lookup**: Allows users to find their NFTs by email.
- **Admin Dashboard**: Provides analytics, project/location/drop management, and a "Reset Mints" function.
- **Email Service**: For sending verification codes and mint confirmations.
- **Landing Page**: Features pricing tiers, live stats, and an access code entry.
- **Internationalization (i18n)**: Full support for English, Portuguese, and Spanish.
- **NFT Metadata API**: Serves on-chain NFT metadata.
- **Custodial Wallet System**: Generates and encrypts Stellar keypairs for server-side minting.
- **Mint Reliability**: Includes supply checks, orphaned transaction handling, and session cleanup.
- **PWA & Embed**: Supports PWA features and provides iframe and script widget embedding.

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