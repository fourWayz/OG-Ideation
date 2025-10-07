import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// OG Chain configuration
const ogChain = {
  id: Number(process.env.NEXT_PUBLIC_OG_CHAIN_ID),
  name: 'OG-Testnet-Galileo',
  network: 'og-chain',
  nativeCurrency: {
    decimals: 18,
    name: 'OG',
    symbol: 'OG',
  },
  rpcUrls: {
    public: { http: [process.env.NEXT_PUBLIC_OG_RPC_URL!] },
    default: { http: [process.env.NEXT_PUBLIC_OG_RPC_URL!] },
  },
} as const;

export const config = getDefaultConfig({
  appName: 'ChainChat AI',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [ogChain],
  ssr: true,
});