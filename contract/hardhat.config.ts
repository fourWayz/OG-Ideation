import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import 'hardhat-deploy'
import * as dotenv from 'dotenv'
import '@typechain/hardhat'
dotenv.config()

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  networks: {
    og_testnet: {
      url: "https://evmrpc-testnet.0g.ai",
      chainId: 16601,
      accounts: [process.env.PRIVATE_KEY!]
    }
  },
  namedAccounts: {
    deployer: {
      default: 0,
      1: 0,
    },

  }
};

export default config;
