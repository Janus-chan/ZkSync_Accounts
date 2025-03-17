import { deployContract } from "./utils";

export default async function () {


  try {
    const contractArtifactName = "BasicAccount";
    let result = await deployContract(contractArtifactName, "createAccount");

    console.log("testing for jan smart contract", result);
    return {status:true, message: "smart contract wallet created successfully", code: 200, data: result.target};

    
  } catch (error) {
    return {status:false, message: "Error deploying smart contract", code: 500 };
  }

}
