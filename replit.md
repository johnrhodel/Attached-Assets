# Mintoria - Commemorative NFT Minting Platform

## Overview
Mintoria is a plug-and-play platform for minting commemorative NFTs for visitors at tourist locations and events. It enables quick NFT claims via QR code on mobile devices and exclusively uses the Stellar blockchain for its efficiency. The platform includes an admin interface for creating monthly "drops" across various locations, supports internationalization (EN/PT/ES) with automatic browser language detection, and offers email-based custodial minting without requiring crypto wallets. Key features include embeddable widget integration, PWA functionality, and social sharing (Twitter/X + Instagram). The project is evolving from a single-admin tool to a multi-tenant platform with organizer self-registration and freemium plans. Future plans include Soroban smart contracts, an NFT marketplace, and AI-powered NFT generation.

## User Preferences
Preferred communication style: Simple, everyday language. User speaks Portuguese.

## System Architecture
Mintoria utilizes a client-server architecture. The frontend is a React application, and the backend is a Node.js Express server. Data is stored in PostgreSQL, and blockchain interactions are exclusively handled with Stellar (testnet).

### Frontend
The UI is built with React 18, TypeScript, and Tailwind CSS, utilizing `shadcn/ui` components, Wouter for routing, and TanStack React Query for state management. Framer Motion handles animations. The application supports PWA functionality and internationalization for English, Portuguese, and Spanish with automatic browser language detection and a professional blue-based color scheme.

### Backend
The backend is a Node.js Express application in TypeScript (ESM), providing RESTful APIs for claim sessions, anti-fraud measures, and blockchain interactions. Zod is used for validation, and Helmet provides security headers. Authentication uses cookie-based sessions, and passwords are scrypt-hashed.

### Data Management
PostgreSQL, managed by Drizzle ORM, is the primary database, storing all application data including user, project, location, drop, mint, and custodial wallet records.

### Blockchain Interaction
Mintoria integrates exclusively with the Stellar blockchain via `stellar-sdk` and the Horizon API (testnet only). NFTs are minted by storing metadata on-chain using `manageData` operations. The platform uses server-side Stellar keypair generation only. Custodial wallets are encrypted with AES-256-CBC.

### Core Features
- **Public Claim Pages**: `/claim/:locationId` and `/embed/:locationId` for visitor NFT claims.
- **NFT Gallery**: `/gallery/:locationId` displays minted NFTs for a location.
- **User NFT Lookup**: `/my-nfts` allows users to find their NFTs by email.
- **Admin Dashboard**: For project, location, and drop management, analytics, and system health.
- **Organizer Dashboard**: Dedicated layout for organizers with stat cards, plan usage, and mints overview.
- **Email Service**: For sending verification codes and mint confirmations.
- **Internationalization (i18n)**: Full support for English, Portuguese, and Spanish with automatic browser language detection.
- **Custodial Wallet System**: Generates and encrypts Stellar keypairs for server-side minting without user crypto wallets.
- **PWA & Embed**: PWA with manifest/service worker, iFrame embed, and script widget.
- **Social Sharing**: After minting, visitors can share their NFT to Twitter/X, Instagram, or download the NFT image.

### Security Features
- Helmet middleware for HTTP security headers.
- Session cookies with `httpOnly`, `secure`, and `sameSite: 'lax'`.
- Admin route authentication middleware.
- Login rate limiting, production secrets enforcement, and sanitized error responses.
- Cryptographically secure verification tokens.

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