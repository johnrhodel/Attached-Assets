# Mintoria — Technical Architecture & Product Overview

> A multi-tenant SaaS platform for minting commemorative NFTs at tourist locations and events, built on the Stellar blockchain. From single-admin tool to self-service platform with freemium onboarding.

---

## 1. Product Vision

Mintoria turns real-world experiences into digital collectibles. When a visitor arrives at a tourist location, museum, park, or event, they scan a QR code with their phone, enter their email, and receive a commemorative NFT — no crypto wallet, no app download, no blockchain knowledge required.

The platform is designed as a **self-service SaaS for tourism operators and event organizers**. Any organizer can register for free, create events, and start minting NFTs for their visitors within minutes. As they grow, they upgrade to paid plans for more capacity and features.

### Key Differentiators
- **Zero friction for visitors**: Email-based custodial wallets — no MetaMask, no seed phrases
- **Zero barrier for organizers**: Free plan with 50 mints/event — start without a credit card
- **Self-service onboarding**: Organizers register, create events, and go live in minutes
- **Built on Stellar**: Sub-second finality, near-zero fees (~0.00001 XLM per TX), energy-efficient consensus
- **Multi-language**: Full i18n support (English, Portuguese, Spanish) with automatic language detection
- **PWA + Embeddable**: Works as a standalone mobile app or embedded widget on any website
- **Platform metrics**: Built-in analytics for organizer tracking, conversion rates, and platform health

---

## 2. Multi-Tenant Architecture

Mintoria operates as a multi-tenant platform with two distinct user roles:

```
┌──────────────────────────────────────────────────────────────────┐
│                        PLATFORM ADMIN                            │
│                                                                  │
│   • Full control over all organizers, projects, and drops        │
│   • View platform-wide metrics and analytics                     │
│   • Activate/deactivate organizer accounts                       │
│   • Manage pricing plans and platform settings                   │
│   • Monitor Stellar network health                               │
│   • Export data (CSV) for business intelligence                  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                       ORGANIZERS (Self-Service)                   │
│                                                                  │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│   │ Organizer A  │   │ Organizer B  │   │ Organizer C  │  ...   │
│   │ (Free Plan)  │   │ (Starter)    │   │ (Professional)│        │
│   │              │   │              │   │              │        │
│   │ 1 Project    │   │ 2 Projects   │   │ 5 Projects   │        │
│   │ 1 Location   │   │ 1 Location   │   │ 5 Locations  │        │
│   │ 50 mints/drop│   │ 500 mints/drop│   │ Unlimited    │        │
│   └──────────────┘   └──────────────┘   └──────────────┘        │
│                                                                  │
│   Data Isolation: Each organizer only sees their own resources   │
│   Middleware: requireAuth → requireProjectOwnership              │
│              requireAuth → requireDropOwnership                  │
│              requireAuth → requireOrganizerOrAdmin               │
└──────────────────────────────────────────────────────────────────┘
```

### Access Control
- **Admin** routes: Protected by `requireAdmin` middleware
- **Organizer** routes: Protected by `requireOrganizerOrAdmin` + ownership middleware
- **Public** routes: Claim pages, galleries, and NFT lookup — no auth required
- **Data isolation**: Organizers can only access their own projects, locations, drops, and mints through ownership middleware chain

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         VISITOR DEVICE                           │
│                    (Mobile Browser / PWA)                         │
│                                                                  │
│   QR Scan → Claim Page → Email Verification → NFT Minted!       │
│                         ↓ Share on X / Instagram                 │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            │ HTTPS / REST API
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                       APPLICATION SERVER                         │
│                                                                  │
│   ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│   │  Express.js  │  │  Claim       │  │  Admin Dashboard      │ │
│   │  REST API    │  │  Sessions    │  │  (Organizer Mgmt)     │ │
│   │  + Zod       │  │  (5-min TTL) │  │                       │ │
│   └──────┬───────┘  └──────────────┘  └───────────────────────┘ │
│          │                              ┌───────────────────────┐│
│          │                              │  Organizer Dashboard  ││
│          │                              │  (Self-Service)       ││
│          │                              └───────────────────────┘│
│   ┌──────▼────────────────────────────────────────────────────┐  │
│   │                   SECURITY LAYER                          │  │
│   │  Helmet · Rate Limiting · Session Auth · Token Validation  │  │
│   │  Scrypt Hashing · AES-256 Encryption · Plan Enforcement    │  │
│   │  Data Isolation · Ownership Middleware · Role Guards        │  │
│   └───────────────────────────────────────────────────────────┘  │
│          │                          │                             │
│   ┌──────▼───────────┐    ┌────────▼─────────────────────────┐  │
│   │   PostgreSQL     │    │   Stellar Integration            │  │
│   │                  │    │                                   │  │
│   │   Users (Roles)  │    │   Server Keypair Management       │  │
│   │   Projects       │    │   Custodial Wallet Generation     │  │
│   │   Locations      │    │   NFT Minting (manageData)        │  │
│   │   Drops          │    │   Horizon API Interaction         │  │
│   │   Mints          │    │   Testnet Auto-Funding            │  │
│   │   Custodial Keys │    │                                   │  │
│   │   Pricing Plans  │    │   ┌───────────────────────────┐   │  │
│   │   Activity Logs  │    │   │  Stellar Testnet/Mainnet  │   │  │
│   │                  │    │   │  (Horizon API)            │   │  │
│   └──────────────────┘    │   └───────────────────────────┘   │  │
│                           └───────────────────────────────────┘  │
│          │                                                       │
│   ┌──────▼───────────┐                                           │
│   │   Resend (Email) │                                           │
│   │   Verification   │                                           │
│   │   Confirmations  │                                           │
│   └──────────────────┘                                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. How It Works — Visitor Flow

