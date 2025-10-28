const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DID_Manager", function () {
  let didManager;
  let owner;
  let addr1;

  beforeEach(async function () {
    // Get the ContractFactory and Signers
    const DIDManagerFactory = await ethers.getContractFactory("DID_Manager");
    [owner, addr1] = await ethers.getSigners();

    // Deploy the contract
    didManager = await DIDManagerFactory.deploy();
    await didManager.deployed();
  });

  it("Should create a new DID", async function () {
    const didDocument = JSON.stringify({
      id: "did:example:123456",
      verificationMethod: []
    });

    await didManager.connect(addr1).createDID(didDocument);
    
    expect(await didManager.isDIDActive(addr1.address)).to.be.true;
    expect(await didManager.getDIDDocument(addr1.address)).to.equal(didDocument);
  });

  it("Should not allow creating duplicate DIDs", async function () {
    const didDocument = JSON.stringify({
      id: "did:example:123456",
      verificationMethod: []
    });

    await didManager.connect(addr1).createDID(didDocument);
    
    await expect(
      didManager.connect(addr1).createDID(didDocument)
    ).to.be.revertedWith("DID already exists for this address");
  });

  it("Should update an existing DID", async function () {
    const initialDidDocument = JSON.stringify({
      id: "did:example:123456",
      verificationMethod: []
    });

    const updatedDidDocument = JSON.stringify({
      id: "did:example:123456",
      verificationMethod: ["new method"]
    });

    await didManager.connect(addr1).createDID(initialDidDocument);
    await didManager.connect(addr1).updateDID(updatedDidDocument);
    
    expect(await didManager.getDIDDocument(addr1.address)).to.equal(updatedDidDocument);
  });

  it("Should deactivate a DID", async function () {
    const didDocument = JSON.stringify({
      id: "did:example:123456",
      verificationMethod: []
    });

    await didManager.connect(addr1).createDID(didDocument);
    await didManager.connect(addr1).deactivateDID();
    
    expect(await didManager.isDIDActive(addr1.address)).to.be.false;
  });
});
