require('dotenv').config();
const hre = require("hardhat");
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promise wrapper for readline
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  try {
    // Get the contract factory
    const DIDManagerFactory = await hre.ethers.getContractFactory("DID_Manager");
    
    // Connect to the deployed contract
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const didManager = DIDManagerFactory.attach(contractAddress);

    console.log("\n=== DID Deactivation Process ===");
    
    // Ask for DID address
    const didAddress = await question("Enter the DID address you want to deactivate: ");
    
    // Verify DID exists and is active
    const isActive = await didManager.isDIDActive(didAddress);
    if (!isActive) {
      console.log("Error: No active DID found for this address.");
      return;
    }

    // Get current DID document for verification
    const didDocument = await didManager.getDIDDocument(didAddress);
    const parsedDoc = JSON.parse(didDocument);
    
    // Verify ownership through credentials
    console.log("\nPlease verify your credentials:");
    const verifyName = await question("Enter your name: ");
    const verifyEmail = await question("Enter your email: ");

    if (verifyName === parsedDoc.metadata.name && 
        verifyEmail === parsedDoc.metadata.email) {
        
        console.log("\nCredentials verified successfully!");
        console.log("\nDID Information to be deactivated:");
        console.log(`Name: ${parsedDoc.metadata.name}`);
        console.log(`Email: ${parsedDoc.metadata.email}`);
        console.log(`Organization: ${parsedDoc.metadata.organization}`);
        console.log(`Role: ${parsedDoc.metadata.role}`);
        
        const confirm = await question("\nAre you sure you want to deactivate this DID? This cannot be undone. (yes/no): ");
        
        if (confirm.toLowerCase() === 'yes') {
            console.log("\nDeactivating DID...");
            const [signer] = await hre.ethers.getSigners();
            const tx = await didManager.connect(signer).deactivateDID();
            await tx.wait();
            console.log("DID Successfully Deactivated!");
            
            // Verify deactivation
            const newStatus = await didManager.isDIDActive(didAddress);
            console.log(`\nFinal Status: ${newStatus ? 'Active' : 'Inactive'}`);
        } else {
            console.log("Deactivation cancelled by user.");
        }
    } else {
        console.log("Error: Credential verification failed. Cannot deactivate DID.");
    }

  } catch (error) {
    console.error("Error deactivating DID:", error);
  } finally {
    rl.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
