# Mintoria - Commemorative NFT Minting Platform

## Overview

Mintoria is a plug-and-play platform for minting commemorative NFTs on the Stellar blockchain, designed for tourist locations and events. It enables quick NFT claims via QR code on mobile devices, offering an email-based custodial minting process that doesn't require users to have a crypto wallet. The platform includes an admin interface for creating monthly "drops" across various locations and supports internationalization (English, Spanish, Portuguese). Key features include an embeddable widget, PWA functionality, and robust security measures.

The project's vision is to leverage Stellar's efficiency for low-cost, fast, and energy-efficient NFT minting, aiming to become a leading solution in the tourism and event industries. Future plans involve migrating to Soroban smart contracts, developing an NFT marketplace, and implementing advanced features like MPC custody and AI-powered NFT generation.

## User Preferences

Preferred communication style: Simple, everyday language. User speaks Portuguese.

## System Architecture

The Mintoria platform is built with a clear separation between frontend and backend, integrating with the Stellar blockchain and external services.

### UI/UX Decisions
The frontend is a Vite-based Progressive Web App (PWA) built with React 18 and TypeScript. It uses Tailwind CSS and shadcn/ui for a professional, blue-based aesthetic. Animations are handled by Framer Motion. The application supports internationalization (EN/PT/ES) with automatic language detection, ensuring a localized experience.

### Technical Implementations
- **Frontend**: React 18, TypeScript, Wouter for routing, TanStack Query for state management.
- **Backend**: Node.js and Express in TypeScript (ESM) manage API endpoints, claim sessions, anti-fraud measures, and custodial wallet operations. Zod is used for schema validation.
- **Data Storage**: PostgreSQL, accessed via Drizzle ORM, stores all application data including users, projects, locations, drops, and mint records.
- **Authentication**: Admin users use cookie-based session authentication. Claim sessions and walletless flows employ cryptographically hashed tokens and email verification. Login rate limiting is implemented.
- **Blockchain Integration**: Exclusively uses the Stellar blockchain for NFT minting, leveraging `stellar-sdk` for Horizon API interaction. NFT metadata is stored on-chain using `manageData` operations.
- **Custodial Wallet System**: Generates and encrypts Stellar keypairs for users who claim NFTs via email, enabling server-side minting without requiring a user-owned crypto wallet. Keypairs are encrypted using AES-256-CBC.
- **Mint Reliability**: Includes supply checks to prevent over-minting, logging of orphaned transactions for recovery, and automatic cleanup of expired claim sessions.
- **Embed Features**: Offers an iFrame embed and a script widget (`widget.js`) for integration into external websites.

### Feature Specifications
- **Public Claim Pages**: Dedicated pages for visitors to claim NFTs at specific locations (`/claim/:locationId`, `/embed/:locationId`).
- **NFT Gallery**: Displays minted NFTs for a given location (`/gallery/:locationId`).
- **User NFT Lookup**: Allows users to find their minted NFTs by email (`/my-nfts`).
- **Admin Dashboard**: Comprehensive dashboard for managing projects, locations, and NFT drops, including analytics and a "Reset Mints" feature.
- **Email Service**: Handles sending verification codes and mint confirmations.
- **Landing Page**: Includes pricing tiers, live platform statistics, and an access code entry page (`/access`).
- **Social Sharing**: Enables sharing minted NFTs on Twitter/X and Instagram, and direct image download.
- **NFT Metadata API**: Provides on-chain metadata for NFTs (`/api/metadata/:locationSlug/:dropSlug`).

## External Dependencies

-   **Database**: PostgreSQL
-   **ORM**: Drizzle ORM
-   **Blockchain SDK**: `stellar-sdk`
-   **UI Libraries**: shadcn/ui, Lucide React, react-icons, Embla Carousel, Recharts
-   **Security Middleware**: `helmet`
-   **Email Service**: Resend