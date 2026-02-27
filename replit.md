# Mintoria - Commemorative NFT Minting Platform

## Overview

Mintoria is a plug-and-play platform designed for minting commemorative NFTs for visitors at tourist locations or events. It enables quick NFT claims via QR code on mobile devices and exclusively utilizes the Stellar blockchain. The platform includes an admin interface for creating monthly "drops" across various locations and supports internationalization (English, Spanish, Portuguese). Key capabilities include email-based custodial minting (no crypto wallet required), embeddable widget integration, and PWA functionality for mobile installation.

The project's vision is to leverage Stellar's efficiency for low-cost, fast, and energy-efficient NFT minting, targeting the tourism and event industries. Future ambitions include migrating to Soroban smart contracts, developing an NFT marketplace, and implementing advanced features like MPC custody and AI-powered NFT generation.

## User Preferences

Preferred communication style: Simple, everyday language. User speaks Portuguese.

## System Architecture

### Frontend
The frontend is built with React 18 and TypeScript, utilizing Wouter for routing, TanStack React Query for state management, and Tailwind CSS with shadcn/ui for styling. Framer Motion handles animations. It's a Vite-based PWA with a custom i18n system supporting English, Portuguese, and Spanish, using a blue-based professional color scheme. The structure follows a page-based approach with reusable components and custom hooks for logic encapsulation.

### Backend
The backend is a Node.js Express application written in TypeScript (ESM). It uses Express-session for authentication and handles claim session management, anti-fraud token generation, blockchain minting, and custodial wallet management. RESTful endpoints are defined with Zod schema validation.

### Data Storage
PostgreSQL is the primary database, managed via Drizzle ORM. The schema defines tables for Users (admins), Projects, Locations, Drops, ClaimSessions, Mints, WalletlessUsers, WalletlessKeys, PricingPlans, ActivityLogs, PlatformSettings, and Notifications.

### Authentication & Authorization
Admin users utilize cookie-based session authentication with PostgreSQL-backed session storage (connect-pg-simple). Admin passwords are hashed using scrypt with random salt (auto-migrated from plaintext on login). Default admin: `admin@mintoria.xyz` / `Mintoria2026!`. Claim sessions employ cryptographically hashed tokens for one-time NFT minting. The walletless flow involves encrypted custodial keys (AES-256-CBC) and email verification.

### Blockchain Integration
The platform exclusively uses the **Stellar blockchain** for NFT minting. Solana and EVM routes exist in the codebase but return 503 (disabled).
- **Stellar**: Leverages stellar-sdk for Horizon API interaction and uses `manageData` operations for on-chain NFT metadata storage. Supports server-side keypair generation and automatic funding for the Stellar testnet.

### Custodial Wallet System
For email-based minting, the system generates and encrypts Stellar keypairs (AES-256-CBC), storing them in the database. The server mints NFTs on the user's behalf using the custodial wallet's public address. No crypto wallet is required from the end user.

### PWA and Embed Features
The application functions as a PWA with manifest, service worker (registered in `client/src/main.tsx`), and network-first caching strategy. It offers two embed options for third-party sites: a direct iFrame (`/embed/:locationId`) and a script widget (`widget.js`) for modal integration.

### Core Features
- **Public Claim Pages**: `/claim/:locationId` and `/embed/:locationId` for visitors.
- **NFT Gallery**: `/gallery/:locationId` to display minted NFTs.
- **User NFT Lookup**: `/my-nfts` allows users to find their NFTs by email.
- **Admin Dashboard**: Comprehensive `/admin/dashboard` with metrics, project, location, and drop management.
- **API Endpoints**: Provide blockchain status, admin statistics, gallery data, user NFT lookups, QR code generation, and public stats (`/api/public/stats`).
- **Email Service**: For verification codes and mint confirmations via Resend (sender: `noreply@mintoria.xyz` via `EMAIL_FROM` env var). Default fallback: `onboarding@resend.dev`.
- **Landing Page**: Pricing section (3 tiers: Starter R$599, Professional R$1.497, Enterprise R$4.997), live platform stats, team section, and access code entry.
- **Demo Locations**: 4 pre-seeded locations with access codes — Paris (PARIS2026), Rio de Janeiro (RIO2026), Curitiba (CURITIBA2026), Foz do Iguaçu (FOZ2026). Location images served from `client/public/images/`.
- **Admin Features**: Dashboard with analytics charts, reset mints button (with confirmation), back-to-home button on login page.
- **Rate Limiting**: In-memory rate limiting on `/api/walletless/start` — max 3 per email per 10 min, max 10 per IP per 10 min.
- **Full i18n**: All toast messages, chain names, pricing text, and UI strings use the i18n system (EN/PT/ES). No hardcoded English in user-facing hooks or components. Automatic language detection via `navigator.language`.

