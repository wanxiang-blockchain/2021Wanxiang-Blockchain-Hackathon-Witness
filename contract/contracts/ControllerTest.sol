// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import './ControllerStorage.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

/**
 * @title Controller
 * @dev This contract is controller logic implementation
 */
contract ControllerTest is ControllerStorage, OwnableUpgradeable {
    modifier onlyValidator {
        require(finalizers[msg.sender], 'Only Geodes can call this function.');
        _;
    }

    event CreateWorkspace(uint256 indexed id);
    event CreateProposal(uint256 indexed id);
    event CloseProposal(uint256 indexed id);

    function initialize() public initializer {
        currentSpace = 0;
        BaseSpace = 1 << 20;
        adminsAssigned = false;
        __Ownable_init();
    }

    function addWorkspace(uint256 token, bytes memory data)
        public
        returns (uint256)
    {
        uint256 space = _nextSpace();

        Workspace memory workspace =
            Workspace({
                id: space,
                pros: space,
                votingToken: token,
                additionalData: data
            });
        workspaces[space] = workspace;

        emit CreateWorkspace(space);
        currentSpace = space;

        return space;
    }

    function resetSpace() public onlyOwner {
        currentSpace = 0;
    }

    function addProposal(
        uint256 space,
        uint64 start,
        uint64 end,
        uint256 snapshot,
        bytes memory data
    ) public returns (uint256) {
        require(space >= BaseSpace && space <= currentSpace, 'Unexpect space.');

        Workspace storage workspace = workspaces[space];

        require(workspace.id != 0, 'unexpect workspace id');

        uint256 id = workspace.pros + 1;
        workspace.pros = id;

        // Unique Proposal IDs is made of [workspace_id || proposal_id]
        //                                     236            20
        // Ensure that the proposal_id can be represented in 20bits
        require(
            (workspace.pros - workspace.id) < BaseSpace,
            'invalid proposal Id'
        );

        Proposal memory proposal =
            Proposal({
                id: id,
                status: Status.Voting,
                author: msg.sender,
                start: start,
                end: end,
                snapshot: snapshot,
                data: data,
                options: new uint256[](0)
            });

        proposals[id] = proposal;

        emit CreateProposal(space);
    }

    function addFinalizer(address id) public onlyOwner {
        finalizers[id] = true;
    }

    function removeFinalizer(address id) public onlyOwner {
        delete finalizers[id];
    }

    function submitVotes(uint256 id, uint256[] memory options)
        public
        onlyValidator
    {
        Proposal storage proposal = proposals[id];

        require(proposal.id != 0, 'unexpect proposal id');

        proposal.options = options;
        proposal.status = Status.Over;

        emit CloseProposal(id);
    }

    function getProposalOptions(uint256 id)
        public
        view
        returns (uint256[] memory)
    {
        return proposals[id].options;
    }

    function _nextSpace() internal view returns (uint256) {
        return currentSpace + BaseSpace;
    }

    modifier onlyAdmin() {
        require(
            admins[msg.sender],
            'Permission denied. You do not have admin privileges.'
        );
        _;
    }

    modifier resetEnabled() {
        require(!adminsAssigned, 'Assigning new admin is no longer allowed');
        _;
    }

    /**
     * Function to assign an address to be given admin privilege to wipe a workspace.
     * @param _admin - the recipient address to be assigned erase privilege
     */
    function addAdmin(address _admin) public onlyOwner resetEnabled() {
        admins[_admin] = true;
    }

    /**
     * Function to erase the entire workspace (and all of its proposals).
     */
    function eraseWorkSpace(uint256 _space) public onlyAdmin() resetEnabled() {
        require(_space >= BaseSpace && _space <= currentSpace, 'Invalid space');
        uint256 size = workspaces[_space].pros;
        if (size > _space) {
            for (uint256 i = _space + 1; i <= size; i++) {
                delete proposals[i];
            }
        }
        delete workspaces[_space];
    }

    /**
     * Resets the entire app, wipes all workspaces and proposals.
     * NOTE: This function call can become very expensive.
     */
    function resetApp() public onlyAdmin() resetEnabled() {
        uint256 size = currentSpace / BaseSpace;
        if (size > 0) {
            for (uint256 i = 1; i <= size; i++) {
                uint256 currentSpace = i << 20;
                eraseWorkSpace(currentSpace);
            }
        }
        currentSpace = 0;
    }

    /**
     * Revoke admin privilege given by address, then permanently kills the reset feature.
     */
    function revokeAdmin(address _admin) public onlyOwner {
        require(admins[_admin], 'input address is not admin');
        admins[_admin] = false;

        // kill reset feature.
        adminsAssigned = true;
    }

    // Test upgrade
    function test() public view returns (string memory) {
        return 'Hello, Test!';
    }
}
