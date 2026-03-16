# Mintoria — Technical Architecture & Product Overview

> A plug-and-play platform for minting commemorative NFTs at tourist locations and events, built exclusively on the Stellar blockchain.

---

## 1. Product Vision

Mintoria turns real-world experiences into digital collectibles. When a visitor arrives at a tourist location, museum, park, or event, they scan a QR code with their phone, enter their email, and receive a commemorative NFT — no crypto wallet, no app download, no blockchain knowledge required.

The platform is designed for **tourism operators and event organizers** who want to offer a modern, memorable experience to their visitors while building a digital engagement channel.

### Key Differentiators
- **Zero friction for visitors**: Email-based custodial wallets — no MetaMask, no seed phrases
- **Plug-and-play for operators**: Admin dashboard to create drops, generate QR codes, and monitor analytics
- **Built on Stellar**: Sub-second finality, near-zero fees (~0.00001 XLM per TX), energy-efficient consensus
- **Multi-language**: Full i18n support (English, Portuguese, Spanish) with automatic language detection
- **PWA + Embeddable**: Works as a standalone mobile app or embedded widget on any website

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         VISITOR DEVICE                          │
│                    (Mobile Browser / PWA)                        │
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
│   │  REST API    │  │  Sessions    │  │  (Auth + CRUD)        │ │
│   │  + Zod       │  │  (5-min TTL) │  │                       │ │
│   └──────┬───────┘  └──────────────┘  └───────────────────────┘ │
│          │                                                       │
│   ┌──────▼────────────────────────────────────────────────────┐  │
│   │                   SECURITY LAYER                          │  │
│   │  Helmet · Rate Limiting · Session Auth · Token Validation  │  │
│   │  Scrypt Hashing · AES-256 Encryption · Supply Checks      │  │
│   └───────────────────────────────────────────────────────────┘  │
│          │                          │                             │
│   ┌──────▼───────────┐    ┌────────▼─────────────────────────┐  │
│   │   PostgreSQL     │    │   Stellar Integration            │  │
│   │                  │    │                                   │  │
│   │   Users          │    │   Server Keypair Management       │  │
│   │   Projects       │    │   Custodial Wallet Generation     │  │
│   │   Locations      │    │   NFT Minting (manageData)        │  │
│   │   Drops          │    │   Horizon API Interaction         │  │
│   │   Mints          │    │   Testnet Auto-Funding            │  │
│   │   Custodial Keys │    │                                   │  │
│   │   Sessions       │    │   ┌───────────────────────────┐   │  │
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

## 3. How It Works — Visitor Flow

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

Step 4: MINT                Step 5: CONFIRMED           Step 6: SHARE
────────────                ─────────────────           ─────────────
Server generates     →      NFT recorded on       →     Share on X
custodial Stellar           Stellar blockchain          Share on Instagram
wallet for user             with manageData             Download image
        │                   operation                   View on Explorer
Mints NFT using                     │
server keypair              Confirmation email
        │                   sent to visitor
Supply check +
uniqueness enforced
```

### What happens behind the scenes during minting:

1. **Wallet Creation**: Server generates a Stellar keypair, encrypts the secret key (AES-256-CBC), and stores it in the database. The visitor never sees or manages this key.

2. **NFT Recording**: The server builds a Stellar transaction using `manageData` operations to store NFT metadata (title, metadata URI) on-chain, signs it with the server keypair, and submits it to the Stellar network.

3. **Safety Checks**: Before minting, the system verifies: (a) the claim session is valid and not expired, (b) the drop hasn't exceeded its supply limit, (c) the visitor hasn't already minted this drop, (d) the email is verified.

4. **Fault Tolerance**: If the blockchain transaction succeeds but the database update fails, the transaction hash is logged for manual recovery — the visitor still sees a success response.

---

## 4. How It Works — Operator Flow

Tourism operators manage everything through a web-based admin dashboard:

```
Step 1: SETUP               Step 2: CREATE              Step 3: DEPLOY
─────────────               ──────────────              ──────────────
Login to admin        →     Create a Project      →     Publish the drop
dashboard                   (organization)              Generate QR code
                                    │                   Print & place at
                            Create a Location           the location
                            (physical place)                  │
                                    │                   Or embed widget
                            Create a Drop               on your website
                            (NFT collection for
                             that month/event)

Step 4: MONITOR              Step 5: ANALYZE
───────────────              ───────────────
Watch real-time       →      View analytics:
mints on dashboard           • Total mints
                             • Mints by location
Receive notifications        • Unique visitors
for new mints                • Activity timeline
                             • Stellar network health