## External Dependencies

### Database
- PostgreSQL (via `DATABASE_URL`)
- Drizzle ORM

### Blockchain SDKs
- `@solana/web3.js`, `@metaplex-foundation/umi`, `@metaplex-foundation/mpl-core`
- `ethers` (v6)
- `stellar-sdk`
- `bs58`, `viem`

### UI Component Libraries
- shadcn/ui (based on Radix UI)
- Lucide React (icons)
- Embla Carousel
- Recharts

### Development Tools
- Vite
- ESBuild
- TypeScript

### Security Features
- Mint uniqueness enforced per email per drop (prevents duplicate minting)
- Event access codes as alternative to QR scanning (`/access` page)
- `accessCode` field on drops table (optional, uppercase, auto-converted)
- `email` field on mints table for duplicate tracking
- Admin-only mint reset capability with confirmation guard
- Robust seed logic: access codes auto-fixed on every server startup regardless of project IDs

---

## Product Roadmap / Roadmap do Produto

### Current State / Estado Atual (v1.0)
**EN:** Mintoria is a fully functional commemorative NFT minting platform built on Stellar classic. Core features include: QR code claim flow, email-based custodial wallets (no crypto wallet required), admin dashboard with analytics and charts, multi-language support (EN/PT/ES) with automatic language detection, PWA for mobile, and embeddable widget for third-party sites. Mint uniqueness is enforced per email per drop. Event access codes provide an alternative to QR scanning. 4 demo locations pre-seeded (Paris, Rio de Janeiro, Curitiba, Foz do Iguaçu). Admin features include mint reset capability and back-to-home navigation on login. Location images served locally for reliable production deployment.

**PT:** Mintoria é uma plataforma funcional de mintagem de NFTs comemorativos construída na Stellar classic. Funcionalidades principais: fluxo de resgate por QR code, carteiras custodiais via email (sem necessidade de carteira cripto), painel admin com analytics e gráficos, suporte multi-idioma (EN/PT/ES) com detecção automática de idioma, PWA para mobile, e widget embutível para sites de terceiros. Unicidade de mint é garantida por email por drop. Códigos de acesso por evento oferecem alternativa ao QR code. 4 locais demo pré-configurados (Paris, Rio de Janeiro, Curitiba, Foz do Iguaçu). Funcionalidades admin incluem reset de mints e botão de voltar na tela de login. Imagens dos locais servidas localmente para deploy confiável em produção.

### Short-term / Curto Prazo (v1.1 — Q2 2026)
**EN:**
- Enhanced analytics dashboard with conversion funnel metrics
- Multi-image drops (gallery-style NFTs with carousel)
- Social sharing integration (share minted NFTs on social media)
- Webhook notifications for real-time mint events
- Rate limiting and advanced anti-fraud measures
- Improved email templates with branding customization

**PT:**
- Painel de analytics aprimorado com métricas de funil de conversão
- Drops com múltiplas imagens (NFTs estilo galeria com carrossel)
- Integração com redes sociais (compartilhar NFTs mintados)
- Notificações via webhook para eventos de mint em tempo real
- Limitação de taxa e medidas anti-fraude avançadas
- Templates de email aprimorados com personalização de marca

### Medium-term / Médio Prazo (v2.0 — Q3-Q4 2026)
**EN:**
- **Soroban Smart Contract Migration**: Move from Stellar classic manageData to Soroban smart contracts for true on-chain NFT standard (SEP-0039/Soroban NFT)
- **NFT Marketplace**: Secondary market for trading commemorative NFTs between users
- **Multi-Admin System**: Role-based access control (owner, editor, viewer) for team management
- **White-label Solution**: Custom branding, domains, and themes per client
- **API Access**: RESTful API with API keys for programmatic integrations
- **Advanced Reporting**: Export reports, scheduled reports, custom date ranges

