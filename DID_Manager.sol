// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract DID_Manager is Ownable, ReentrancyGuard {
    // Struct to represent a Decentralized Identity
    struct DecentralizedIdentity {
        address owner;
        string didDocument;      // Full DID document (private)
        string publicDocument;   // Public DID document
        string publicId;         // Public identifier
        uint256 createdAt;
        uint256 updatedAt;
        bool isActive;
    }

    // Mappings
    mapping(address => DecentralizedIdentity) private identities;
    mapping(string => address) private publicIdToAddress;    // Map public ID to address
    mapping(address => bool) public didExists;

    // Events
    event DIDCreationAttempted(
        address indexed attemptedBy, 
        bool success, 
        string reason
    );

    event DIDCreated(
        address indexed owner,
        string publicId,
        uint256 createdAt
    );

    event DIDUpdated(
        address indexed owner,
        string publicId,
        uint256 updatedAt
    );

    event DIDDeactivationAttempted(
        address indexed owner, 
        bool success, 
        string reason
    );

    event DIDDeactivated(
        address indexed owner, 
        uint256 deactivatedAt
    );

    // Modifiers
    modifier onlyDIDOwner(address _address) {
        require(
            identities[_address].owner == msg.sender,
            "Only DID owner can perform this action"
        );
        _;
    }

    modifier didActive(address _address) {
        require(
            identities[_address].isActive,
            "DID is not active"
        );
        _;
    }

    // Create a new DID
    function createDID(string memory _didDocument, string memory _publicDocument, string memory _publicId) 
        external 
        nonReentrant 
    {
        require(!didExists[msg.sender], "DID already exists for this address");
        require(publicIdToAddress[_publicId] == address(0), "Public ID already in use");
        
        identities[msg.sender] = DecentralizedIdentity({
            owner: msg.sender,
            didDocument: _didDocument,
            publicDocument: _publicDocument,
            publicId: _publicId,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isActive: true
        });

        didExists[msg.sender] = true;
        publicIdToAddress[_publicId] = msg.sender;

        emit DIDCreated(msg.sender, _publicId, block.timestamp);
    }

    // Update DID
    function updateDID(string memory _newDidDocument, string memory _newPublicDocument) 
        external 
        nonReentrant 
        didActive(msg.sender) 
        onlyDIDOwner(msg.sender) 
    {
        DecentralizedIdentity storage did = identities[msg.sender];
        did.didDocument = _newDidDocument;
        did.publicDocument = _newPublicDocument;
        did.updatedAt = block.timestamp;

        emit DIDUpdated(msg.sender, did.publicId, block.timestamp);
    }

    // Deactivate DID
    function deactivateDID() 
        external 
        nonReentrant 
        didActive(msg.sender) 
        onlyDIDOwner(msg.sender) 
    {
        identities[msg.sender].isActive = false;
        emit DIDDeactivated(msg.sender, block.timestamp);
    }

    // View full DID document (private - only owner)
    function getDIDDocument(address _address) 
        external 
        view 
        returns (string memory) 
    {
        require(msg.sender == _address, "Only DID owner can view full document");
        return identities[_address].didDocument;
    }

    // View public DID document (anyone can view)
    function getPublicDIDDocument(string memory _publicId) 
        external 
        view 
        returns (string memory) 
    {
        address didAddress = publicIdToAddress[_publicId];
        require(didAddress != address(0), "Public ID not found");
        require(identities[didAddress].isActive, "DID is not active");
        return identities[didAddress].publicDocument;
    }

    // Get DID details
    function getDIDDetails(address _address) 
        external 
        view 
        returns (uint256 createdAt, uint256 updatedAt, bool isActive, string memory publicId) 
    {
        require(didExists[_address], "DID does not exist");
        DecentralizedIdentity storage did = identities[_address];
        return (did.createdAt, did.updatedAt, did.isActive, did.publicId);
    }

    // Check if DID is active
    function isDIDActive(address _address) external view returns (bool) {
        return identities[_address].isActive;
    }

    // Get address by public ID
    function getAddressByPublicId(string memory _publicId) 
        external 
        view 
        returns (address) 
    {
        return publicIdToAddress[_publicId];
    }
}