Export user data
(CSV) for CRM
```

### Admin Capabilities
- **Project Management**: Organize locations into projects (e.g., "Museum Chain 2026")
- **Drop Configuration**: Set title, image, supply limit, month/year, and optional access code
- **QR Code Generation**: Create downloadable QR codes (SVG/PNG) for each location
- **Analytics Dashboard**: Real-time charts showing mints over time and by location
- **User Export**: Download custodial user data as CSV for marketing/CRM integration
- **Reset Mints**: Development tool to reset all mint data (protected with double confirmation)
- **Stellar Health Monitor**: Live status of the Stellar network, server balance, and uptime

---

## 5. Why Stellar?

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

---

## 6. Security Architecture

### Data Protection
- **Custodial Keys**: Stellar private keys are encrypted with AES-256-CBC before database storage. The encryption secret is a production environment variable, never stored in code.
- **Admin Authentication**: Passwords hashed with scrypt (salt + cost factor). Sessions stored in PostgreSQL with httpOnly, secure, and sameSite cookies.
- **Verification Codes**: 6-digit codes sent via email (Resend), stored in-memory with automatic expiry. Rate limited per email and per IP address.

### Anti-Fraud Measures
- **Claim Sessions**: Each mint attempt requires a valid session token (SHA-256 hashed) with a 5-minute expiry window.
- **One Mint Per Email Per Drop**: Database constraint prevents duplicate mints.
- **Supply Enforcement**: Server-side check before every blockchain call ensures drop limits are respected.
- **Rate Limiting**: Login attempts and email verification requests are throttled to prevent abuse.

### Production Hardening
- **Helmet**: HTTP security headers including X-Frame-Options and Content Security Policy.
- **Secrets Enforcement**: Server refuses to start in production without `SESSION_SECRET`, `WALLET_ENCRYPTION_SECRET`, and `STELLAR_SERVER_SECRET_KEY`.
- **Error Sanitization**: Internal error details are never exposed to end users in production.
- **Trust Proxy**: Correctly identifies client IPs behind load balancers and reverse proxies.

---

## 7. Technology Stack

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

## 8. Business Model

### Target Market
Tourism operators, event organizers, museums, parks, cultural centers, festivals, and sports venues looking to offer digital commemorative experiences.

### Pricing Tiers

| Plan | Price | Included |
|------|-------|----------|
| **Starter** | R$599/event | Up to 500 mints, 1 location, QR code generation, email support, basic analytics |
| **Professional** | R$1.497/month | Unlimited mints, 5 locations, custom branding, priority support, advanced analytics, embeddable widget |
| **Enterprise** | R$4.997/month | Unlimited everything, unlimited locations, white-label solution, API access, dedicated support, custom integrations, SLA guarantee |

### Revenue Streams
- **SaaS Subscriptions**: Monthly/per-event pricing tiers
- **Per-Mint Fees**: At enterprise scale, per-mint billing option
- **White-Label Licensing**: Custom-branded deployments for large operators
- **Marketplace Commissions**: Revenue share on secondary NFT sales (v2.0+)

---

## 9. Current State & Roadmap

### v1.0 — Live (Current)
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

### v1.1 — Short-term
- Enhanced analytics with time-series charts and geographic data
- Multi-image drops (carousel of NFT designs per location)
- Webhook notifications for third-party integrations
- Branded email templates with operator customization

### v2.0 — Medium-term
- **Soroban Smart Contracts**: Migrate from `manageData` to programmable NFT contracts on Stellar
- **NFT Marketplace**: Secondary market for trading commemorative NFTs
- **Multi-Admin RBAC**: Role-based access control for operator teams
- **White-Label Solution**: Fully branded deployments per client
- **Public API**: RESTful API with key-based authentication for programmatic access
- **Advanced Reporting**: Custom dashboards, export formats, and scheduled reports

### v3.0+ — Long-term
- **MPC Custody**: Multi-party computation for enterprise-grade key security
- **Multi-Chain Expansion**: Ethereum and Solana support for broader market reach
- **AI-Powered NFT Generation**: Unique artwork generated from location/event data
- **Decentralized Storage**: IPFS/Arweave for permanent, censorship-resistant media storage
- **Mobile SDK**: Native iOS/Android SDK for operator app integrations
- **Enterprise SSO**: SAML/OIDC single sign-on for corporate clients

---

## 10. Demo Access

| Location | Access Code | Claim URL |
|----------|-------------|-----------|
| Paris (Eiffel Tower) | `PARIS2026` | `/claim/1` |
| Rio de Janeiro (Cristo Redentor) | `RIO2026` | `/claim/3` |
| Curitiba (Palácio de Cristal) | `CURITIBA2026` | `/claim/4` |
| Foz do Iguaçu (Cataratas) | `FOZ2026` | `/claim/5` |

**Admin Dashboard**: `/admin/login`

---

*Built with Stellar. Designed for tourism. Ready for scale.*