**PT:**
- **Migração para Smart Contracts Soroban**: Mover de Stellar classic manageData para contratos inteligentes Soroban para padrão NFT real on-chain (SEP-0039/Soroban NFT)
- **Marketplace de NFTs**: Mercado secundário para troca de NFTs comemorativos entre usuários
- **Sistema Multi-Admin**: Controle de acesso baseado em funções (proprietário, editor, visualizador) para gestão de equipes
- **Solução White-label**: Marca personalizada, domínios e temas por cliente
- **Acesso via API**: API RESTful com chaves de API para integrações programáticas
- **Relatórios Avançados**: Exportar relatórios, relatórios agendados, intervalos de datas personalizados

### Long-term / Longo Prazo (v3.0 — 2027+)
**EN:**
- **MPC Custody (Multi-Party Computation)**: Replace single-key custodial wallets with MPC-based custody for enhanced security. Users retain partial key control without managing full private keys
- **Cross-chain Bridges**: Enable NFT portability across Stellar, Ethereum, and Solana ecosystems
- **AI-powered Experiences**: Auto-generate NFT artwork from location photos, personalized commemorative designs
- **Decentralized Storage**: Move NFT metadata and images to IPFS/Arweave for permanent, censorship-resistant storage
- **Mobile SDK**: Native iOS/Android SDK for seamless integration into travel and event apps
- **Enterprise SSO**: SAML/OAuth integration for large corporate clients

**PT:**
- **Custódia MPC (Multi-Party Computation)**: Substituir carteiras custodiais de chave única por custódia baseada em MPC para segurança aprimorada. Usuários mantêm controle parcial da chave sem gerenciar chaves privadas completas
- **Pontes Cross-chain**: Permitir portabilidade de NFTs entre ecossistemas Stellar, Ethereum e Solana
- **Experiências com IA**: Gerar automaticamente arte de NFTs a partir de fotos do local, designs comemorativos personalizados
- **Armazenamento Descentralizado**: Mover metadados e imagens de NFTs para IPFS/Arweave para armazenamento permanente e resistente a censura
- **SDK Mobile**: SDK nativo iOS/Android para integração fluida em apps de turismo e eventos
- **SSO Enterprise**: Integração SAML/OAuth para grandes clientes corporativos

### Business Model / Modelo de Negócios
**EN:**
- **Target Market**: Tourism operators, event organizers, museums, parks, festivals
- **Pricing Tiers**:
  - Starter: R$599/event (up to 500 mints)
  - Professional: R$1.497/month (unlimited mints, 5 locations)
  - Enterprise: R$4.997/month (unlimited everything, white-label, API access, dedicated support)
- **Revenue Streams**: SaaS subscriptions, per-mint fees at scale, white-label licensing, marketplace commissions (v2.0+)

**PT:**
- **Mercado Alvo**: Operadores de turismo, organizadores de eventos, museus, parques, festivais
- **Faixas de Preço**:
  - Starter: R$599/evento (até 500 mints)
  - Profissional: R$1.497/mês (mints ilimitados, 5 locais)
  - Enterprise: R$4.997/mês (tudo ilimitado, white-label, acesso API, suporte dedicado)
- **Fontes de Receita**: Assinaturas SaaS, taxas por mint em escala, licenciamento white-label, comissões de marketplace (v2.0+)

### Why Stellar / Por Que Stellar
**EN:**
- **Lowest transaction cost**: ~$0.000003 per transaction (vs Ethereum $2-10, Solana $0.01-0.05)
- **Fast finality**: 3-5 second transaction confirmation
- **Energy efficient**: Stellar Consensus Protocol uses minimal energy
- **Built-in DEX**: Native decentralized exchange for future marketplace
- **Soroban readiness**: Smart contract platform for advanced NFT features
- **Stellar Community Fund**: Eligible for grants to build ecosystem tooling
- **Real-world asset focus**: Stellar's mission aligns with tokenizing real experiences

**PT:**
- **Menor custo de transação**: ~$0,000003 por transação (vs Ethereum $2-10, Solana $0,01-0,05)
- **Finalidade rápida**: Confirmação de transação em 3-5 segundos
- **Eficiência energética**: Stellar Consensus Protocol usa energia mínima
- **DEX integrada**: Exchange descentralizada nativa para futuro marketplace
- **Preparação para Soroban**: Plataforma de contratos inteligentes para funcionalidades avançadas de NFT
- **Stellar Community Fund**: Elegível para grants para construir ferramentas do ecossistema
- **Foco em ativos do mundo real**: A missão da Stellar se alinha com tokenizar experiências reais