# Decentralized Identity (DID) Management System

A blockchain-based DID management system built using Ethereum smart contracts and Hardhat.

## Understanding DID Identifiers

The system uses two types of identifiers:

1. **DID Address** (Private)
   - This is your Ethereum wallet address
   - Keep this private - it's like your password
   - Used for managing your DID (updates, deactivation)
   - Never share this with others

2. **Public ID** (Shareable)
   - A short, readable identifier (e.g., "a1b2c3d4")
   - Generated when you create your DID
   - Share this with others so they can view your public information
   - Safe to share publicly

Think of it like a house:
- DID Address = Your house key (keep private)
- Public ID = Your house number (share publicly)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start local Hardhat node:
```bash
npx hardhat node
```

3. Deploy contract and set up environment:
```bash
npx hardhat run scripts/set_contract.js --network localhost
```

## DID Management Workflow

### 1. Create DID
```bash
npx hardhat run scripts/create_did.js --network localhost
```
- Enter your credentials (name, email, organization, role)
- System generates your Public ID
- Save both your DID Address and Public ID
- Share only your Public ID with others

### 2. View DID Information

Public View (for everyone):
```bash
npx hardhat run scripts/view_did.js --network localhost
```
- Choose option 1 (Public View)
- Enter the Public ID
- Shows:
  - Name
  - Organization
  - Active Status

Private View (only for DID owner):
```bash
npx hardhat run scripts/view_did.js --network localhost
```
- Choose option 2 (Private View)
- Shows all information:
  - Name, Email, Organization, Role
  - Creation and Update dates
  - Public ID
  - Status

### 3. Update DID
```bash
npx hardhat run scripts/update_did.js --network localhost
```
1. Enter your DID Address (not Public ID)
2. Verify ownership with current credentials
3. Enter new information (press Enter to keep current values)
4. Confirm changes

### 4. Deactivate DID
```bash
npx hardhat run scripts/deactivate_did.js --network localhost
```
1. Enter your DID Address (not Public ID)
2. Verify ownership with current credentials
3. Review DID information
4. Confirm deactivation (this action cannot be undone)

## Privacy Levels

### Public Information (visible to anyone with Public ID)
- Name
- Organization
- Active Status

### Private Information (only visible to DID owner)
- Email
- Role
- Creation Date
- Last Update Date
- All other DID details

## Security Features

- Two-level identification system (DID Address and Public ID)
- Credential verification required for updates and deactivation
- Private information only accessible to DID owner
- Confirmation required for important actions
- Active status verification
- Timestamp tracking for all changes

## Project Structure

- `contracts/` - Smart contract implementation
- `scripts/` - Management scripts for DID operations
  - `create_did.js` - DID creation
  - `view_did.js` - View DID information (public/private)
  - `update_did.js` - Update DID credentials
  - `deactivate_did.js` - Deactivate DID
  - `deploy.js` - Local deployment
  - `set_contract.js` - Contract setup
