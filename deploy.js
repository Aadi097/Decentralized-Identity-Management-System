const hre = require("hardhat");

async function main() {
  // Get the contract factory for DID_Manager
  const DIDManagerFactory = await hre.ethers.getContractFactory("DID_Manager");
  
  // Deploy the contract
  const didManager = await DIDManagerFactory.deploy();
  
  // Wait for the contract to be deployed
  await didManager.deployed();
  
  console.log("DID Manager deployed to:", didManager.address);
}

// Recommended pattern to handle async errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
