import * as StellarSdk from "stellar-sdk";
import { createHash } from "crypto";

const STELLAR_NETWORK = process.env.STELLAR_NETWORK || "testnet";
const STELLAR_RPC_URL = process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
const STELLAR_HORIZON_URL = process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";
const STELLAR_NETWORK_PASSPHRASE =
  STELLAR_NETWORK === "mainnet"
    ? StellarSdk.Networks.PUBLIC
    : StellarSdk.Networks.TESTNET;

let serverKeypair: StellarSdk.Keypair | null = null;

function getServerKeypair(): StellarSdk.Keypair {
  if (serverKeypair) return serverKeypair;

  const secretEnv = process.env.STELLAR_SERVER_SECRET_KEY?.trim().replace(/['"]/g, '');
  if (secretEnv && secretEnv.length > 0) {
    try {
      serverKeypair = StellarSdk.Keypair.fromSecret(secretEnv);
      console.log(`[STELLAR] Loaded persistent server keypair. Public key: ${serverKeypair.publicKey()}`);
    } catch (err) {
      console.error(`[STELLAR] Invalid STELLAR_SERVER_SECRET_KEY (length=${secretEnv.length}), generating new keypair...`);
      serverKeypair = StellarSdk.Keypair.random();
      console.log(`[STELLAR] Auto-generated server keypair. Public key: ${serverKeypair.publicKey()}`);
      console.log(`[STELLAR] To persist, set STELLAR_SERVER_SECRET_KEY to: ${serverKeypair.secret()}`);
    }
  } else {
    serverKeypair = StellarSdk.Keypair.random();
    console.log(`[STELLAR] Auto-generated server keypair. Public key: ${serverKeypair.publicKey()}`);
    console.log(`[STELLAR] Set STELLAR_SERVER_SECRET_KEY env var to persist this keypair across restarts.`);
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
