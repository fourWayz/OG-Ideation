// 'use client';

// import { ReactNode } from 'react';
// import { WagmiProvider } from 'wagmi';
// import { mainnet, sepolia } from 'wagmi/chains';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
// import { PrivyProvider } from '@privy-io/react-auth';
// import { http } from 'viem';

// // OG Chain configuration
// const ogChain = {
//   id: Number(process.env.NEXT_PUBLIC_OG_CHAIN_ID),
//   name: 'OG Chain',
//   network: 'og-chain',
//   nativeCurrency: {
//     decimals: 18,
//     name: 'OG',
//     symbol: 'OG',
//   },
//   rpcUrls: {
//     public: { http: [process.env.NEXT_PUBLIC_OG_RPC_URL!] },
//     default: { http: [process.env.NEXT_PUBLIC_OG_RPC_URL!] },
//   },
// } as const;

// const chains = [ogChain, mainnet, sepolia] as const;

// const config = getDefaultConfig({
//   appName: 'ChainChat AI',
//   projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default',
//   chains,
//   transports: {
//     [ogChain.id]: http(process.env.NEXT_PUBLIC_OG_RPC_URL!),
//     [mainnet.id]: http(),
//     [sepolia.id]: http(),
//   },
//   ssr: true,
// });

// const queryClient = new QueryClient();

// export function Web3Provider({ children }: { children: ReactNode }) {
//   return (
//     <PrivyProvider
//       appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
//       config={{
//         loginMethods: ['email', 'wallet'],
//         appearance: {
//           theme: 'light',
//           accentColor: '#676FFF',
//         },
//         embeddedWallets: {
//           createOnLogin: 'users-without-wallets',
//         },
//       }}
//     >
//       <WagmiProvider config={config}>
//         <QueryClientProvider client={queryClient}>
//           <RainbowKitProvider>{children}</RainbowKitProvider>
//         </QueryClientProvider>
//       </WagmiProvider>
//     </PrivyProvider>
//   );
// }
