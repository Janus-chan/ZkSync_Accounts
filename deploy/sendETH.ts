import { getProvider, logExplorerUrl,getWallet } from "./utils";
import { serializeEip712 } from "zksync-ethers/build/utils";
import { L2VoidSigner, Wallet, Contract } from "zksync-ethers";
import { parseEther } from "ethers";
import loadFundsToAccount from "./loadFundsToAccount";

import {
  getApprovalBasedPaymasterInput,
  getGeneralPaymasterInput,
  getPaymasterParams,
} from "zksync-ethers/build/paymaster-utils";

// Address of the contract to interact with
const PAYMASTER_ADDRESS = "0x286C8350EEA9d48cb9E1Ad7C0a95946C6613Cfc4";
const SMART_CONTRACT_ADDRESS = "0x3114772Bd1f70978f19A753F5551eaBeafC272E9";

/**
 * Interacts with the deployed smart contract account.
 * 
 * This function:
 * 1. Creates a structured object (following EIP-712) that represents the transaction
 * 2. Broadcasts the transaction to the network, where:
 *    - It gets picked up by the bootloader
 *    - The bootloader sends it to the smart contract account
 *    - The smart contract account runs validateTransaction, payForTransaction, and executeTransaction
 */
export async function depositToEscrow(sender:string, amount:string,receiver:string) {  
try {
  const CONTRACT_ADDRESS = sender
  if (!CONTRACT_ADDRESS) {
    throw `⛔️ Provide the address of the contract to interact with.
    You must set the CONTRACT_ADDRESS variable in the interact.ts file to the address of your deployed smart contract account.`;
  }

  console.log(`Running script to interact with contract ${CONTRACT_ADDRESS}`);
  console.log("create fake add ...", Wallet.createRandom().address);

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

  const receiverAddress = receiver;
//   const receiverAddress = "0xe6CD15628958c00206b07262E3C1fD8511E14256";

  const artifact = await import("../ABI/SimpleEscrow.json");
  const escrowContract = new Contract(
    SMART_CONTRACT_ADDRESS, // Address of your deployed SimpleEscrow contract
    artifact.abi,
    provider
  );

  // Encode the function call to deposit with the receiver address
  const encodedData = escrowContract.interface.encodeFunctionData("deposit", [receiverAddress]);
  
  const depositAmount = parseEther(amount);
  
  // Create the transaction
  const transaction = await signer.populateTransaction({
    nonce: nonce,
    value: depositAmount, // This ETH will be sent to the contract function
    to: SMART_CONTRACT_ADDRESS, // Address of the SimpleEscrow contract
    data: encodedData, // Encoded function call
    customData: {
      customSignature: "0x69", // Required for account abstraction
      paymasterParams
    },
  });

  
  let paymasterVlaidatopion= await checkPaymasterBalance(CONTRACT_ADDRESS,transaction);

  if(!paymasterVlaidatopion){
      console.log("paymasterVlaidatopion",paymasterVlaidatopion);
      return {status:false, message: "Paymaster balance is low", code: 400, data: []};

  }

  
  // Broadcast the transaction to the network
  const sentTx = await getProvider().broadcastTransaction(
    serializeEip712(transaction)
  );
  const resp = await sentTx.wait();

  let finalresult = logExplorerUrl(resp.hash, "tx");


  return {status:true, message: "Funds deposited successfully", code: 200, data:{hash :resp.hash,explorerUrl:finalresult} };
} catch (error:any) {
  return {status:false, message: error, code: 500, data: error};
}
}

