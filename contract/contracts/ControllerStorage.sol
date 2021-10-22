// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

/**
 * @title ControllerStorage
 * @dev This contract is controller storage implementation
 */
contract ControllerStorage {
    // The status of proposal
    enum Status {Voting, Over, Unknown}

    struct Workspace {
        uint256 id; // The id of the Workspace
        uint256 pros; // The maximum id of existing proposals
        uint256 votingToken; // The ERC20 token address used for voting
        bytes additionalData; // The additional data for the Workspace
    }

    struct Proposal {
        uint256 id; // The id of the proposal
        Status status; // The status of the proposal
        address author; // The author of the proposal
        uint64 start; // The start time of the proposal
        uint64 end; // The end time of the proposal
        uint256 snapshot; // The specified height for vote
        bytes data; // The proposal information, maybe store in IPFS
        uint256[] options; // The voting result
    }

    //  ID data structure definition:
    //
    //  | -------   uint  ---------- |
    //  |     *     |    20 bit      |
    //  | spaceId   |    subId       |
    //  |         proposalId         |
    //
    //  A ProposalId consists of spaceId and subId.
    //  So it support up to 1048575 proposal in each space.
    //
    //  ID distribution example:
    //  The workspace id is 1 << 20:
    //  The proposal A id is 1 << 20 + 1;
    //  The proposal B id is 1 << 20 + 2;
    uint256 internal BaseSpace = 1 << 20;
    uint256 public currentSpace;

    mapping(uint256 => Workspace) public workspaces; // The created workspaces
    mapping(uint256 => Proposal) public proposals;
    mapping(address => bool) public finalizers;

    mapping(address => bool) public admins; // admin given privileges to reset a workspace or the entire app.
    bool internal adminsAssigned; // set true, and the owner can no longer assigns new admins.
}
