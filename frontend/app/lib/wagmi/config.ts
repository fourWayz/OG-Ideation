import { getDefaultConfig } from '@rainbow-me/rainbowkit';



const mainnet = {
  id: Number(process.env.NEXT_PUBLIC_MAINNET_CHAIN_ID),
  name: '0G Mainnet',
  network: 'og-chain',
  nativeCurrency: {
    decimals: 18,
    name: 'OG',
    symbol: 'OG',
  },
  rpcUrls: {
    public: { http: [process.env.NEXT_PUBLIC_OG_MAINNET_RPC_URL!] },
    default: { http: [process.env.NEXT_PUBLIC_OG_MAINNET_RPC_URL!] },
  },
} as const;

export const config = getDefaultConfig({
  appName: 'ChainChat AI',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [mainnet],
  ssr: true,
});