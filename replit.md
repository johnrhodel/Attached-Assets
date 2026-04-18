# Mintoria - Commemorative NFT Minting Platform

## Overview
Mintoria is a multi-tenant SaaS platform enabling the minting of commemorative NFTs at tourist locations and events. Built on the Solana blockchain, it allows visitors to claim NFTs by scanning QR codes and entering their email, eliminating the need for a crypto wallet. The platform supports self-service organizer registration with a freemium model (Free/Starter/Professional/Enterprise), plan-based limits on mints and locations, and comprehensive admin oversight. It features full internationalization (EN/PT/ES), PWA functionality, and social sharing capabilities. Mintoria aims to revolutionize how physical experiences are commemorated with digital assets, offering a seamless and accessible entry point to NFTs for a broad audience.

## User Preferences
Preferred communication style: Simple, everyday language. User speaks Portuguese.

## System Architecture
Mintoria employs a client-server architecture. The frontend is built with React, TypeScript, Tailwind CSS, and `shadcn/ui`, utilizing Wouter for routing, TanStack React Query for state management, and Framer Motion for animations. It includes PWA features and supports i18n (EN/PT/ES) with a professional blue-based color scheme. The backend is a Node.js Express application in TypeScript, providing RESTful APIs for claim sessions, anti-fraud, blockchain interactions, multi-tenant CRUD, and organizer management. PostgreSQL, managed by Drizzle ORM, serves as the primary database.

The platform supports two main user roles: Admin and Organizer. Admins have full platform control, managing all aspects, while Organizers can self-register, manage their own projects, locations, and NFT drops within plan-based limits, with data isolation enforced by middleware.

NFTs are minted on the Solana devnet using Metaplex Core. The system uses a persistent server keypair for blockchain interactions, with dynamic NFT metadata served via a dedicated API endpoint to ensure proper display in Solana explorers and wallets. Custodial wallets use AES-256-CBC encryption.

Core features include public claim pages, an NFT gallery, user NFT lookup by email, comprehensive admin and organizer dashboards, self-service organizer registration, and a password recovery flow. The system also integrates an email service for verification codes and mint confirmations, full internationalization, and robust security measures including Helmet middleware, secure session management, and rate limiting. Plan-based limits are enforced server-side, with structured error codes.

## External Dependencies
- PostgreSQL
- Drizzle ORM
- `@solana/web3.js`
- `shadcn/ui`
- Lucide React
- react-icons
- Embla Carousel
- Recharts
- Framer Motion
- `helmet`
- Resend (Email Service)