The complete journey from scanning a QR code to owning an NFT takes under 60 seconds:

```
Step 1: SCAN                Step 2: CLAIM               Step 3: VERIFY
────────────                ─────────────               ──────────────
Visitor scans QR     →      Clicks "Claim Your    →     Enters email
code at location            Memory" button              address
                                    │
                            System creates              System sends
                            anti-fraud session          6-digit code
                            (5-minute expiry)           via email
                                                              │
                                                        Enters code
                                                        in browser

Step 4: PLAN CHECK          Step 5: MINT                Step 6: SHARE
──────────────────          ────────────                ─────────────
System checks          →    Server generates      →     Share on X
organizer's plan            custodial Stellar           Share on Instagram
limits for this drop        wallet for user             Download image
        │                           │                   View on Explorer
If limit reached,           Mints NFT using
returns structured          server keypair              Confirmation email
error code                          │                   sent to visitor
(PLAN_MINT_LIMIT)           Supply check +
                            uniqueness enforced
```

### What happens behind the scenes during minting:

1. **Plan Limit Check**: System verifies the organizer's plan allows more mints for this drop. Free plan: 50 mints/drop. Admin-created drops bypass limits.

2. **Wallet Creation**: Server generates a Stellar keypair, encrypts the secret key (AES-256-CBC), and stores it in the database. The visitor never sees or manages this key.

3. **NFT Recording**: The server builds a Stellar transaction using `manageData` operations to store NFT metadata (title, metadata URI) on-chain, signs it with the server keypair, and submits it to the Stellar network.

4. **Safety Checks**: Before minting, the system verifies: (a) the claim session is valid and not expired, (b) the drop hasn't exceeded its supply limit, (c) the visitor hasn't already minted this drop, (d) the email is verified.

5. **Fault Tolerance**: If the blockchain transaction succeeds but the database update fails, the transaction hash is logged for manual recovery — the visitor still sees a success response.

---

## 5. How It Works — Organizer Flow

### Self-Registration (New)
Any organizer can register for free and start creating events immediately:

```
Step 1: REGISTER            Step 2: LOGIN               Step 3: CREATE
────────────────            ─────────────────           ──────────────
Visit /register      →      Redirected to        →     Create a Project
Enter name, email,          /admin/login                (organization)
password                    Login with credentials            │
        │                   Redirected to               Create a Location
Assigned Free plan          /organizer/dashboard        (physical place)
(50 mints/drop,             See plan usage stats              │
 1 location)                (mints, locations)          Create a Drop
                                                        (NFT collection)

Step 4: DEPLOY              Step 5: MONITOR             Step 6: GROW
──────────────              ───────────────             ──────────────
Publish the drop     →      Watch real-time       →     Hit plan limits?
Generate QR code            mints on dashboard          Upgrade to Starter
Print & place at            See per-drop usage          or Professional
the location                bars and stats
        │                                               Need more locations?
Or embed widget             View recent mints           Upgrade plan for
on your website             and drop overview           more capacity
```

