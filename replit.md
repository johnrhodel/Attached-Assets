# Mintoria - Commemorative NFT Minting Platform

## Overview

Mintoria is a plug-and-play platform for minting commemorative NFTs when visitors arrive at tourist locations or events. Visitors claim NFTs quickly via QR code on mobile devices. The platform supports multiple blockchain ecosystems (EVM, Solana, Stellar) and provides admin capabilities for creating monthly "drops" at various locations.

The application supports internationalization with English, Spanish, and Portuguese languages. It offers both wallet-based and walletless (email-based custodial) minting flows, plus embeddable widget integration for third-party sites. It is a PWA that can be installed on mobile devices.

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
- **PWA**: Installable via manifest.json + service worker (sw.js)

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

The server handles claim session management, anti-fraud token generation, real blockchain minting, and custodial wallet management.

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

### Blockchain Integration (LIVE)
All three blockchain integrations are implemented with real chain interactions:

- **Solana** (`server/services/solana.ts`): 
  - Metaplex Umi + mpl-core for NFT minting
  - Server keypair auto-generated or loaded from SOLANA_SERVER_SECRET_KEY
  - Auto-airdrop on devnet for server funding
  - Uses @solana/web3.js + @metaplex-foundation packages
  
- **EVM** (`server/services/evm.ts`):
  - ethers.js v6 for wallet management and contract interaction
  - EIP-712 typed data signing for mint permits
  - Supports Sepolia, Polygon Amoy, Arbitrum, Base testnets
  - Server wallet loaded from EVM_SERVER_PRIVATE_KEY or auto-generated
  - ERC-1155 contract integration when EVM_CONTRACT_ADDRESS is set
  
- **Stellar** (`server/services/stellar.ts`):
  - stellar-sdk for Horizon API and transaction building
  - manageData operations for on-chain NFT metadata storage
  - Auto-funding via Friendbot on testnet
  - Server keypair loaded from STELLAR_SERVER_SECRET_KEY or auto-generated

### Custodial Wallet System
When users choose the email/walletless flow:
1. Real keypairs are generated for each chain (Solana/EVM/Stellar)
2. Private keys are encrypted with AES-256-CBC and stored in `walletless_keys` table
3. Public addresses are visible and can receive NFTs
4. Server mints NFTs to the custodial wallet on the user's behalf
5. Wallet generation uses: `server/services/wallet.ts`

### PWA (Progressive Web App)
- `client/public/manifest.json` - App manifest for install prompt
- `client/public/sw.js` - Service worker for offline caching
- Apple and Android meta tags in `client/index.html`
- Network-first caching strategy with offline fallback

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

### API Endpoints
- `GET /api/blockchain/status` - Returns server wallet addresses, balances, and chain info for all three blockchains

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Express session secret

### Blockchain (Optional - auto-generated if not set)
- `SOLANA_SERVER_SECRET_KEY` - Base58-encoded Solana server keypair secret
- `SOLANA_NETWORK` - "devnet" (default) or "mainnet-beta"
- `SOLANA_RPC_URL` - Custom RPC endpoint
- `EVM_SERVER_PRIVATE_KEY` - Hex-encoded Ethereum private key
- `EVM_RPC_URL` - RPC endpoint (default: Sepolia drpc.org)
- `EVM_CHAIN_ID` - Chain ID (default: 11155111 Sepolia)
- `EVM_CONTRACT_ADDRESS` - Deployed ERC-1155 contract address
- `STELLAR_SERVER_SECRET_KEY` - Stellar secret key
- `STELLAR_NETWORK` - "testnet" (default) or "mainnet"
- `WALLET_ENCRYPTION_SECRET` - Key for encrypting custodial wallet secrets

## External Dependencies

### Database
- PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database operations

### Blockchain SDKs
- `@solana/web3.js` for Solana interactions
- `@metaplex-foundation/umi` + `@metaplex-foundation/mpl-core` for Solana NFT minting
- `ethers` (v6) for EVM wallet management and contract interaction
- `stellar-sdk` for Stellar/Soroban interactions
- `bs58` for Base58 encoding/decoding
- `viem` for additional EVM utilities

### UI Component Libraries
- Full shadcn/ui component set (Radix UI primitives)
- Lucide React for icons
- Embla Carousel for image carousels
- Recharts for admin analytics

### Development Tools
- Vite dev server with Replit-specific plugins
- ESBuild for production server bundling
- TypeScript for full-stack type safety
