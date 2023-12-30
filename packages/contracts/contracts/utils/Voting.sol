// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IVoting} from "./IVoting.sol";

/// @title Voting Contract
/// @dev This contract allows users to vote for candidates.
contract Voting is IVoting {
    /// @dev Mapping from node ID to Node.
    mapping(uint256 => Node) public list;

    /// @dev Mapping from candidate address to node ID.
    mapping(address => uint256) public addressToNodeId;

    /// @dev ID of the head node in the list.
    uint256 public head;

    /// @dev ID of the tail node in the list.
    uint256 public tail;

    /// @dev Next available node ID.
    uint256 public nextId = 1;

    /// @dev Address of the first candidate with zero votes.
    address public firstZeroVoteAddress;

    /// @dev Cast a vote for a recipient.
    /// @param recipient The address of the recipient.
    /// @param voteCount The number of votes to cast.
    function castVote(address recipient, uint256 voteCount) external {
        _castVote(recipient, voteCount);
    }

    /// @dev Cast a vote for a recipient.
    /// @param recipient The address of the recipient.
    /// @param voteCount The number of votes to cast.
    function _castVote(address recipient, uint256 voteCount) internal {
        uint256 nodeId = addressToNodeId[recipient];
        if (nodeId != 0) {
            Node storage existingNode = list[nodeId];
            existingNode.votes += voteCount;

            emit NodeUpdated(nodeId, existingNode.votes);

            reorderExistingNodes(existingNode, nodeId);
        } else {
            addNewNode(recipient, voteCount);
        }
    }

    /// @dev Reorder existing nodes based on votes.
    /// @param existingNode Reference to existing Node.
    /// @param nodeId ID of the existing Node.
    function reorderExistingNodes(
        Node storage existingNode,
        uint256 nodeId
    ) internal {
        while (
            existingNode.prev != 0 &&
            list[existingNode.prev].votes < existingNode.votes
        ) {
            uint256 prevId = existingNode.prev;
            Node storage prevNode = list[prevId];
            if (existingNode.prev == head) {
                head = nodeId;
            }
            swapNodes(existingNode, prevNode, nodeId, prevId);
            emit NodesSwapped(nodeId, prevId);
        }
    }

    /// @dev Add a new node in a sorted position.
    /// @param recipient The address of the new recipient.
    /// @param voteCount The number of votes for the new recipient.
    function addNewNode(address recipient, uint256 voteCount) internal {
        Node memory newNode = Node({
            votes: voteCount,
            recipient: recipient,
            prev: 0,
            next: 0
        });
        uint256 currentId = head;
        uint256 prevId = 0;
        while (currentId != 0 && list[currentId].votes >= voteCount) {
            prevId = currentId;
            currentId = list[currentId].next;
        }
        newNode.prev = prevId;
        newNode.next = currentId;
        list[nextId] = newNode;
        addressToNodeId[recipient] = nextId;

        emit NewNodeAdded(nextId, recipient, voteCount);

        if (prevId != 0) {
            list[prevId].next = nextId;
        } else {
            head = nextId;
            // Update firstZeroVoteAddress if this is the first node with zero votes
            if (voteCount == 0 && firstZeroVoteAddress == address(0)) {
                firstZeroVoteAddress = recipient;
            }
        }
        if (currentId != 0) {
            list[currentId].prev = nextId;
        } else {
            tail = nextId;
        }
        nextId++;
    }

    /// @dev Swap two nodes to maintain the sorted order.
    /// @param nodeA Reference to the first Node.
    /// @param nodeB Reference to the second Node.
    /// @param idA ID of the first Node.
    /// @param idB ID of the second Node.
    function swapNodes(
        Node storage nodeA,
        Node storage nodeB,
        uint256 idA,
        uint256 idB
    ) internal {
        nodeA.prev = nodeB.prev;
        nodeB.next = nodeA.next;
        if (nodeA.prev != 0) {
            list[nodeA.prev].next = idA;
        }
        if (nodeB.next != 0) {
            list[nodeB.next].prev = idB;
        }
        (nodeA.next, nodeB.next) = (idB, nodeA.next);
        (nodeA.prev, nodeB.prev) = (nodeB.prev, idA);
    }

    /// @notice Retrieve a list of candidates in order of votes.
    /// @dev This function supports pagination.
    /// @param pageSize Number of candidates per page.
    /// @param page Page number to retrieve.
    /// @return An array of Result structs.
    function getCandidatesInOrder(
        uint256 pageSize,
        uint256 page
    ) public view returns (Result[] memory) {
        require(pageSize > 0, "PageSize must be greater than zero");
        require(page > 0, "Page must be greater than zero");
        Result[] memory result = new Result[](pageSize);
        uint256 currentId = head;
        uint256 index = 0;
        uint256 startIndex = (page - 1) * pageSize;
        uint256 endIndex = startIndex + pageSize;
        while (currentId != 0 && index < endIndex) {
            if (index >= startIndex) {
                result[index - startIndex] = Result({
                    recipient: list[currentId].recipient,
                    votes: list[currentId].votes
                });
            }
            currentId = list[currentId].next;
            index++;
        }
        return result;
    }

    /// @notice Retrieve the total number of nodes.
    /// @return Total number of nodes.
    function getTotalNodeCount() public view returns (uint256) {
        return nextId - 1;
    }

    /// @notice Check if an address has received any votes.
    /// @param addr The address to check.
    /// @return True if the address has received votes, false otherwise.
    function hasReceivedVotes(address addr) public view returns (bool) {
        return
            addressToNodeId[addr] != 0 && list[addressToNodeId[addr]].votes > 0;
    }

    /// @notice Get the position of a node based on the recipient's address.
    /// @param addr The address of the recipient.
    /// @return The position of the node (0 if not found or no votes).
    function getPositionByAddress(address addr) public view returns (uint256) {
        if (!hasReceivedVotes(addr)) {
            return 0; // Address not found or no votes
        }
        uint256 currentId = head;
        uint256 position = 0;
        while (currentId != 0) {
            if (list[currentId].recipient == addr) {
                return position;
            }
            currentId = list[currentId].next;
            position++;
        }
        return 0; // Address not found
    }

    /// @notice Retrieve the number of votes for a given address.
    /// @param addr The address of the recipient.
    /// @return The number of votes received by the address.
    function getVotes(address addr) public view returns (uint256) {
        uint256 nodeId = addressToNodeId[addr];
        if (nodeId == 0) {
            // Address has not received any votes or is not registered
            return 0;
        }
        return list[nodeId].votes;
    }

    // Additional function in the Voting contract to get the recipient of a node by index
    function getNodeRecipient(uint256 index) external view returns (address) {
        return list[index].recipient;
    }

    function getNodeRecipientByIndex(
        uint256 index
    ) public view returns (address) {
        uint256 currentId = head;
        uint256 currentIndex = 0;

        while (currentId != 0 && currentIndex < index) {
            currentId = list[currentId].next;
            currentIndex++;
        }

        if (currentId != 0 && currentIndex == index) {
            return list[currentId].recipient;
        } else {
            return address(0); // Return zero address if index is out of bounds
        }
    }

function calculatePointFromPercentage(uint256 percentage, bool roundUp) public view returns (uint256) {
    require(percentage >= 0 && percentage <= 100, "Percentage must be between 0 and 100");
    uint256 totalNodes = getTotalNodeCount();
    if (totalNodes == 0) {
        return 0; // List is empty
    }

    uint256 position;
    if (percentage == 0) {
        position = 0; // Always return the first node for 0%
    } else if (percentage == 100) {
        position = totalNodes - 1; // Always return the last node for 100%
    } else {
        position = (totalNodes * percentage) / 100;
        if (roundUp && (totalNodes * percentage) % 100 > 0) {
            position = (position < totalNodes - 1) ? position + 1 : position;
        }
    }

    return getNodeAtPosition(position);
}



    /// @notice Get the node ID at a specific position in the list.
    /// @param position The position in the list.
    /// @return The ID of the node at the given position.
function getNodeAtPosition(uint256 position) internal view returns (uint256) {
    uint256 currentId = head;
    for (uint256 i = 0; i < position && currentId != 0; i++) {
        currentId = list[currentId].next;
    }
    return currentId;
}


    /// @notice Update the head and tail of the list.
    /// @param newHead The new head of the list.
    /// @param newTail The new tail of the list.
    function updateHeadAndTail(uint256 newHead, uint256 newTail) external {
        require(newHead <= newTail, "New head must be before new tail");
        require(
            newHead >= 0 && newTail < nextId,
            "Head and tail must be within list bounds"
        );
        head = newHead;
        tail = newTail;
    }

    function getCandidateVotes(
        address candidateAddress
    ) public view returns (uint256) {
        uint256 nodeId = addressToNodeId[candidateAddress];
        if (nodeId == 0) {
            return 0; // Candidate not found
        }
        return list[nodeId].votes;
    }

    function getCandidateStatus(
        address candidateAddress
    ) public view returns (CandidateStatus) {
        uint256 nodeId = addressToNodeId[candidateAddress];
        if (nodeId == 0) {
            return CandidateStatus.UNREGISTERED;
        }

        if (nodeId < head || nodeId > tail) {
            return CandidateStatus.ELIMINATED;
        }

        return CandidateStatus.ACTIVE;
    }

    //TBD if I need this
    function resetFirstZeroVoteAddress() private {
        firstZeroVoteAddress = address(0);
    }
}
