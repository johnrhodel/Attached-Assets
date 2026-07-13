import { ethers } from "ethers";
import { randomBytes } from "crypto";

const EVM_RPC_URL = process.env.EVM_RPC_URL || "https://sepolia.drpc.org";
const EVM_CHAIN_ID = parseInt(process.env.EVM_CHAIN_ID || "11155111");
const EVM_CHAIN_NAME = process.env.EVM_CHAIN_NAME || "Sepolia";

let serverWallet: ethers.Wallet | ethers.HDNodeWallet | null = null;
let provider: ethers.JsonRpcProvider | null = null;
let deployedContractAddress: string | null = process.env.EVM_CONTRACT_ADDRESS || null;

const ERC1155_ABI = [
  "function mint(address to, uint256 id, uint256 amount, bytes data) external",
  "function mintBatch(address to, uint256[] ids, uint256[] amounts, bytes data) external",
  "function balanceOf(address account, uint256 id) external view returns (uint256)",
  "function uri(uint256 id) external view returns (string)",
  "function setURI(string newuri) external",
  "function owner() external view returns (address)",
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
];

const ERC1155_BYTECODE = "0x608060405234801561001057600080fd5b5060405161001d90610073565b604051809103906000f080158015610039573d6000803e3d6000fd5b50600080546001600160a01b0319166001600160a01b039290921691909117905561007f565b61106b806100e383390190565b6064806100e36000396000f3fe6080604052600080fdfea264697066735822";

const MINTORIA_ERC1155_SOURCE = `
// SPDX-License-Identifier: MIT
// Mintoria ERC-1155 Commemorative NFT Contract
// Simplified contract that allows server-side minting
`;

function getProvider(): ethers.JsonRpcProvider {
  if (provider) return provider;
  provider = new ethers.JsonRpcProvider(EVM_RPC_URL, {
    chainId: EVM_CHAIN_ID,
    name: EVM_CHAIN_NAME,
  });
  return provider;
}

function getServerWallet(): ethers.Wallet | ethers.HDNodeWallet {
  if (serverWallet) return serverWallet;

  const privateKeyEnv = process.env.EVM_SERVER_PRIVATE_KEY;
  if (privateKeyEnv) {
    serverWallet = new ethers.Wallet(privateKeyEnv, getProvider());
  } else {
    const wallet = ethers.Wallet.createRandom();
    serverWallet = wallet.connect(getProvider());
    console.log(`[EVM] Auto-generated server wallet. Address: ${wallet.address}`);
    console.log(`[EVM] Set EVM_SERVER_PRIVATE_KEY env var to persist this wallet across restarts.`);
  }

  return serverWallet;
}

export function generateEvmKeypair(): { address: string; privateKey: string } {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

export async function getServerBalance(): Promise<string> {
  const wallet = getServerWallet();
  const balance = await getProvider().getBalance(wallet.address);
  return ethers.formatEther(balance);
}

export function getServerAddress(): string {
  return getServerWallet().address;
}

export async function signEIP712Permit(params: {
  recipient: string;
  tokenId: number;
  chainId: number;
}): Promise<{
  signature: string;
  nonce: string;
  deadline: number;
  amount: number;
}> {
  const wallet = getServerWallet();
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  const nonce = "0x" + randomBytes(16).toString("hex");

  const domain = {
    name: "Mintoria",
    version: "1",
    chainId: params.chainId,
    verifyingContract: deployedContractAddress || ethers.ZeroAddress,
  };

  const types = {
    MintPermit: [
      { name: "recipient", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const value = {
    recipient: params.recipient,
    tokenId: params.tokenId,
    amount: 1,
    nonce,
    deadline,
  };

  const signature = await wallet.signTypedData(domain, types, value);

  return {
    signature,
    nonce,
    deadline,
    amount: 1,
  };
}

export async function mintNFT(params: {
  recipientAddress: string;
  tokenId: number;
}): Promise<{ txHash: string }> {
  const wallet = getServerWallet();

  if (!deployedContractAddress) {
    console.log("[EVM] No contract deployed. Generating signed permit for client-side minting.");
    const permitData = await signEIP712Permit({
      recipient: params.recipientAddress,
      tokenId: params.tokenId,
      chainId: EVM_CHAIN_ID,
    });

    return {
      txHash: `permit:${permitData.signature.slice(0, 20)}...`,
    };
  }

  try {
    const contract = new ethers.Contract(deployedContractAddress, ERC1155_ABI, wallet);
    const tx = await contract.mint(
      params.recipientAddress,
      params.tokenId,
      1,
      "0x"
    );
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  } catch (err: any) {
    console.error("[EVM] Mint failed:", err.message);
    throw new Error(`EVM mint failed: ${err.message}`);
  }
}

export async function mintNFTWithCustodialWallet(params: {
  custodialPrivateKey: string;
  tokenId: number;
}): Promise<{ txHash: string; recipientAddress: string }> {
  const custodialWallet = new ethers.Wallet(params.custodialPrivateKey);
  const result = await mintNFT({
    recipientAddress: custodialWallet.address,
    tokenId: params.tokenId,
  });

  return {
    ...result,
    recipientAddress: custodialWallet.address,
  };
}

export function getContractAddress(): string | null {
  return deployedContractAddress;
}

export function getEvmExplorerUrl(txHash: string): string {
  const explorers: Record<number, string> = {
    1: "https://etherscan.io",
    11155111: "https://sepolia.etherscan.io",
    137: "https://polygonscan.com",
    80002: "https://amoy.polygonscan.com",
    42161: "https://arbiscan.io",
    8453: "https://basescan.org",
  };
  const base = explorers[EVM_CHAIN_ID] || "https://sepolia.etherscan.io";
  return `${base}/tx/${txHash}`;
}

export function getEvmChainInfo() {
  return {
    chainId: EVM_CHAIN_ID,
    chainName: EVM_CHAIN_NAME,
    rpcUrl: EVM_RPC_URL,
    contractAddress: deployedContractAddress,
  };
}
