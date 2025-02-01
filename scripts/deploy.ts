import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const GameToken = await ethers.getContractFactory("GameToken");
  const gameToken = await GameToken.deploy();
  await gameToken.waitForDeployment();

  const address = await gameToken.getAddress();
  console.log("GameToken deployed to:", address);

  // Verify contract on Etherscan for non-local networks
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await gameToken.deploymentTransaction()?.wait(6);
    
    console.log("Verifying contract...");
    await run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });