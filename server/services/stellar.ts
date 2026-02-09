import * as StellarSdk from "stellar-sdk";
import { createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const STELLAR_NETWORK = process.env.STELLAR_NETWORK || "testnet";
const STELLAR_RPC_URL = process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
const STELLAR_HORIZON_URL = process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";
const STELLAR_NETWORK_PASSPHRASE =
  STELLAR_NETWORK === "mainnet"
    ? StellarSdk.Networks.PUBLIC
    : StellarSdk.Networks.TESTNET;

const KEYPAIR_FILE = join(process.cwd(), '.stellar-server-key');

let serverKeypair: StellarSdk.Keypair | null = null;

function tryLoadSecret(secret: string): StellarSdk.Keypair | null {
  const cleaned = secret.trim().replace(/[^A-Z0-9]/gi, '');
  if (cleaned.length !== 56) return null;
  try {
    return StellarSdk.Keypair.fromSecret(cleaned);
  } catch {
    return null;
  }
}

function getServerKeypair(): StellarSdk.Keypair {
  if (serverKeypair) return serverKeypair;

  const envSecret = process.env.STELLAR_SERVER_SECRET_KEY || '';
  const envKp = tryLoadSecret(envSecret);
  if (envKp) {
    serverKeypair = envKp;
    console.log(`[STELLAR] Loaded persistent server keypair from env. Public key: ${serverKeypair.publicKey()}`);
    return serverKeypair;
  }

  if (existsSync(KEYPAIR_FILE)) {
    try {
      const fileSecret = readFileSync(KEYPAIR_FILE, 'utf-8');
      const fileKp = tryLoadSecret(fileSecret);
      if (fileKp) {
        serverKeypair = fileKp;
        console.log(`[STELLAR] Loaded persistent server keypair from file. Public key: ${serverKeypair.publicKey()}`);
        return serverKeypair;
      }
    } catch {}
  }

  serverKeypair = StellarSdk.Keypair.random();
  try {
    writeFileSync(KEYPAIR_FILE, serverKeypair.secret(), 'utf-8');
    console.log(`[STELLAR] Generated and saved new server keypair. Public key: ${serverKeypair.publicKey()}`);
  } catch {
    console.log(`[STELLAR] Generated server keypair (not persisted). Public key: ${serverKeypair.publicKey()}`);
  }

  return serverKeypair;
}

export function generateStellarKeypair(): { address: string; secretKey: string } {
  const kp = StellarSdk.Keypair.random();
  return {
    address: kp.publicKey(),
    secretKey: kp.secret(),
  };
}

export async function fundTestnetAccount(publicKey: string): Promise<boolean> {
  if (STELLAR_NETWORK !== "testnet") return false;
  try {
    const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
    if (response.ok) {
      console.log(`[STELLAR] Funded testnet account: ${publicKey}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error("[STELLAR] Friendbot funding failed:", err);
    return false;
  }
}

export async function ensureServerFunded(): Promise<boolean> {
  try {
    const kp = getServerKeypair();
    const server = new StellarSdk.Horizon.Server(STELLAR_HORIZON_URL);

    try {
      await server.loadAccount(kp.publicKey());
      return true;
    } catch {
      if (STELLAR_NETWORK === "testnet") {
        return await fundTestnetAccount(kp.publicKey());
      }
      console.warn("[STELLAR] Server account not funded on mainnet");
      return false;
    }
  } catch (err) {
    console.error("[STELLAR] Failed to check server account:", err);
    return false;
  }
}

export async function mintNFT(params: {
  recipientAddress: string;
  name: string;
  uri: string;
}): Promise<{ txHash: string }> {
  const kp = getServerKeypair();
  const server = new StellarSdk.Horizon.Server(STELLAR_HORIZON_URL);

  await ensureServerFunded();

  try {
    const account = await server.loadAccount(kp.publicKey());

    const nftId = createHash('sha256').update(`${params.name}:${params.recipientAddress}:${Date.now()}`).digest('hex').slice(0, 16);
    const ownerShort = params.recipientAddress.slice(0, 56);

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.manageData({
          name: `nft:${nftId}`,
          value: ownerShort,
        })
      )
      .addOperation(
        StellarSdk.Operation.manageData({
          name: `nft_name:${nftId}`,
          value: params.name.slice(0, 64),
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(kp);
    const result = await server.submitTransaction(transaction);
    return { txHash: (result as any).hash || (result as any).id };
  } catch (err: any) {
    console.error("[STELLAR] Mint failed:", err);
    throw new Error(`Stellar mint failed: ${err.message || "Unknown error"}`);
  }
}

export async function mintNFTWithCustodialWallet(params: {
  custodialSecretKey: string;
  name: string;
  uri: string;
}): Promise<{ txHash: string; recipientAddress: string }> {
  const custodialKp = StellarSdk.Keypair.fromSecret(params.custodialSecretKey);

  const result = await mintNFT({
    recipientAddress: custodialKp.publicKey(),
    name: params.name,
    uri: params.uri,
  });

  return {
    ...result,
    recipientAddress: custodialKp.publicKey(),
  };
}

export function buildMintXDR(params: {
  recipientAddress: string;
  name: string;
  uri: string;
}): { xdr: string; networkPassphrase: string } {
  const kp = getServerKeypair();

  const account = new StellarSdk.Account(kp.publicKey(), "0");

  const nftId = createHash('sha256').update(`${params.name}:${params.recipientAddress}:${Date.now()}`).digest('hex').slice(0, 16);
  const ownerShort = params.recipientAddress.slice(0, 56);

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.manageData({
        name: `nft:${nftId}`,
        value: ownerShort,
      })
    )
    .addOperation(
      StellarSdk.Operation.manageData({
        name: `nft_name:${nftId}`,
        value: params.name.slice(0, 64),
      })
    )
    .setTimeout(300)
    .build();

  transaction.sign(kp);

  return {
    xdr: transaction.toXDR(),
    networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
  };
}

export function getServerPublicKey(): string {
  return getServerKeypair().publicKey();
}

export function getChainStatus() {
  return {
    network: STELLAR_NETWORK,
    horizonUrl: STELLAR_HORIZON_URL,
    serverPublicKey: getServerPublicKey(),
    healthy: true,
  };
}

export function getStellarExplorerUrl(txHash: string): string {
  const base = STELLAR_NETWORK === "mainnet"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";
  return `${base}/tx/${txHash}`;
}

export async function getServerBalance(): Promise<string> {
  try {
    const kp = getServerKeypair();
    const server = new StellarSdk.Horizon.Server(STELLAR_HORIZON_URL);
    const account = await server.loadAccount(kp.publicKey());
    const xlmBalance = account.balances.find((b: any) => b.asset_type === "native");
    return xlmBalance ? (xlmBalance as any).balance : "0";
  } catch {
    return "0";
  }
}
