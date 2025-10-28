require('dotenv').config();
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
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

    console.log("\n=== DID Update Process ===");
    console.log("Note: You need your DID Address (not Public ID) to update your DID");
    console.log("This is the Ethereum address you used to create the DID");
    
    // Ask for DID address
    const didAddress = await question("\nEnter your DID Address (your Ethereum address): ");
    
    // Verify DID exists and is active
    const isActive = await didManager.isDIDActive(didAddress);
    if (!isActive) {
      console.log("Error: No active DID found for this address.");
      return;
    }

    // Get current DID document for verification
    const currentDoc = await didManager.getDIDDocument(didAddress);
    const parsedCurrentDoc = JSON.parse(currentDoc);

    // Verify ownership through credentials
    console.log("\nPlease verify your credentials:");
    const verifyName = await question("Enter your current name: ");
    const verifyEmail = await question("Enter your current email: ");

    if (verifyName === parsedCurrentDoc.metadata.name && 
        verifyEmail === parsedCurrentDoc.metadata.email) {
        
        console.log("\nCredentials verified successfully!");
        console.log("\nCurrent DID Information:");
        console.log(`Name: ${parsedCurrentDoc.metadata.name}`);
        console.log(`Email: ${parsedCurrentDoc.metadata.email}`);
        console.log(`Organization: ${parsedCurrentDoc.metadata.organization}`);
        console.log(`Role: ${parsedCurrentDoc.metadata.role}`);

        // Get new information
        console.log("\nEnter new DID information:");
        const name = await question("Enter new name (press Enter to keep current): ");
        const email = await question("Enter new email (press Enter to keep current): ");
        const organization = await question("Enter new organization (press Enter to keep current): ");
        const role = await question("Enter new role (press Enter to keep current): ");

        // Create updated DID document (private)
        const updatedDidDocument = JSON.stringify({
          "@context": "https://www.w3.org/ns/did/v1",
          id: `did:polygon:${didAddress}`,
          verificationMethod: [{
            id: `did:polygon:${didAddress}#key1`,
            type: "Ed25519VerificationKey2020",
            controller: `did:polygon:${didAddress}`,
            publicKeyMultibase: "zH3C2AVvLMv6gmMNam3uVAjZpfkcJCwDwnZn6z3wXmqPV"
          }],
          authentication: [`did:polygon:${didAddress}#key1`],
          metadata: {
            name: name || parsedCurrentDoc.metadata.name,
            email: email || parsedCurrentDoc.metadata.email,
            organization: organization || parsedCurrentDoc.metadata.organization,
            role: role || parsedCurrentDoc.metadata.role,
            updated: new Date().toISOString()
          }
        }, null, 2);

        // Create updated public DID document
        const updatedPublicDocument = JSON.stringify({
          "@context": "https://www.w3.org/ns/did/v1",
          metadata: {
            name: name || parsedCurrentDoc.metadata.name,
            organization: organization || parsedCurrentDoc.metadata.organization
          }
        }, null, 2);

        console.log("\nPreparing to update DID with the following information:");
        console.log("\nPrivate Information (only visible to you):");
        console.log(`Name: ${name || parsedCurrentDoc.metadata.name}`);
        console.log(`Email: ${email || parsedCurrentDoc.metadata.email}`);
        console.log(`Organization: ${organization || parsedCurrentDoc.metadata.organization}`);
        console.log(`Role: ${role || parsedCurrentDoc.metadata.role}`);

        console.log("\nPublic Information (visible to everyone):");
        console.log(`Name: ${name || parsedCurrentDoc.metadata.name}`);
        console.log(`Organization: ${organization || parsedCurrentDoc.metadata.organization}`);
        
        const confirm = await question("\nConfirm update? (yes/no): ");
        
        if (confirm.toLowerCase() === 'yes') {
          console.log("\nUpdating DID...");
          const [signer] = await hre.ethers.getSigners();
          const tx = await didManager.connect(signer).updateDID(updatedDidDocument, updatedPublicDocument);
          await tx.wait();
          console.log("DID Updated Successfully!");
          
          // Verify the update
          const newDoc = await didManager.getDIDDocument(didAddress);
          console.log("\nUpdated DID Document:");
          console.log(JSON.parse(newDoc));
        } else {
          console.log("Update cancelled by user.");
        }
    } else {
        console.log("Error: Credential verification failed. Cannot update DID.");
    }

  } catch (error) {
    console.error("Error updating DID:", error);
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