export async function releaseFunds(sender:string, receiver:string) {
    try {
        const CONTRACT_ADDRESS = sender
        if (!CONTRACT_ADDRESS) {
            throw `⛔️ Provide the address of the contract to interact with.
      You must set the CONTRACT_ADDRESS variable in the interact.ts file to the address of your deployed smart contract account.`;
        }

        console.log(`Running script to interact with contract ${CONTRACT_ADDRESS}`);

        const provider = getProvider();

        // Create a "VoidSigner" setting the account to connect to as the smart contract account.
        // We can use a void signer because our contract doesn't verify any signatures.
        const signer = new L2VoidSigner(CONTRACT_ADDRESS, provider);

        // Get the current nonce of the smart contract account
        const nonce = await signer.getNonce();


        const type = "General";

        const paymasterParams = getPaymasterParams(PAYMASTER_ADDRESS, {
            type,
            innerInput: getGeneralPaymasterInput({
                type,
                innerInput: "0x", // Any additional info to send to the paymaster
            }),
        });

        const receiverAddress = receiver;

        const artifact = await import("../ABI/SimpleEscrow.json");

        const escrowContract = new Contract(
            SMART_CONTRACT_ADDRESS, // Address of your deployed SimpleEscrow contract
            artifact.abi,
            provider
        );

        // Encode the function call to deposit with the receiver address
        const encodedData = escrowContract.interface.encodeFunctionData("releaseFunds", [receiverAddress]);

      console.log("comes after  encodedData: ", encodedData);
        // Create the transaction
        const transaction = await signer.populateTransaction({
            nonce: nonce,
            value: 0n, // This ETH will be sent to the contract function
            to: SMART_CONTRACT_ADDRESS, // Address of the SimpleEscrow contract
            data: encodedData, // Encoded function call
            customData: {
                customSignature: "0x69", // Required for account abstraction
                paymasterParams
            },
        });
        console.log("comes after  transaction OBJECT");

       let paymasterVlaidatopion= await checkPaymasterBalance(CONTRACT_ADDRESS,transaction);

        if(!paymasterVlaidatopion){
            console.log("paymasterVlaidatopion",paymasterVlaidatopion);
            return {status:false, message: "Paymaster balance is low", code: 400, data: []};

        }

        // Broadcast the transaction to the network
        const sentTx = await getProvider().broadcastTransaction(
            serializeEip712(transaction)
        );
        const resp = await sentTx.wait();

        let finalresult = logExplorerUrl(resp.hash, "tx");

        return {status:true, message: "Funds released successfully", code: 200, data:{hash :resp.hash,logs:finalresult} };
      } catch (error:any) {
        return {status:false, message: error, code: 500, data: error};
      }
      
}

export async function refund(sender:string, receiver:string) {
  try {
      const CONTRACT_ADDRESS = sender
      if (!CONTRACT_ADDRESS) {
          throw `⛔️ Provide the address of the contract to interact with.
    You must set the CONTRACT_ADDRESS variable in the interact.ts file to the address of your deployed smart contract account.`;
      }

      console.log(`Running script to interact with contract ${CONTRACT_ADDRESS}`);

      const provider = getProvider();

      // Create a "VoidSigner" setting the account to connect to as the smart contract account.
      // We can use a void signer because our contract doesn't verify any signatures.
      const signer = new L2VoidSigner(CONTRACT_ADDRESS, provider);

      // Get the current nonce of the smart contract account
      const nonce = await signer.getNonce();


      const type = "General";

      const paymasterParams = getPaymasterParams(PAYMASTER_ADDRESS, {
          type,
          innerInput: getGeneralPaymasterInput({
              type,
              innerInput: "0x", // Any additional info to send to the paymaster
          }),
      });

      const receiverAddress = receiver;

      const artifact = await import("../ABI/SimpleEscrow.json");

      const escrowContract = new Contract(
          SMART_CONTRACT_ADDRESS, // Address of your deployed SimpleEscrow contract
          artifact.abi,
          provider
      );

      // Encode the function call to deposit with the receiver address
      const encodedData = escrowContract.interface.encodeFunctionData("refund", [receiverAddress]);

   
      // Create the transaction
      const transaction = await signer.populateTransaction({
          nonce: nonce,
          value: 0n, // This ETH will be sent to the contract function
          to: SMART_CONTRACT_ADDRESS, // Address of the SimpleEscrow contract
          data: encodedData, // Encoded function call
          customData: {
              customSignature: "0x69", // Required for account abstraction
              paymasterParams
          },
      });

     let paymasterVlaidatopion= await checkPaymasterBalance(CONTRACT_ADDRESS,transaction);

      if(!paymasterVlaidatopion){
          
          return {status:false, message: "Paymaster balance is low", code: 400, data: []};

      }

      // Broadcast the transaction to the network
      const sentTx = await getProvider().broadcastTransaction(
          serializeEip712(transaction)
      );
      const resp = await sentTx.wait();

      let finalresult = logExplorerUrl(resp.hash, "tx");

      return {status:true, message: "Funds released successfully", code: 200, data:{hash :resp.hash,logs:finalresult} };
    } catch (error:any) {
      return {status:false, message: error, code: 500, data: error};
    }
    
}



