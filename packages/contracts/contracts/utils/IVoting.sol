// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IVoting Interface
/// @dev Interface for the Voting Contract
interface IVoting {

    enum CandidateStatus { UNREGISTERED, ACTIVE, ELIMINATED }

    /// @notice Event emitted when a new node is added.
    event NewNodeAdded(
        uint256 indexed nodeId,
        address recipient,
        uint256 votes   
    );

    /// @notice Event emitted when a node is updated.
    event NodeUpdated(uint256 indexed nodeId, uint256 newVotes);

    /// @notice Event emitted when nodes are swapped.
    event NodesSwapped(uint256 indexed nodeIdA, uint256 indexed nodeIdB);

    /// @notice Struct representing a voting node.
    struct Node {
        uint256 votes; ///< Number of votes.
        address recipient; ///< Candidate's address.
        uint256 prev; ///< ID of the previous node.
        uint256 next; ///< ID of the next node.
    }

    /// @notice Struct representing a voting result.
    struct Result {
        address recipient; ///< Candidate's address.
        uint256 votes; ///< Number of votes.
    }

    /// @notice Cast a vote for a recipient.
    /// @param recipient The address of the recipient.
    /// @param voteCount The number of votes to cast.
    function castVote(address recipient, uint256 voteCount) external;

    /// @notice Retrieve a list of candidates in order of votes.
    /// @param pageSize Number of candidates per page.
    /// @param page Page number to retrieve.
    /// @return An array of Result structs.
    function getCandidatesInOrder(
        uint256 pageSize,
        uint256 page
    ) external view returns (Result[] memory);

    /// @notice Retrieve the total number of nodes.
    /// @return Total number of nodes.
    function getTotalNodeCount() external view returns (uint256);

    /// @notice Check if an address has received any votes.
    /// @param addr The address to check.
    /// @return True if the address has received votes, false otherwise.
    function hasReceivedVotes(address addr) external view returns (bool);

    /// @notice Get the position of a node based on the recipient's address.
    /// @param addr The address of the recipient.
    /// @return The position of the node (0 if not found or no votes).
    function getPositionByAddress(address addr) external view returns (uint256);

    /// @notice Retrieve the number of votes for a given address.
    /// @param addr The address of the recipient.
    /// @return The number of votes received by the address.
    function getVotes(address addr) external view returns (uint256);

    /// @notice Get the recipient of a node by index.
    /// @param index The index of the node.
    /// @return The address of the recipient.
    function getNodeRecipient(uint256 index) external view returns (address);
}
