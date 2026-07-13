import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("../services/solana", () => ({
  getServerPublicKey: () => "MockServerPubkey1111111111111111111111111111",
  getSolanaExplorerUrl: (txHash: string) =>
    `https://explorer.solana.com/tx/${txHash}?cluster=devnet`,
  mintNFT: vi.fn(async () => {
    await new Promise((r) => setTimeout(r, 50));
    const rand = Math.random().toString(36).slice(2);
    return { txHash: `mocktx_${rand}`, mintAddress: `mockmint_${rand}` };
  }),
  mintNFTWithCustodialWallet: vi.fn(),
  generateSolanaKeypair: () => ({ address: "MockAddr", secretKey: "MockSecret" }),
  isServerKeypairEphemeral: () => false,
  ensureServerFunded: async () => true,
  getServerBalance: async () => 1,
  getCachedBalance: () => 1,
  getChainStatus: () => ({ chain: "solana", network: "devnet", ready: true }),
}));

import express from "express";
import { createServer, type Server } from "http";
import { createHash, randomBytes } from "crypto";
import { registerRoutes } from "./routes";
import { storage } from "../storage";
import * as solanaService from "../services/solana";
import { api } from "../shared-routes";
import { pool } from "@workspace/db";

const PARALLEL_REQUESTS = 8;

let server: Server;
let baseUrl: string;
let projectId: number;
let locationId: number;
let dropId: number;

async function createTestDrop(supply: number): Promise<number> {
  const drop = await storage.createDrop({
    locationId,
    title: `Concurrency Test Drop ${randomBytes(4).toString("hex")}`,
    month: "July",
    year: 2026,
    imageUrl: "/uploads/test-concurrency.png",
    metadataUrl: "",
    supply,
    status: "active",
    enabledChains: ["solana"],
  });
  return drop.id;
}

async function createClaimToken(forDropId: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await storage.createClaimSession({
    dropId: forDropId,
    tokenHash,
    ipHash: null,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    status: "active",
  });
  return token;
}

beforeAll(async () => {
  const suffix = `${Date.now()}-${randomBytes(3).toString("hex")}`;
  const project = await storage.createProject({
    name: `Concurrency Test Project ${suffix}`,
    slug: `test-concurrency-${suffix}`,
  });
  projectId = project.id;

  const location = await storage.createLocation({
    projectId,
    name: `Concurrency Test Location ${suffix}`,
    slug: `test-concurrency-loc-${suffix}`,
  });
  locationId = location.id;

  dropId = await createTestDrop(1);

  const app = express();
  app.use(express.json());
  server = createServer(app);
  await registerRoutes(server, app);

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (typeof address === "string" || address === null) {
    throw new Error("Failed to bind test server to an ephemeral port");
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  if (projectId) await storage.deleteProject(projectId).catch(() => {});
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  await pool.end().catch(() => {});
});

describe("mint concurrency — last NFT of a drop", () => {
  it(`allows exactly 1 success out of ${PARALLEL_REQUESTS} parallel mint requests when supply=1`, async () => {
    const tokens = await Promise.all(
      Array.from({ length: PARALLEL_REQUESTS }, () => createClaimToken(dropId)),
    );

    const responses = await Promise.all(
      tokens.map(async (claimToken) => {
        const res = await fetch(`${baseUrl}${api.mint.solanaTx.path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claimToken }),
        });
        const body = (await res.json()) as { message?: string; txHash?: string };
        return { status: res.status, body };
      }),
    );

    const successes = responses.filter((r) => r.status === 200);
    const exhausted = responses.filter(
      (r) => r.status === 429 && r.body.message === "SUPPLY_EXHAUSTED",
    );

    expect(successes).toHaveLength(1);
    expect(successes[0]!.body.txHash).toMatch(/^mocktx_/);
    expect(exhausted).toHaveLength(PARALLEL_REQUESTS - 1);
    expect(successes.length + exhausted.length).toBe(PARALLEL_REQUESTS);

    expect(vi.mocked(solanaService.mintNFT)).toHaveBeenCalledTimes(1);

    const drop = await storage.getDrop(dropId);
    expect(drop).toBeDefined();
    expect(drop!.mintedCount).toBe(1);
    expect(drop!.mintedCount).toBeLessThanOrEqual(drop!.supply);
  });

  it("storage.reserveMintSlot grants exactly `supply` slots under parallel contention", async () => {
    const supply = 3;
    const attempts = 12;
    const contestedDropId = await createTestDrop(supply);

    const results = await Promise.all(
      Array.from({ length: attempts }, () =>
        storage.reserveMintSlot(contestedDropId, null),
      ),
    );

    const granted = results.filter(Boolean).length;
    expect(granted).toBe(supply);

    const afterwards = await storage.reserveMintSlot(contestedDropId, null);
    expect(afterwards).toBe(false);

    const drop = await storage.getDrop(contestedDropId);
    expect(drop!.mintedCount).toBe(supply);
    expect(drop!.mintedCount).toBeLessThanOrEqual(drop!.supply);
  });
});