export async function depositToPaymster() {
  try {
    const wallet = getWallet();

    const loadFundsToPaymaster = await (await wallet.sendTransaction({
      to: PAYMASTER_ADDRESS,
      value: parseEther("0.001"), // load 0.001 ETH to the paymaster from your wallet
    })).wait();

    return {
      status: true,
      code: 200,
      message: "Successfully deposited funds to paymaster",
      data: loadFundsToPaymaster
    };

  } catch (error:any) {
    return {
      status: false,
      code: 500,
      message: error.message || "Failed to deposit funds to paymaster",
      data: null
    };
  }
}


export  async function transferETH(sender:string, receiver:string, amount:string) {

  try{

    let CONTRACT_ADDRESS = sender;

  console.log(`Running script to interact with contract ${CONTRACT_ADDRESS}`);

// console.log("create fake add ...",Wallet.createRandom().address);

  const provider = getProvider();

  // Create a "VoidSigner" setting the account to connect to as the smart contract account.
  // We can use a void signer because our contract doesn't verify any signatures.
  const signer = new L2VoidSigner(CONTRACT_ADDRESS, provider);

  // Get the current nonce of the smart contract account
  const nonce = await signer.getNonce();


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
    value: parseEther(amount), // Amount of ETH to send
    // to: Wallet.createRandom().address, // As an example, let's send money to another random wallet for our tx.
    to: receiver, // As an example, let's send money to another random wallet for our tx.
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

  let finalresult = logExplorerUrl(resp.hash, "tx");

  return {status:true, message: "Funds released successfully", code: 200, data:{hash :resp.hash,logs:finalresult} };
} catch (error:any) {
  return {status:false, message: error, code: 500, data: error};
}

}


  async function checkPaymasterBalance(sender :string,transactionRequest:any) {


    const provider = getProvider();

    // Get paymaster balance
    const paymasterBalance = await provider.getBalance(PAYMASTER_ADDRESS);
    console.log(`Paymaster balance: ${paymasterBalance}`);
    
    try {
      // Create a simplified transaction object for gas estimation
      // We need to remove the customData which is specific to zkSync
      const estimateTx = {
        from: sender,
        to: transactionRequest.to,
        data: transactionRequest.data,
        value: transactionRequest.value
      };
      
      // Estimate gas
      const gasEstimate = await provider.estimateGas(estimateTx);
      
      // Get current gas price
      const gasPrice = await provider.getGasPrice();
      
      // Calculate estimated fee
      const estimatedFee = gasEstimate * gasPrice;
      
      console.log(`Estimated gas: ${gasEstimate}`);
      console.log(`Current gas price: ${gasPrice}`);
      console.log(`Estimated transaction fee: ${estimatedFee}`);
      
      // Check if paymaster has enough balance
      if (paymasterBalance < estimatedFee) {
        console.log(`⚠️ WARNING: Paymaster balance (${paymasterBalance}) is lower than the estimated transaction fee (${estimatedFee})`);
        return false;
      } else {
        console.log(`✅ Paymaster has sufficient balance for the transaction`);
        return true;
      }
    } catch (error:any) {
      console.log(`Error estimating gas: ${error.message}`);
      console.log(`Cannot accurately determine if paymaster has sufficient balance`);
      return false; // Continue with transaction anyway
    }
  }


