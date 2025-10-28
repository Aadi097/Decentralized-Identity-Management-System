const fs = require('fs');
const path = require('path');

async function main() {
    // Deploy the contract
    const DIDManager = await ethers.getContractFactory("DID_Manager");
    console.log("Deploying DID_Manager...");
    const didManager = await DIDManager.deploy();
    await didManager.deployed();
    console.log("DID_Manager deployed to:", didManager.address);

    // Create or update .env file
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = `CONTRACT_ADDRESS=${didManager.address}\n`;
    
    fs.writeFileSync(envPath, envContent);
    console.log("Contract address saved to .env file");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
