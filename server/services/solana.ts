import { Connection, Keypair, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createV1, mplCore, fetchAssetV1 } from "@metaplex-foundation/mpl-core";
import { generateSigner, keypairIdentity, publicKey as umiPublicKey, createSignerFromKeypair as umiSignerFromKeypair } from "@metaplex-foundation/umi";
import bs58 from "bs58";

const SOLANA_NETWORK = process.env.SOLANA_NETWORK || "devnet";
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl(SOLANA_NETWORK as any);

let serverKeypair: Keypair | null = null;
let umi: any = null;

function getServerKeypair(): Keypair {
  if (serverKeypair) return serverKeypair;

  const secretKeyEnv = process.env.SOLANA_SERVER_SECRET_KEY;
  if (secretKeyEnv) {
    try {
      const decoded = bs58.decode(secretKeyEnv);
      serverKeypair = Keypair.fromSecretKey(decoded);
    } catch {
      const arr = JSON.parse(secretKeyEnv);
      serverKeypair = Keypair.fromSecretKey(Uint8Array.from(arr));
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

    if (balance < 0.01 * LAMPORTS_PER_SOL) {
      if (SOLANA_NETWORK === "devnet") {
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`[SOLANA] Requesting devnet airdrop (attempt ${attempt}/3)...`);
            const sig = await connection.requestAirdrop(kp.publicKey, 2 * LAMPORTS_PER_SOL);
            await connection.confirmTransaction(sig, "confirmed");
            console.log("[SOLANA] Airdrop received: 2 SOL");
            return true;
          } catch (err) {
            console.warn(`[SOLANA] Airdrop attempt ${attempt} failed:`, (err as Error).message);
            if (attempt < 3) {
              const delay = Math.pow(2, attempt) * 1000;
              console.log(`[SOLANA] Retrying in ${delay / 1000}s...`);
              await new Promise(r => setTimeout(r, delay));
            }
          }
        }
        console.error("[SOLANA] All airdrop attempts failed");
        return false;
      } else {
        console.warn("[SOLANA] Server wallet has insufficient funds on mainnet");
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error("[SOLANA] Failed to check/fund server wallet:", err);
    return false;
  }
}

export async function mintNFT(params: {
  recipientAddress: string;
  name: string;
  uri: string;
}): Promise<{ txHash: string; mintAddress: string }> {
  const umiInstance = getUmi();

  await ensureServerFunded();

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

export async function getServerBalance(): Promise<number> {
  const connection = getConnection();
  const kp = getServerKeypair();
  const balance = await connection.getBalance(kp.publicKey);
  return balance / LAMPORTS_PER_SOL;
}
