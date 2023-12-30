// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {MedianVoteBase} from "./MedianVoteBase.sol";

contract MedianVote is MedianVoteBase {

    error RegistrationClosed();

    function initialize(
        uint256 roundDuration,
        uint256 roundDelay
    ) public initializer {
        MedianVoteBase.__MedianVoteBaseInit(roundDuration, roundDelay);
    }

    function registerCandidate(address user) public payable virtual {
        // Block a user from registering after a vote has started
        if (rounds.length > 0) revert RegistrationClosed();

        
        _registerCandidate(user);
    }

    function startNextRound() public payable virtual {
        _startNextRound();
    }

    function castVote(
        address candidate,
        uint256 voteAmount
    ) public payable virtual {
        _castVote(msg.sender, candidate, voteAmount);
    }

    function getCandidateStatus(
        address candidate,
        uint256 round
    ) public view virtual returns (CandidateStatus) {
        return _getCandidateStatus(candidate, round);
    }

    function getRoundStatus(
        uint256 round
    ) public view virtual override returns (RoundStatus) {
        return _getRoundStatus(round);
    }

    function finalizeRound(uint256 threshold) public payable virtual {
        _finalizeRound(threshold);
    }
}
