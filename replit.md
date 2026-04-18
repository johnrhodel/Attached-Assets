# Mintoria - Commemorative NFT Minting Platform

## Overview
Mintoria is a multi-tenant SaaS platform enabling commemorative NFT minting at tourist locations and events using the Solana blockchain (devnet). Visitors claim NFTs by scanning QR codes and entering their email, eliminating the need for a crypto wallet. The platform supports self-service organizer registration with a freemium model (Free/Starter/Professional/Enterprise), plan-based limits on mints and locations, comprehensive admin oversight, full internationalization (EN/PT/ES), PWA functionality, and social sharing capabilities. Its business vision is to provide a user-friendly and accessible way for event organizers and tourist attractions to offer unique digital souvenirs, tapping into the growing market of experiential tourism and digital collectibles.

## User Preferences
Preferred communication style: Simple, everyday language. User speaks Portuguese.

## System Architecture
Mintoria employs a client-server architecture. The frontend is built with React, the backend with Node.js/Express, and data is stored in a PostgreSQL database. Solana devnet is used for blockchain interactions. EVM and Stellar chain routes are currently disabled.

### Multi-Tenant Model
The platform supports two roles: Admin, with full platform control, and Organizer, who self-registers and manages their own projects, locations, and drops within plan-based limits. Data is strictly isolated per organizer. Access control is enforced via middleware, checking for authentication, role, and resource ownership.

### Frontend
Developed with React 18, TypeScript, Tailwind CSS, and `shadcn/ui` components, featuring Wouter for routing, TanStack React Query for state management, and Framer Motion for animations. It includes PWA support, i18n (EN/PT/ES with auto-detection), and a professional blue-based color scheme.

### Backend
A Node.js Express application written in TypeScript (ESM) provides RESTful APIs for claim sessions, anti-fraud measures, blockchain interactions, multi-tenant CRUD operations, and organizer management. Zod handles validation, Helmet ensures security headers, and cookie-based sessions are used with scrypt-hashed passwords.

### Database Schema
PostgreSQL, managed by Drizzle ORM, stores data across tables including `users`, `projects`, `locations`, `drops`, `mints`, `claim_sessions`, `walletless_users`, `walletless_keys`, `activity_logs`, `platform_settings`, `notifications`, and `pricing_plans`.

### Blockchain Interaction
Utilizes Solana (devnet) via `@solana/web3.js` for NFT minting with Metaplex Core (`mpl-core`). A persistent server keypair (from `SOLANA_SERVER_SECRET_KEY`) is used, failing fast in production if invalid. Custodial wallets employ AES-256-CBC encryption. Dynamic NFT metadata is served, using `APP_BASE_URL` to ensure stable on-chain URIs.

### Core Features
- **Public Claim Pages**: For visitor NFT claims with access code verification.
- **NFT Gallery**: Displays minted NFTs per location.
- **User NFT Lookup**: Allows users to find their NFTs by email.
- **Admin Dashboard**: Manages projects, locations, drops, organizers, and provides analytics and system health monitoring.
- **Organizer Dashboard**: Provides organizers with statistics, plan usage, project management, and recent mints, limited to their own data.
- **Self-Service Organizer Registration**: Organizers register with email/password and are assigned the Free plan.
- **Password Recovery**: Email-based password reset using 6-digit verification codes.
- **Email Service**: Uses Resend for verification codes and mint confirmations.
- **Internationalization (i18n)**: Full EN/PT/ES support.
- **Custodial Wallet System**: Encrypted Solana keypairs for server-side minting.
- **PWA & Embed**: PWA functionality, iFrame embed, and script widget with a conservative caching strategy.
- **Social Sharing**: Enables sharing minted NFTs on platforms like Twitter/X and Instagram.
- **Plan-Based Limits**: Server-side enforcement of mints per drop and locations per plan.
- **QR Code with Embedded Access Code**: Generated QR codes can include access codes for seamless claiming.
- **Admin Tools**: Includes admin-only features for resetting mints and clearing activity logs.

### Key Flows
- **Visitor Mint Flow**: Involves QR scan, access code verification, email entry, code validation, plan limit check, NFT minting to a custodial wallet, and confirmation.
- **Organizer Registration Flow**: Self-registration, auto-assignment to Free plan, and redirection to their dashboard.
- **Password Recovery Flow**: User initiates password reset, receives a code, sets a new password, and logs in.
- **Admin Organizer Management Flow**: Admin views, filters, and manages organizer accounts, including activation/deactivation.

### Security Features
Includes Helmet middleware, secure session cookies, granular access control middleware (`requireAuth`, `requireAdmin`, etc.), rate limiting for authentication actions, cryptographic token generation, production secret enforcement, and data isolation.

## External Dependencies

### Database
- PostgreSQL

### Blockchain
- `@solana/web3.js`

### UI/UX
- `shadcn/ui`
- `Lucide React`
- `react-icons`
- `Embla Carousel`
- `Recharts`
- `Framer Motion`

### Security
- `helmet`

### Email Service
- Resend