// import { Wallet, Provider, ContractFactory } from "zksync-ethers";
// import { ethers } from "ethers";
// import dotenv from "dotenv";

// dotenv.config();

// const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
// const zkSyncProvider = new Provider("https://sepolia.era.zksync.dev");
// const ethProvider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID"); // L1 Ethereum provider
// const wallet = new Wallet(PRIVATE_KEY, zkSyncProvider, ethProvider);

// async function main() {
//     console.log(`Deploying contract with account: ${wallet.address}`);

//     // Load and deploy the contract
//     const artifact = await import("../artifacts-zk/contracts/SimpleEscrow.sol/SimpleEscrow.json"); // zkSync compiles contracts in 'artifacts-zk'
//     const escrowFactory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);
    
//     const escrowContract = await escrowFactory.deploy();

//     console.log(`Deploying SimpleEscrow...`);
//     await escrowContract.waitForDeployment();
//     console.log(`SimpleEscrow deployed at: ${await escrowContract.getAddress()}`);
// }

// main()
//     .then(() => process.exit(0))
//     .catch((error) => {
//         console.error(error);
//         process.exit(1);
//     });