### Admin Organizer Management
Platform admin has full visibility and control over all organizers:

```
Step 1: OVERVIEW             Step 2: FILTER              Step 3: MANAGE
────────────────             ──────────────              ──────────────
View total organizers  →     Filter by plan        →     View organizer
Active count                 (Free/Starter/              detail page
New this month               Professional/Enterprise)                       │
Free→Paid conversion         Search by email/name        See their projects,
Plan distribution            Filter by date              locations, drops,
                                                         and mint counts
                                                               │
                                                         Activate/deactivate
                                                         organizer accounts
```

### Admin Capabilities
- **Organizer Management**: View all organizers, filter by plan/date, activate/deactivate accounts
- **Platform Metrics**: Total organizers, active count, new this month, conversion rate, plan distribution
- **Project Management**: Organize locations into projects (e.g., "Museum Chain 2026")
- **Drop Configuration**: Set title, image, supply limit, month/year, and optional access code
- **QR Code Generation**: Create downloadable QR codes (SVG/PNG) for each location
- **Analytics Dashboard**: Real-time charts showing mints over time and by location
- **User Export**: Download custodial user data as CSV for marketing/CRM integration
- **Reset Mints**: Development tool to reset all mint data (protected with double confirmation)
- **Stellar Health Monitor**: Live status of the Stellar network, server balance, uptime, and transaction volume

---

## 6. Freemium Business Model

### Pricing Tiers

| Plan | Price | Mints/Drop | Locations | Features |
|------|-------|------------|-----------|----------|
| **Free** | R$0 | 50/drop | 1 | QR code, basic dashboard, community support |
| **Starter** | R$599/event | 500/drop | 1 | QR codes, basic analytics, email support |
| **Professional** | R$1,497/month | Unlimited | 5 | Advanced analytics, priority support, custom branding, embeddable widget |
| **Enterprise** | R$4,997/month | Unlimited | Unlimited | White-label, API access, dedicated support, custom integrations, SLA |

### Conversion Funnel

```
┌─────────────────────────────────────────────────────────┐
│                    ACQUISITION                           │
│   Organizer discovers Mintoria → Registers for Free      │
│   Zero barrier: no credit card, no approval needed       │
├─────────────────────────────────────────────────────────┤
│                    ACTIVATION                            │
│   Creates first project → first location → first drop    │
│   Generates QR code → first visitors mint NFTs           │
├─────────────────────────────────────────────────────────┤
│                    RETENTION                             │
│   Dashboard shows mint metrics and engagement            │
│   Visitors share NFTs on social media → organic growth   │
├─────────────────────────────────────────────────────────┤
│                    REVENUE                               │
│   Hits 50-mint limit → prompted to upgrade               │
│   Needs more locations → upgrades plan                   │
│   Structured error codes guide upgrade path              │
├─────────────────────────────────────────────────────────┤
│                    EXPANSION                             │
│   Pro → Enterprise for white-label                       │
│   API access for custom integrations                     │
│   Multi-location chains drive higher tier adoption       │
└─────────────────────────────────────────────────────────┘
```

### Revenue Streams
- **SaaS Subscriptions**: Monthly/per-event pricing tiers
- **Per-Mint Fees**: At enterprise scale, per-mint billing option
- **White-Label Licensing**: Custom-branded deployments for large operators
- **Marketplace Commissions**: Revenue share on secondary NFT sales (v2.0+)

### Competitive Advantage
- **Zero barrier to entry**: Unlike competitors requiring upfront payment or technical setup, Mintoria lets organizers start for free
- **No crypto knowledge needed**: Both organizers and visitors interact through familiar web interfaces
- **Built-in upgrade path**: Plan limits naturally guide organizers from free to paid tiers
- **Platform metrics**: Admin has real-time visibility into conversion rates and platform health

---

## 7. Platform Metrics & Traction

Mintoria generates key SaaS metrics automatically:

| Metric | Description | How It's Tracked |
|--------|-------------|-----------------|
| **Total Organizers** | Number of registered organizers | `GET /api/admin/organizers/stats` |
| **Active Organizers** | Organizers with `isActive: true` | Same endpoint |
| **New This Month** | Registrations in last 30 days | Same endpoint |
| **Plan Distribution** | Count per plan (Free/Starter/Professional/Enterprise) | Same endpoint |
| **Free→Paid Conversion** | Percentage of organizers on paid plans | Calculated server-side |
| **Total Platform Mints** | All confirmed mints across all organizers | `GET /api/admin/organizers/stats` |
| **Events Created** | Total drops published across platform | `GET /api/admin/stats` |
| **NFTs Minted** | Total confirmed mints on Stellar | `GET /api/admin/stats` |

