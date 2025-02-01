import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { infuraProvider } from 'wagmi/providers/infura';
import { QueryClient } from '@tanstack/react-query';

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const infuraApiKey = import.meta.env.VITE_INFURA_API_KEY;
const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY;

if (!projectId) {
  console.warn('Missing VITE_WALLETCONNECT_PROJECT_ID');
}

// Configure providers with fallbacks and better retry logic
const providers = [
  ...(infuraApiKey ? [
    infuraProvider({ 
      apiKey: infuraApiKey,
      stallTimeout: 1000,
      priority: 0
    })
  ] : []),
  ...(alchemyApiKey ? [
    alchemyProvider({ 
      apiKey: alchemyApiKey,
      stallTimeout: 1000,
      priority: 1
    })
  ] : []),
  publicProvider({ 
    stallTimeout: 2000, 
    priority: 2,
    retryCount: 3,
    retryDelay: 1000,
  })
].filter(Boolean);

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [sepolia],
  providers,
  {
    pollingInterval: 4000,
    retryCount: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    batch: {
      multicall: {
        wait: 250,
        batchSize: 1024,
      }
    },
    rank: {
      interval: 4000,
      sampleCount: 3,
      timeout: 2000,
    }
  }
);

const { connectors } = getDefaultWallets({
  appName: "Cygaar's Circuit",
  projectId,
  chains,
});

// Improved error handling and logging
const ignoredErrors = [
  'Failed to get balance',
  'Failed to fetch',
  'User rejected the request',
  'MetaMask: Request of type',
  'User closed modal',
  'user rejected transaction',
];

export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
  logger: {
    warn: (message) => {
      if (!ignoredErrors.some(msg => message.includes(msg))) {
        console.warn(message);
      }
    },
  }
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      staleTime: 5000,
      cacheTime: 1000 * 60 * 60,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      onError: (error) => {
        if (error instanceof Error) {
          if (!ignoredErrors.some(msg => 
            error.message.toLowerCase().includes(msg.toLowerCase())
          )) {
            console.error('Query error:', error);
          }
        }
      }
    },
  },
});

export { WagmiConfig, RainbowKitProvider };
export { chains };