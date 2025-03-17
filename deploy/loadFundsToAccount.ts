import { getWallet } from "./utils";

/**
 * Simple function to load funds to our smart account so it can pay gas fees to the bootloader.
 */
export default async function (smartAccountAddress: string, amount: bigint) {
  try {
    const wallet = getWallet();

    const tx = await wallet.transfer({
      amount,
      to: smartAccountAddress,
    });
    console.log("Smart contract has no funds. Loaded funds to cover gas fees.");

    return {
      status: true,
      code: 200,
      message: "Successfully loaded funds to smart account",
      data: tx
    };
  } catch (error:any) {
    return {status:false, message: error, code: 500, data: error};

  }
}
