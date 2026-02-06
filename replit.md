# Mintoria - Commemorative NFT Minting Platform

## Overview

Mintoria is a plug-and-play platform for minting commemorative NFTs when visitors arrive at tourist locations or events. Visitors claim NFTs quickly via QR code on mobile devices. The platform supports multiple blockchain ecosystems (EVM, Solana, Stellar) and provides admin capabilities for creating monthly "drops" at various locations.

The application supports internationalization with English, Spanish, and Portuguese languages. It offers both wallet-based and walletless (email-based custodial) minting flows, plus embeddable widget integration for third-party sites.

## User Preferences

Preferred communication style: Simple, everyday language. User speaks Portuguese.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for smooth transitions
- **Build Tool**: Vite with hot module replacement
- **Internationalization**: Custom i18n system with React Context
- **Color Scheme**: Blue-based professional palette (primary: blue 221 83%)

The frontend follows a page-based structure under `client/src/pages/` with reusable components in `client/src/components/`. Custom hooks in `client/src/hooks/` encapsulate data fetching and authentication logic.

### Internationalization (i18n)
The app supports three languages:
- **English** (en) - Default
- **Portuguese** (pt) - Português
- **Spanish** (es) - Español

Translation files are in `client/src/lib/i18n/translations.ts`. The `LanguageSelector` component (globe icon) allows users to switch languages, with preference saved to localStorage. The language is auto-detected from browser settings on first visit.

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **Session Management**: Express-session with MemoryStore (development) or PostgreSQL store (production)
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schema validation

The server handles claim session management, anti-fraud token generation, and partial transaction signing for blockchain interactions.

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` defines all tables
- **Migrations**: Managed via `drizzle-kit push` command

Key entities: Users (admins), Projects, Locations, Drops, ClaimSessions, Mints, WalletlessUsers, and WalletlessKeys.

### Authentication & Authorization
- Cookie-based session authentication for admin users
- Default admin credentials: admin@memories.xyz / admin (auto-created in dev mode)
- Claim sessions use cryptographically hashed tokens for one-time NFT minting
- Walletless flow uses encrypted custodial keys (AES-256-CBC) with email verification codes

### Blockchain Integration
- **EVM**: Planned support for Ethereum, Polygon, Arbitrum, Base via ERC-1155 contracts with EIP-712 signature permits
- **Solana**: Metaplex Umi integration for minting assets with partial server-side signing
- **Stellar**: Soroban smart contracts with Freighter wallet integration

### Embed Integration
Two integration modes for third-party sites:
1. **iFrame embed**: Direct embedding via `/embed/:locationId` route
2. **Script widget**: `widget.js` injects a modal iframe on external pages. Use `window.Mintoria.open()` to trigger.

### Key Pages
- `/` - Landing page with features and CTA
- `/claim/:locationId` - Visitor claim page (public)
- `/embed/:locationId` - Embeddable claim widget
- `/admin/login` - Admin login
- `/admin/dashboard` - Admin dashboard
- `/admin/projects` - Project and location management
- `/admin/drops` - Drop creation and publishing

## External Dependencies

### Database
- PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database operations

### Blockchain SDKs
- `@solana/web3.js` for Solana devnet interactions
- EVM libraries (viem/ethers) planned for contract interactions
- Stellar SDK planned for Soroban contract deployment

### UI Component Libraries
- Full shadcn/ui component set (Radix UI primitives)
- Lucide React for icons
- Embla Carousel for image carousels
- Recharts for admin analytics

### Development Tools
- Vite dev server with Replit-specific plugins
- ESBuild for production server bundling
- TypeScript for full-stack type safety
