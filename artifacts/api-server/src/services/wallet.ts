import { generateSolanaKeypair } from "./solana";
import { generateEvmKeypair } from "./evm";
import { generateStellarKeypair } from "./stellar";

export type ChainType = "evm" | "solana" | "stellar";

export interface GeneratedWallet {
  chain: ChainType;
  address: string;
  secret: string;
}

export function generateWalletForChain(chain: ChainType): GeneratedWallet {
  switch (chain) {
    case "solana": {
      const kp = generateSolanaKeypair();
      return { chain, address: kp.address, secret: kp.secretKey };
    }
    case "evm": {
      const kp = generateEvmKeypair();
      return { chain, address: kp.address, secret: kp.privateKey };
    }
    case "stellar": {
      const kp = generateStellarKeypair();
      return { chain, address: kp.address, secret: kp.secretKey };
    }
    default:
      throw new Error(`Unsupported chain: ${chain}`);
  }
}

export function generateAllWallets(): GeneratedWallet[] {
  const chains: ChainType[] = ["evm", "solana", "stellar"];
  return chains.map((chain) => generateWalletForChain(chain));
}
