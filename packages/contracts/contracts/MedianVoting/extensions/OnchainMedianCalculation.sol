// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { MedianVote } from "../MedianVote.sol";
import { MedianVoteBase } from "../MedianVoteBase.sol";

contract OnchainMedianCalculation is MedianVote {
    // State variables to store votes for each round
    mapping(uint256 => uint256[]) private votesPerRound;

    // Constructor to initialize the inherited contract
    function initialize(uint256 roundDuration, uint256 roundDelay) override initializer public{
        MedianVoteBase.__MedianVoteBaseInit(roundDuration, roundDelay);
    }

    // Override castVote to track votes
    function castVote(address candidate, uint256 voteAmount) public override payable {
        // Track the vote for the current round
        uint256 currentRoundIndex = getCurrentRoundIndex();
        votesPerRound[currentRoundIndex].push(voteAmount);

        // Call the inherited castVote
        super.castVote(candidate, voteAmount);
    }

    // Override finalizeRound to compute the median on-chain
    function finalizeRound(uint256 /* threshold */) public override payable {
        // Compute the median value for the current round
        uint256 currentRoundIndex = getCurrentRoundIndex();
        uint256 computedMedian = computeMedian(currentRoundIndex);

        // Call the inherited finalizeRound with the computed median
        super.finalizeRound(computedMedian);
    }

    // Utility function to compute median
    function computeMedian(uint256 roundIndex) internal view returns (uint256) {
        uint256[] memory roundVotes = votesPerRound[roundIndex];
        uint256 numVotes = roundVotes.length;

        // Sorting algorithm (e.g., QuickSort, MergeSort) should be applied to roundVotes
        // Since Solidity doesn't have a native sorting function, you'll need to implement one
        // ...

        uint256 median;
        if (numVotes % 2 == 1) {
            // Odd number of votes
            median = roundVotes[numVotes / 2];
        } else {
            // Even number of votes, take the average of the two middle values
            uint256 midIndex = numVotes / 2;
            median = (roundVotes[midIndex - 1] + roundVotes[midIndex]) / 2;
        }

        return median;
    }

    // Function to retrieve the vote counts for a given round
    function getVotesForRound(uint256 roundIndex) public view returns (uint256[] memory) {
        require(roundIndex < rounds.length, "Round does not exist");
        return votesPerRound[roundIndex];
    }
    // Other functions and logic
    // ...
}
