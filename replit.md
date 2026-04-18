# Mintoria - Commemorative NFT Minting Platform

## Overview
Mintoria is a multi-tenant SaaS platform enabling the minting of commemorative NFTs at tourist locations and events, utilizing the Solana blockchain (devnet). It allows visitors to claim NFTs by scanning QR codes and entering their email, eliminating the need for a crypto wallet. The platform supports self-service organizer registration with a freemium model (Free/Starter/Professional/Enterprise), plan-based mint and location limits, and comprehensive admin oversight. Key features include full internationalization (EN/PT/ES), PWA functionality, and social sharing.

## User Preferences
Preferred communication style: Simple, everyday language. User speaks Portuguese.

## System Architecture
Mintoria employs a client-server architecture. The frontend is built with React, the backend uses Node.js/Express, data is stored in PostgreSQL, and blockchain interactions are with Solana (devnet).

### Multi-Tenant Model
The platform supports two roles: Admin, with full control over all platform entities, and Organizer, who manages their own projects, locations, and drops within plan-based limits. Data is isolated per organizer, and access control is enforced via middleware.

### Frontend
Developed with React 18, TypeScript, Tailwind CSS, and `shadcn/ui` components. It utilizes Wouter for routing, TanStack React Query for state management, and Framer Motion for animations. It features PWA capabilities, i18n support (EN/PT/ES), and a professional blue-based color scheme.

### Backend
A Node.js Express application written in TypeScript (ESM). It provides RESTful APIs for claim sessions, anti-fraud measures, blockchain interactions, multi-tenant CRUD operations, and organizer management. Validation is handled by Zod, security headers by Helmet, and authentication uses cookie-based sessions with scrypt-hashed passwords.

### Database Schema
PostgreSQL, managed by Drizzle ORM, stores data across tables including `users`, `projects`, `locations`, `drops`, `mints`, `claim_sessions`, `walletless_users`, `walletless_keys`, `activity_logs`, `platform_settings`, `notifications`, and `pricing_plans`.

### Blockchain Interaction
Interactions are exclusively with Solana (devnet) via `@solana/web3.js`. NFTs are minted using Metaplex Core (`mpl-core`). A persistent server keypair is used for transactions, with robust error handling for insufficient funds or missing secret keys in production. Dynamic NFT metadata is generated and served from the backend, ensuring stable on-chain URIs.

### Core Features
- **Public Claim Pages**: For visitors to claim NFTs via QR code or direct links.
- **NFT Gallery & Lookup**: Allows users to view minted NFTs and find their own via email.
- **Admin Dashboard**: Comprehensive management of organizers, projects, locations, drops, and platform analytics. Includes Solana health monitoring and mint reset capabilities.
- **Organizer Dashboard**: Provides organizers with tools to manage their projects, locations, drops, and monitor mint activity within their allocated plan limits.
- **User Authentication**: Secure self-registration for organizers, login, and password recovery workflows.
- **Email Service**: For verification codes and mint confirmations.
- **Internationalization (i18n)**: Full support for English, Portuguese, and Spanish.
- **Custodial Wallet System**: Solana keypairs are encrypted for server-side minting.
- **PWA & Embed**: Progressive Web App functionality and embeddable widgets for seamless integration.
- **Social Sharing**: Options to share minted NFTs on platforms like Twitter/X and Instagram.
- **Plan-Based Limits**: Server-side enforcement of mint and location limits based on the organizer's subscription plan.
- **QR Code Generation**: Dynamic QR codes with embedded access codes for streamlined NFT claiming.

### Security Features
Implementation of Helmet middleware, secure session cookies, a robust middleware chain for access control, rate limiting for authentication endpoints, production secrets enforcement, sanitized error responses, and cryptographically secure token generation. Data isolation ensures organizers only access their own data.

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