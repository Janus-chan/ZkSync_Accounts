import { getProvider, logExplorerUrl } from "./utils";
import { serializeEip712 } from "zksync-ethers/build/utils";
import { L2VoidSigner, Wallet } from "zksync-ethers";
import { parseEther } from "ethers";
import loadFundsToAccount from "./loadFundsToAccount";
import {
  getApprovalBasedPaymasterInput,
  getGeneralPaymasterInput,
  getPaymasterParams,
} from "zksync-ethers/build/paymaster-utils";
// Address of the contract to interact with
const CONTRACT_ADDRESS = "0xBb462D7432eAfe3fE415d6D6Cb99dC3D5023Aa70";
const PAYMASTER_ADDRESS = "0x286C8350EEA9d48cb9E1Ad7C0a95946C6613Cfc4";
if (!CONTRACT_ADDRESS)
  throw `⛔️ Provide the address of the contract to interact with.
  You must set the CONTRACT_ADDRESS variable in the interact.ts file to the address of your deployed smart contract account.`;

// What we're doing here is:
//  1. Creating a structured object (following EIP-712) that represents the transaction we want to send
//  2. Broadcasting the transaction to the network. Once it reaches the network, it:
//     1. Gets picked up by the bootloader
//     2. The bootloader sends it to the "from" address, which we set to the smart contract account we deployed (line 7)
//     3. The smart contract account (BasicAccount.sol) runs it's three functions in this order:
//        a) validateTransaction
//        b) payForTransaction
//        c) executeTransaction
export default async function () {
  console.log(`Running script to interact with contract ${CONTRACT_ADDRESS}`);

console.log("create fake add ...",Wallet.createRandom().address);

  const provider = getProvider();

  // Create a "VoidSigner" setting the account to connect to as the smart contract account.
  // We can use a void signer because our contract doesn't verify any signatures.
  const signer = new L2VoidSigner(CONTRACT_ADDRESS, provider);

  // Get the current nonce of the smart contract account
  const nonce = await signer.getNonce();

  // Check if the smart contract has any funds to pay for gas fees
  const balance = await provider.getBalance(CONTRACT_ADDRESS);

  console.log(`Smart contract account balance: ${balance}`);
  // If it does not have any funds, load funds to the contract from your EOA (set as Hardhat private key)
  if (balance == 0n) {
    await loadFundsToAccount(CONTRACT_ADDRESS, parseEther("0.000001"));
  }

  const type = "General";

  const paymasterParams = getPaymasterParams(PAYMASTER_ADDRESS, {
    type,
    innerInput: getGeneralPaymasterInput({
      type,
      innerInput: "0x", // Any additional info to send to the paymaster
    }),
  });
  // Create a transaction object to send "from" the smart smart contract account
  const transaction = await signer.populateTransaction({
    nonce: nonce, // You may need to change this if you're sending multiple transactions.
    value: parseEther("0.000008"), // Amount of ETH to send
    // to: Wallet.createRandom().address, // As an example, let's send money to another random wallet for our tx.
    to: "0xe6CD15628958c00206b07262E3C1fD8511E14256", // As an example, let's send money to another random wallet for our tx.
    customData: {
      customSignature: "0x69", // Since our contract does no validation, we can put any hex value here. But it is still required.
      paymasterParams
  
    },
  });

  // Broadcast the transaction to the network
  const sentTx = await getProvider().broadcastTransaction(
    serializeEip712(transaction)
  );
  const resp = await sentTx.wait();

  logExplorerUrl(resp.hash, "tx");
}
