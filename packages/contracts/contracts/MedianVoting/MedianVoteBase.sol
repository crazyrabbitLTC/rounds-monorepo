// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IMedianVote} from "./IMedianVote.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

abstract contract MedianVoteBase is Initializable, IMedianVote {
    Round[] public rounds;

    //round => candidate => votes
    mapping(uint256 => mapping(address => uint256))
        internal _roundCandidateVotes;

    mapping(address => CandidateStatus) internal _candidateStatus;

    uint256 internal _roundDuration;
    uint256 internal _roundDelay;

    function getCandidateVotes(
        address _candidate,
        uint256 _round
    ) public view returns (uint256) {
        return _roundCandidateVotes[_round][_candidate];
    }

    function getRoundDuration() public view returns (uint256) {
        return _roundDuration;
    }

    function getRoundDelay() public view returns (uint256) {
        return _roundDelay;
    }

    function getCurrentRoundIndex() public view returns (uint256) {
        return _getCurrentRoundIndex();
    }

    function __MedianVoteBaseInit(
        uint256 roundDuration,
        uint256 roundDelay
    ) public onlyInitializing {
        _roundDuration = roundDuration;
        _roundDelay = roundDelay;
    }

    function _registerCandidate(address _candidate) internal {
        // Check if the user is already registered
        if (_candidateStatus[_candidate] != CandidateStatus.UNREGISTERED)
            revert CandidateAlreadyRegistered();
        _candidateStatus[_candidate] = CandidateStatus.REGISTERED;
        emit CandidateRegistered(_candidate);
    }

    function _startNextRound() internal {
        if (
            _getCurrentRoundIndex() > 0 &&
            rounds[_getCurrentRoundIndex()].status != RoundStatus.FINALIZED
        ) revert PreviousRoundNotFinalized();

        rounds.push(
            Round(
                block.timestamp,
                _roundDelay,
                block.timestamp + _roundDuration + _roundDelay,
                0,
                0,
                _roundDelay == 0 ? RoundStatus.ACTIVE : RoundStatus.PENDING
            )
        );

        emit NewRound(_getCurrentRoundIndex());
    }

    function _finalizeRound(uint256 _threshold) internal {
        // require a threshold above zero
        if (_threshold == 0) revert InvalidThreshold();

        // require at least 1 round or revert
        if (rounds.length == 0) revert InvalidRound();

        // If the round has already finalized, revert
        if (_getRoundStatus(_getCurrentRoundIndex()) == RoundStatus.FINALIZED)
            revert RoundAlreadyFinalized();

        // If the round has not ended, revert
        if (_getRoundStatus(_getCurrentRoundIndex()) != RoundStatus.ENDED)
            revert RoundNotFinalized();

        // Set the median threshold
        rounds[_getCurrentRoundIndex()].medianThreshold = _threshold;

        emit RoundFinalized(_getCurrentRoundIndex(), _threshold);
    }

    function _getRoundStatus(
        uint256 round
    ) internal view returns (RoundStatus) {
        if (round >= rounds.length) return RoundStatus.DOES_NOT_EXIST;

        if (
            block.timestamp <
            rounds[round].startingTime + rounds[round].startDelay
        ) return RoundStatus.PENDING;
        if (block.timestamp < rounds[round].endingTime)
            return RoundStatus.ACTIVE;

        // Check if the round has ended but not yet finalized
        if (
            block.timestamp >= rounds[round].endingTime &&
            rounds[round].medianThreshold == 0
        ) return RoundStatus.ENDED;

        // If the round has ended and the median threshold is set, it's finalized
        return RoundStatus.FINALIZED;
    }

    function _getCurrentRoundIndex() internal view returns (uint256) {
        if (rounds.length == 0) {
            return 0; // Return 0 or a special value indicating no rounds have started.
        }
        return rounds.length - 1;
    }

    function _castVote(
        address _voter,
        address _candidate,
        uint256 _voteAmount
    ) internal {
        // Get the last round index
        uint256 _roundIndex = _getCurrentRoundIndex();
        uint256 previousRound = _roundIndex == 0 ? 0 : _roundIndex - 1;

        // Require the candidate to be registered
        if (
            _getCandidateStatus(_candidate, previousRound) !=
            CandidateStatus.REGISTERED
        ) revert InvalidCandidate();

        // Require the voter to be registered
        if (
            _getCandidateStatus(_voter, previousRound) !=
            CandidateStatus.REGISTERED
        ) revert InvalidVoter();

        // require the round to be active
        if (_getRoundStatus(_getCurrentRoundIndex()) != RoundStatus.ACTIVE)
            revert RoundNotActive();

        // Update Votes
        rounds[_getCurrentRoundIndex()].votesCast += _voteAmount;

        // track votes
        _roundCandidateVotes[_getCurrentRoundIndex()][
            _candidate
        ] += _voteAmount;

        emit VoteCast(_voter, _candidate, _getCurrentRoundIndex(), _voteAmount);
    }

    function _getCandidateStatus(
        address _candidate,
        uint256 _round
    ) internal view returns (CandidateStatus) {
        // If the candidate is not registered, return unregistered
        if (_candidateStatus[_candidate] == CandidateStatus.UNREGISTERED) {
            return CandidateStatus.UNREGISTERED;
        }

        // Handle the first round scenario
        if (_round == 0 && _getRoundStatus(_round) != RoundStatus.FINALIZED) {
            // In the first round, a registered candidate is not eliminated yet
            return CandidateStatus.REGISTERED;
        }

        // Ensure the round is finalized before proceeding
        if (_getRoundStatus(_round) != RoundStatus.FINALIZED) {
            revert RoundNotFinalized();
        }

        // Check elimination status for each finalized round up to and including the current round
        for (uint256 i = 0; i <= _round; i++) {
            if (
                _roundCandidateVotes[i][_candidate] > rounds[i].medianThreshold
            ) {
                return CandidateStatus.ELIMINATED;
            }
        }

        // If not eliminated in any previous rounds, the candidate is still registered
        return CandidateStatus.REGISTERED;
    }
}
