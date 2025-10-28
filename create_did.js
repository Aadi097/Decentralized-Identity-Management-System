require('dotenv').config();
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const readline = require('readline');
const crypto = require('crypto');

// Enhanced logging utility
const logger = {
  log: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    // Write to log file
    const logDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    
    const logFile = path.join(logDir, 'did_creation.log');
    fs.appendFileSync(logFile, logMessage + '\n');
  },
  
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    const errorMessage = `[${timestamp}] ERROR: ${message}`;
    console.error(errorMessage);
    
    // Write to error log file
    const logDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    
    const errorLogFile = path.join(logDir, 'did_creation_errors.log');
    fs.appendFileSync(errorLogFile, errorMessage + '\n');
    
    if (error) {
      fs.appendFileSync(errorLogFile, JSON.stringify(error, null, 2) + '\n');
    }
  }
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promise wrapper for readline
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Generate a random public ID
function generatePublicId() {
  return crypto.randomBytes(4).toString('hex');
}

async function main() {
  try {
    // Log start of process
    logger.log("Starting DID Creation Process");

    // Get user input
    console.log("\n=== DID Creation Process ===");
    const name = await question("Enter your name: ");
    const email = await question("Enter your email: ");
    const organization = await question("Enter your organization: ");
    const role = await question("Enter your role: ");
    
    // Generate a random public ID
    const publicId = generatePublicId();
    
    // Create private DID document (full information)
    const privateDidDocument = JSON.stringify({
      "@context": "https://www.w3.org/ns/did/v1",
      metadata: {
        name: name,
        email: email,
        organization: organization,
        role: role,
        created: new Date().toISOString()
      }
    }, null, 2);

    // Create public DID document (limited information)
    const publicDidDocument = JSON.stringify({
      "@context": "https://www.w3.org/ns/did/v1",
      metadata: {
        name: name,
        organization: organization
      }
    }, null, 2);

    // Get the contract factory
    const DIDManagerFactory = await hre.ethers.getContractFactory("DID_Manager");
    logger.log("DID Manager Contract Factory Created");
    
    // Connect to the deployed contract
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error("CONTRACT_ADDRESS not found in .env file");
    }
    const didManager = DIDManagerFactory.attach(contractAddress);
    logger.log(`Using existing DID Manager Contract at: ${didManager.address}`);

    // Get the signer
    const [signer] = await hre.ethers.getSigners();
    logger.log(`Creating DID for address: ${signer.address}`);

    console.log("\nCreating DID with the following information:");
    console.log(`Public ID: ${publicId}`);
    console.log("\nPublic Information (visible to everyone):");
    console.log(`Name: ${name}`);
    console.log(`Organization: ${organization}`);
    console.log("\nPrivate Information (only visible to you):");
    console.log(`Email: ${email}`);
    console.log(`Role: ${role}`);
    
    const confirm = await question("\nConfirm creation? (yes/no): ");
    
    if (confirm.toLowerCase() === 'yes') {
      console.log("\nCreating DID...");
      const tx = await didManager.createDID(privateDidDocument, publicDidDocument, publicId);
      await tx.wait();
      logger.log(`DID Creation Transaction Hash: ${tx.hash}`);
      logger.log(`DID Creation Block Number: ${tx.blockNumber}`);
      
      console.log("\nDID Created Successfully!");
      console.log("\nYour Private Management Information:");
      console.log("----------------------------------------");
      console.log("DID Address (keep this private, needed for updates):");
      console.log(signer.address);
      
      console.log("\nYour Public Sharing Information:");
      console.log("----------------------------------------");
      console.log("Public ID (share this with others):");
      console.log(publicId);
      
      console.log("\nIMPORTANT:");
      console.log("1. Keep your DID Address private - it's like your password");
      console.log("2. Share your Public ID with others to let them view your public information");
      
      // Save to log file
      const logDir = path.join(__dirname, '..', 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
      }
      
      const logPath = path.join(logDir, 'did_creation.log');
      const logEntry = `
=== DID Created ===
Timestamp: ${new Date().toISOString()}
DID Address: ${signer.address}
Public ID: ${publicId}
Name: ${name}
Organization: ${organization}
==================
`;
      
      fs.appendFileSync(logPath, logEntry);
      console.log(`\nLog saved to: ${logPath}`);
      
    } else {
      console.log("DID creation cancelled by user.");
    }

    // Log successful completion
    logger.log("DID Creation Process Completed Successfully");

  } catch (error) {
    logger.error("Error in DID creation process", error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error("Unhandled error in main process", error);
    process.exit(1);
  });