These metrics are surfaced in the admin dashboard as summary cards and are available via the organizer management panel for detailed analysis.

---

## 8. Why Stellar?

| Factor | Stellar | Ethereum | Solana |
|--------|---------|----------|--------|
| **Transaction Fee** | ~0.00001 XLM (~$0.000001) | $1-50+ (gas) | ~$0.00025 |
| **Finality Time** | 3-5 seconds | 12-15 minutes | ~400ms |
| **Energy per TX** | Minimal (SCP consensus) | High (PoS) | Moderate (PoH+PoS) |
| **Built-in Operations** | `manageData` for metadata | Requires smart contracts | Requires programs |
| **Account Funding** | Friendbot (testnet) | Faucets (limited) | Airdrop (limited) |
| **Custodial Simplicity** | Native keypair generation | Same | Same |

### Key advantages for Mintoria's use case:

1. **Cost at Scale**: At R$0.000001 per mint, even 1 million mints cost less than R$1 in network fees. This makes the per-mint economics viable at any scale.

2. **Speed**: 3-5 second finality means visitors see their NFT confirmed before they walk away from the QR code location.

3. **Built-in Data Storage**: Stellar's `manageData` operation allows storing NFT metadata directly on-chain without deploying smart contracts, reducing complexity and cost.

4. **Energy Efficiency**: Stellar's Stellar Consensus Protocol (SCP) is significantly more energy-efficient than proof-of-work or even proof-of-stake chains, aligning with the sustainability values of tourism operators.

