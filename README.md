# GreenScore

A privacy-preserving environmental behavior scoring dApp built with FHEVM. Users can encrypt and upload low-carbon behavior records, and the system generates an overall green score without exposing detailed behavior data.

## Features

- **Encrypted Action Submission**: Users submit environmental actions with encrypted weighted points using FHEVM's `euint64` types
- **Privacy-Preserving Scoring**: All scores are calculated on encrypted data using FHE operations (`FHE.add`, `FHE.fromExternal`)
- **Anonymous Leaderboard**: Bucketed leaderboard maintains privacy while allowing ranking
- **Encrypted Rewards**: Reward seeding and claiming operate entirely on ciphertext
- **User Decryption**: Users can decrypt their own scores with EIP-712 signatures

## FHEVM Application Points

- **Encrypted Aggregation**: Global scores and action counts are aggregated using `FHE.add` without decrypting individual contributions
- **Access Control**: Uses `FHE.allow` and `FHE.allowThis` for decryption authorization
- **Input Verification**: All encrypted inputs are verified using `FHE.fromExternal` with input proofs
- **Collective Decryption**: Supports both user-specific and collective decryption patterns

## Project Structure

```
.
├── fhevm-hardhat-template/    # Smart contracts and Hardhat configuration
│   ├── contracts/              # Solidity contracts (GreenScore.sol)
│   ├── deploy/                 # Deployment scripts
│   ├── test/                   # Contract tests
│   └── tasks/                 # Hardhat tasks
└── greenscore-frontend/       # Next.js frontend application
    ├── app/                   # Next.js app directory
    ├── components/            # React components
    ├── hooks/                # Custom React hooks
    ├── fhevm/                # FHEVM integration (instance, signature, etc.)
    └── abi/                  # Generated contract ABIs and addresses
```

## Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Package manager
- **Hardhat**: For contract development and testing
- **MetaMask** or compatible wallet: For wallet connection

## Installation

### Smart Contracts

```bash
cd fhevm-hardhat-template
npm install
```

### Frontend

```bash
cd greenscore-frontend
npm install
```

## Development

### Smart Contracts

1. **Compile contracts**:
   ```bash
   cd fhevm-hardhat-template
   npx hardhat compile
   ```

2. **Run tests**:
   ```bash
   npx hardhat test
   ```

3. **Deploy to local network**:
   ```bash
   # Start local Hardhat node
   npx hardhat node
   
   # Deploy contracts
   npx hardhat deploy --network localhost
   ```

4. **Deploy to Sepolia testnet**:
   ```bash
   npx hardhat deploy --tags GreenScore --network sepolia
   ```

### Frontend

1. **Generate ABI and addresses**:
   ```bash
   cd greenscore-frontend
   npm run gen:abi
   ```

2. **Run in mock mode** (for local development):
   ```bash
   npm run dev:mock
   ```

3. **Run in real mode** (for testnet/mainnet):
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## Deployment

### Smart Contracts

The GreenScore contract is deployed on Sepolia testnet:
- **Address**: `0xf82AA47cC1AAD7bdF4acc30bAFa4b40BC4E89F79`
- **Network**: Sepolia (Chain ID: 11155111)

### Frontend

The frontend is deployed on Vercel:
- **URL**: https://gs-0c5bc64ccad417a7.vercel.app

## Technology Stack

- **Smart Contracts**: Solidity ^0.8.24, FHEVM v0.9
- **Frontend**: Next.js 15, React 19, TypeScript
- **FHEVM Integration**: `@zama-fhe/relayer-sdk` (production), `@fhevm/mock-utils` (development)
- **Wallet**: Ethers.js v6, EIP-6963 wallet discovery
- **State Management**: Zustand
- **Data Fetching**: TanStack Query

## License

BSD-3-Clause-Clear


