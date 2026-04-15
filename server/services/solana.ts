import { Connection, Keypair, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createV1, mplCore, fetchAssetV1 } from "@metaplex-foundation/mpl-core";
import { generateSigner, keypairIdentity, publicKey as umiPublicKey, createSignerFromKeypair as umiSignerFromKeypair } from "@metaplex-foundation/umi";
import bs58 from "bs58";

const SOLANA_NETWORK = process.env.SOLANA_NETWORK || "devnet";
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl(SOLANA_NETWORK as any);

let serverKeypair: Keypair | null = null;
let umi: any = null;

let cachedBalance: { value: number; timestamp: number } | null = null;
const BALANCE_CACHE_TTL = 15000;
let airdropInProgress = false;
let lastAirdropAttempt = 0;
const AIRDROP_COOLDOWN = 120000;

function getServerKeypair(): Keypair {
  if (serverKeypair) return serverKeypair;

  const secretKeyEnv = process.env.SOLANA_SERVER_SECRET_KEY || process.env.STELLAR_SERVER_SECRET_KEY;
  if (secretKeyEnv) {
    try {
      const decoded = bs58.decode(secretKeyEnv);
      serverKeypair = Keypair.fromSecretKey(decoded);
      console.log(`[SOLANA] Loaded persistent keypair. Public key: ${serverKeypair.publicKey.toBase58()}`);
    } catch {
      try {
        const arr = JSON.parse(secretKeyEnv);
        serverKeypair = Keypair.fromSecretKey(Uint8Array.from(arr));
        console.log(`[SOLANA] Loaded persistent keypair (JSON). Public key: ${serverKeypair.publicKey.toBase58()}`);
      } catch {
        console.error("[SOLANA] Failed to parse secret key from env, generating new one");
        serverKeypair = Keypair.generate();
      }
    }
  } else {
    serverKeypair = Keypair.generate();
    console.log(`[SOLANA] Auto-generated server keypair. Public key: ${serverKeypair.publicKey.toBase58()}`);
    console.log(`[SOLANA] Set SOLANA_SERVER_SECRET_KEY env var to persist this keypair across restarts.`);
  }

  return serverKeypair;
}

function getUmi() {
  if (umi) return umi;

  const kp = getServerKeypair();
  umi = createUmi(SOLANA_RPC_URL)
    .use(mplCore());

  const umiKeypair = umi.eddsa.createKeypairFromSecretKey(kp.secretKey);
  umi.use(keypairIdentity(umiKeypair));

  return umi;
}

function getConnection(): Connection {
  return new Connection(SOLANA_RPC_URL, "confirmed");
}

export function generateSolanaKeypair(): { address: string; secretKey: string } {
  const kp = Keypair.generate();
  return {
    address: kp.publicKey.toBase58(),
    secretKey: bs58.encode(kp.secretKey),
  };
}

export async function ensureServerFunded(): Promise<boolean> {
  try {
    const connection = getConnection();
    const kp = getServerKeypair();
    const balance = await connection.getBalance(kp.publicKey);
    cachedBalance = { value: balance / LAMPORTS_PER_SOL, timestamp: Date.now() };

    if (balance >= 0.01 * LAMPORTS_PER_SOL) {
      return true;
    }

    if (airdropInProgress) {
      return false;
    }

    if (Date.now() - lastAirdropAttempt < AIRDROP_COOLDOWN) {
      return false;
    }

    if (SOLANA_NETWORK !== "devnet") {
      console.warn("[SOLANA] Server wallet has insufficient funds on mainnet");
      return false;
    }

    airdropInProgress = true;
    lastAirdropAttempt = Date.now();

    try {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`[SOLANA] Requesting devnet airdrop (attempt ${attempt}/2)...`);
          const airdropPromise = connection.requestAirdrop(kp.publicKey, 2 * LAMPORTS_PER_SOL);
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Airdrop timeout")), 15000)
          );
          const sig = await Promise.race([airdropPromise, timeoutPromise]);
          const confirmPromise = connection.confirmTransaction(sig, "confirmed");
          const confirmTimeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Confirm timeout")), 30000)
          );
          await Promise.race([confirmPromise, confirmTimeout]);
          console.log("[SOLANA] Airdrop received: 2 SOL");
          cachedBalance = { value: 2, timestamp: Date.now() };
          return true;
        } catch (err) {
          console.warn(`[SOLANA] Airdrop attempt ${attempt} failed:`, (err as Error).message);
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 2000));
          }
        }
      }
      console.warn("[SOLANA] Airdrop failed. Fund manually at https://faucet.solana.com with address:", kp.publicKey.toBase58());
      return false;
    } finally {
      airdropInProgress = false;
    }
  } catch (err) {
    console.error("[SOLANA] Failed to check/fund server wallet:", (err as Error).message);
    return false;
  }
}

export async function getServerBalance(): Promise<number> {
  if (cachedBalance && Date.now() - cachedBalance.timestamp < BALANCE_CACHE_TTL) {
    return cachedBalance.value;
  }

  try {
    const connection = getConnection();
    const kp = getServerKeypair();
    const balancePromise = connection.getBalance(kp.publicKey);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Balance check timeout")), 5000)
    );
    const balance = await Promise.race([balancePromise, timeoutPromise]);
    const sol = balance / LAMPORTS_PER_SOL;
    cachedBalance = { value: sol, timestamp: Date.now() };
    return sol;
  } catch (err) {
    console.warn("[SOLANA] Balance check failed:", (err as Error).message);
    return cachedBalance?.value ?? 0;
  }
}

export async function mintNFT(params: {
  recipientAddress: string;
  name: string;
  uri: string;
}): Promise<{ txHash: string; mintAddress: string }> {
  const umiInstance = getUmi();

  const balance = await getServerBalance();
  if (balance < 0.005) {
    ensureServerFunded().catch(() => {});
    throw new Error("INSUFFICIENT_SOL");
  }

  const asset = generateSigner(umiInstance);

  const tx = await createV1(umiInstance, {
    asset,
    name: params.name,
    uri: params.uri,
    owner: umiPublicKey(params.recipientAddress),
  }).sendAndConfirm(umiInstance);

  const signature = bs58.encode(tx.signature);

  return {
    txHash: signature,
    mintAddress: asset.publicKey.toString(),
  };
}

export async function mintNFTWithCustodialWallet(params: {
  custodialSecretKey: string;
  name: string;
  uri: string;
}): Promise<{ txHash: string; mintAddress: string; recipientAddress: string }> {
  const custodialKp = Keypair.fromSecretKey(bs58.decode(params.custodialSecretKey));

  return {
    ...(await mintNFT({
      recipientAddress: custodialKp.publicKey.toBase58(),
      name: params.name,
      uri: params.uri,
    })),
    recipientAddress: custodialKp.publicKey.toBase58(),
  };
}

export function getServerPublicKey(): string {
  return getServerKeypair().publicKey.toBase58();
}

export function getSolanaExplorerUrl(txHash: string): string {
  const cluster = SOLANA_NETWORK === "mainnet-beta" ? "" : `?cluster=${SOLANA_NETWORK}`;
  return `https://explorer.solana.com/tx/${txHash}${cluster}`;
}

export function getChainStatus() {
  return {
    network: SOLANA_NETWORK,
    rpcUrl: SOLANA_RPC_URL,
    serverPublicKey: getServerPublicKey(),
    healthy: true,
  };
}