5. **Future Path**: Soroban (Stellar's smart contract platform) provides a clear upgrade path for advanced features like marketplace contracts and programmable NFT logic without migrating to a different blockchain.

### Value Proposition for Stellar Foundation
- **Real-world blockchain adoption**: Mintoria demonstrates tangible utility of the Stellar network for tourism — an industry generating $1.9 trillion globally
- **Verifiable usage metrics**: Every NFT mint is an on-chain transaction on Stellar, providing transparent proof of network utilization
- **User onboarding at scale**: Each mint creates a new Stellar account via custodial wallets, growing the Stellar ecosystem without requiring crypto knowledge
- **Freemium model drives volume**: Zero-barrier onboarding means faster growth in transaction volume on the Stellar network

---

## 9. Security Architecture

### Data Protection
- **Custodial Keys**: Stellar private keys are encrypted with AES-256-CBC before database storage. The encryption secret is a production environment variable, never stored in code.
- **Admin Authentication**: Passwords hashed with scrypt (salt + cost factor). Sessions stored in PostgreSQL with httpOnly, secure, and sameSite cookies.
- **Verification Codes**: 6-digit codes sent via email (Resend), stored in-memory with automatic expiry. Rate limited per email and per IP address.

### Multi-Tenant Security
- **Data Isolation**: Organizers can only access their own projects, locations, drops, and mints through ownership middleware (`requireProjectOwnership`, `requireDropOwnership`).
- **Role-Based Access**: `requireAdmin` for platform management, `requireOrganizerOrAdmin` for shared operations.
- **Sensitive Data Handling**: Organizer detail API strips `passwordHash` from responses. Toggle endpoint validates target role before status change.
- **Plan Enforcement**: Server-side limits return structured error codes (`PLAN_MINT_LIMIT`, `PLAN_LOCATION_LIMIT`) — never trust client-side checks.

### Anti-Fraud Measures
- **Claim Sessions**: Each mint attempt requires a valid session token (SHA-256 hashed) with a 5-minute expiry window.
- **One Mint Per Email Per Drop**: Database constraint prevents duplicate mints.
- **Supply Enforcement**: Server-side check before every blockchain call ensures drop limits are respected.
- **Rate Limiting**: Login attempts (5/15min) and registration requests are throttled to prevent abuse.

### Production Hardening
- **Helmet**: HTTP security headers including X-Frame-Options and Content Security Policy.
- **Secrets Enforcement**: Server refuses to start in production without `SESSION_SECRET`, `WALLET_ENCRYPTION_SECRET`, and `STELLAR_SERVER_SECRET_KEY`.
- **Error Sanitization**: Internal error details are never exposed to end users in production.
- **Trust Proxy**: Correctly identifies client IPs behind load balancers and reverse proxies.

---

## 10. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, TypeScript, Vite | SPA with PWA support |
| **Styling** | Tailwind CSS, shadcn/ui | Component library + utility CSS |
| **State** | TanStack React Query | Server state management + caching |
| **Routing** | Wouter | Lightweight client-side routing |
| **Animations** | Framer Motion | Page transitions and micro-interactions |
| **Backend** | Node.js, Express, TypeScript | REST API server |
| **Database** | PostgreSQL, Drizzle ORM | Relational data + type-safe queries |
| **Blockchain** | stellar-sdk | Stellar Horizon API interaction |
| **Email** | Resend | Transactional emails (verification + confirmation) |
| **Security** | Helmet, scrypt, AES-256-CBC | HTTP hardening + encryption |
| **i18n** | Custom system | EN/PT/ES with auto-detection |

---

## 11. Current State & Roadmap

### v1.0 — Complete ✓
- Complete visitor flow: QR → Claim → Email → Verify → Mint → Share
- Custodial Stellar wallets (email-based, no crypto knowledge needed)
- Admin dashboard with full CRUD, analytics, and QR code generation
- 4 demo locations with access codes (Paris, Rio de Janeiro, Curitiba, Foz do Iguaçu)
- Social sharing (Twitter/X + Instagram)
- i18n (English, Portuguese, Spanish) with auto-detection
- PWA for mobile installation
- Embeddable widget for third-party websites
- NFT metadata API for on-chain references
- Production-ready security (Helmet, encryption, rate limiting, secrets enforcement)

### v1.5 — Complete ✓ (Multi-Tenant Platform)
- **Self-service organizer registration** with email/password at `/register`
- **Freemium model**: Free plan (50 mints/drop, 1 location) assigned by default
- **Dedicated organizer dashboard**: Stats, plan usage, project management, mints overview
- **Plan-based enforcement**: Server-side limits with structured error codes
- **Admin organizer management**: List, filter, search, paginate, detail view, activate/deactivate
- **Platform metrics**: Total organizers, active count, new this month, plan distribution, conversion rate
- **Organizer summary cards** on admin dashboard (total, active, free→paid conversion)
- **Data isolation**: Organizers only see their own resources via ownership middleware
- **Full i18n** for all organizer features (EN/PT/ES)

### v2.0 — Next
- Enhanced analytics with time-series charts and geographic data
- Multi-image drops (carousel of NFT designs per location)
- Webhook notifications for third-party integrations
- Branded email templates with operator customization
- Payment integration for plan upgrades (Stripe)

### v3.0 — Future
- **Soroban Smart Contracts**: Migrate from `manageData` to programmable NFT contracts on Stellar
- **NFT Marketplace**: Secondary market for trading commemorative NFTs
- **White-Label Solution**: Fully branded deployments per client
- **Public API**: RESTful API with key-based authentication for programmatic access
- **Advanced Reporting**: Custom dashboards, export formats, and scheduled reports

### v4.0+ — Long-term
- **MPC Custody**: Multi-party computation for enterprise-grade key security
- **Multi-Chain Expansion**: Ethereum and Solana support for broader market reach
- **AI-Powered NFT Generation**: Unique artwork generated from location/event data
- **Decentralized Storage**: IPFS/Arweave for permanent, censorship-resistant media storage
- **Mobile SDK**: Native iOS/Android SDK for operator app integrations
- **Enterprise SSO**: SAML/OIDC single sign-on for corporate clients

---

## 12. Demo Access

| Location | Access Code | Claim URL |
|----------|-------------|-----------|
| Paris (Eiffel Tower) | `PARIS2026` | `/claim/1` |
| Rio de Janeiro (Cristo Redentor) | `RIO2026` | `/claim/3` |
| Curitiba (Palácio de Cristal) | `CURITIBA2026` | `/claim/4` |
| Foz do Iguaçu (Cataratas) | `FOZ2026` | `/claim/5` |

**Admin Dashboard**: `/admin/login`
**Organizer Registration**: `/register`
**Organizer Dashboard**: `/organizer` (after login)

---

*Built with Stellar. Designed for tourism. From tool to platform. Ready for scale.*
