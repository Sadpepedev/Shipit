# Cygaar's Circuit - Blockchain Game

A blockchain-based game where players navigate through obstacles while earning and spending tokens.

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in required values

3. Start local Hardhat node:
   ```bash
   npm run node
   ```

4. Deploy contracts (in a new terminal):
   ```bash
   # Local deployment
   npm run deploy:local
   
   # Testnet deployment
   npm run deploy:testnet
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

## Testing

Run the test suite:
```bash
npm test
```

## Contract Deployment

1. Ensure your `.env` file is configured with:
   - `PRIVATE_KEY`: Your deployment wallet's private key
   - `SEPOLIA_RPC_URL`: RPC URL for Sepolia testnet

2. Deploy to desired network:
   ```bash
   # Local
   npm run deploy:local
   
   # Testnet
   npm run deploy:testnet
   ```

3. Update the contract address in your `.env` file:
   ```
   VITE_GAME_TOKEN_ADDRESS=<deployed-contract-address>
   ```

## Wallet Integration

The game uses Abstract Gaming Wallet for seamless blockchain integration:

1. Connect wallet using the "Connect with AGW" button
2. Ensure you have sufficient CYGAAR tokens
3. Each game play costs 10 CYGAAR tokens
4. High scores are recorded on-chain

## Architecture

- Smart Contracts: Solidity contracts for game token and mechanics
- Frontend: React + Vite
- Blockchain Integration: ethers.js + Hardhat
- Wallet: Abstract Gaming Wallet
- State Management: Zustand
- Testing: Hardhat + Chai