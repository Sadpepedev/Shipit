import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { WagmiConfig, RainbowKitProvider, chains, config, queryClient } from './lib/rainbow';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <ErrorBoundary>
      <WagmiConfig config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider chains={chains}>
            <App />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiConfig>
    </ErrorBoundary>
  </StrictMode>
);