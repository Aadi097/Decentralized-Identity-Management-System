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

    console.log("\n=== DID Viewer ===");
    console.log("1. View Public DID (using Public ID)");
    console.log("2. View Private DID (requires DID Address)");
    
    const choice = await question("\nEnter your choice (1 or 2): ");

    if (choice === "1") {
      // Public View
      const publicId = await question("Enter the Public ID to view: ");
      
      try {
        const publicDoc = await didManager.getPublicDIDDocument(publicId);
        const parsedDoc = JSON.parse(publicDoc);
        
        // Get address and active status
        const associatedAddress = await didManager.getAddressByPublicId(publicId);
        const isActive = await didManager.isDIDActive(associatedAddress);
        
        console.log("\n=== Public DID Information ===");
        console.log(`Name: ${parsedDoc.metadata.name}`);
        console.log(`Organization: ${parsedDoc.metadata.organization}`);
        console.log(`Status: ${isActive ? 'Active' : 'Inactive'}`);
      } catch (error) {
        console.log("\nError: Could not find DID with this Public ID or DID is inactive");
      }
      
    } else if (choice === "2") {
      // Private View (Full DID Document)
      console.log("\nNote: You need your DID Address to view private information");
      console.log("This is the Ethereum address you used to create the DID");
      const didAddress = await question("\nEnter your DID Address: ");
      
      try {
        // First verify that this DID exists and is active
        const isActive = await didManager.isDIDActive(didAddress);
        if (!isActive) {
          console.log("\nError: No active DID found for this address");
          return;
        }

        // Verify ownership by checking if the signer matches the DID address
        const [signer] = await hre.ethers.getSigners();
        if (signer.address.toLowerCase() !== didAddress.toLowerCase()) {
          console.log("\nError: You don't have permission to view this DID's private information");
          console.log("The DID Address must match your current Ethereum address");
          return;
        }
        
        const didDocument = await didManager.getDIDDocument(didAddress);
        const details = await didManager.getDIDDetails(didAddress);
        const parsedDoc = JSON.parse(didDocument);
        
        console.log("\n=== Private DID Information ===");
        console.log("Personal Information:");
        console.log(`Name: ${parsedDoc.metadata.name}`);
        console.log(`Email: ${parsedDoc.metadata.email}`);
        console.log(`Organization: ${parsedDoc.metadata.organization}`);
        console.log(`Role: ${parsedDoc.metadata.role}`);
        
        console.log("\nDID Status:");
        console.log(`Public ID: ${details.publicId}`);
        console.log(`Created: ${new Date(details.createdAt * 1000).toLocaleString()}`);
        console.log(`Last Updated: ${new Date(details.updatedAt * 1000).toLocaleString()}`);
        console.log(`Status: ${details.isActive ? 'Active' : 'Inactive'}`);
      } catch (error) {
        console.log("\nError: Could not find DID for your address or you don't have permission to view it");
      }
    } else {
      console.log("Invalid choice");
    }

  } catch (error) {
    console.error("Error viewing DID:", error);
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
