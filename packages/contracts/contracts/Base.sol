// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRounds} from "./IRounds.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {Voting} from "./utils/Voting.sol";

/// @title RoundsBase Contract
/// @dev This contract allows users to vote for candidates.
abstract contract Base is
    IRounds,
    Initializable,
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable
{
    //Settings
    Setting public settings;

    //Rounds
    Round[] public rounds;

    mapping(address => CandidateStatus) public candidateStatus;
    uint256 public totalRegisteredCandidates;

    function BaseInitialize(
        Setting calldata _settings
    ) public onlyInitializing {
        __AccessControl_init();
        __ReentrancyGuard_init();
        settings = _settings;
    }

    // Registers a new voter
    function register(address participant) public payable virtual {
        _register(participant);
    }

    // Registers a new voter internally
    function _register(address _user) private returns (uint256) {
        // Can't register after voting starts
        if (rounds.length != 0) revert RegistrationClosed();

        // Check if the user is already registered
        if (candidateStatus[_user] != CandidateStatus.UNREGISTERED)
            revert UserAlreadyRegistered();

        candidateStatus[_user] = CandidateStatus.REGISTERED;

        totalRegisteredCandidates++; // Increment total registered candidates count
        emit UserRegistered(_user);
        return totalRegisteredCandidates;
    }

    // Start Next Round Public
    function startNextRound() public payable virtual {
        _startNextRound(settings.roundDuration);
    }

    // Start next Round Internally
    function _startNextRound(uint256 _roundDuration) private returns (uint256) {
        // Check if the maximum number of rounds has been reached
        if (rounds.length >= settings.rounds) {
            revert MaxRoundsReached();
        }

        // If there are existing rounds, ensure the last round has ended
        if (rounds.length > 0) {
            uint256 lastRoundIndex = rounds.length - 1;
            if (_getRoundStatus(lastRoundIndex) != RoundStatus.ENDED) {
                revert PreviousRoundNotOver();
            }
        }

        // Create a new round
        Voting newVotingInstance = new Voting();
        uint256 newRoundStart = block.timestamp;
        uint256 newRoundEnd = newRoundStart + _roundDuration;

        Round memory newRound = Round({
            votes: newVotingInstance,
            startingTime: newRoundStart,
            endingTime: newRoundEnd
        });

        // Add the new round to the rounds array
        rounds.push(newRound);
        emit RoundStarted(
            rounds.length, // Note: rounds.length is now the index of the new round
            address(newVotingInstance),
            newRoundStart,
            newRoundEnd
        );

        return rounds.length; // Return the new number of rounds
    }

    function _getRoundStatus(
        uint256 roundNumber
    ) internal view returns (RoundStatus) {
        // Check if the round number is out of bounds
        if (roundNumber >= rounds.length) {
            return RoundStatus.DOES_NOT_EXIST;
        }

        // Get the round (round zero is valid and will be correctly retrieved here)
        Round storage round = rounds[roundNumber];

        // Check if the round has not started yet
        if (block.timestamp < round.startingTime) {
            return RoundStatus.NOT_STARTED;
        }

        // Check if the round is currently active
        if (
            block.timestamp >= round.startingTime &&
            block.timestamp <= round.endingTime
        ) {
            return RoundStatus.ACTIVE;
        }

        // If none of the above, the round has ended
        return RoundStatus.ENDED;
    }

    function getCurrentRound() public view returns (uint256) {
        return _getCurrentRound();
    }

    function _getCurrentRound() internal view returns (uint256) {
        return rounds.length == 0 ? 0 : rounds.length - 1;
    }

    function _isRoundOver(uint256 roundNumber) internal view returns (bool) {
        return rounds[roundNumber].endingTime <= block.timestamp;
    }

    function isEliminated(
        address candidate
    ) public view virtual returns (bool) {
        return _isEliminated(candidate);
    }

    function _isEliminated(address candidate) internal view returns (bool) {
        for (
            uint256 roundNumber = 0;
            roundNumber < rounds.length;
            roundNumber++
        ) {
            if (_getRoundStatus(roundNumber) == RoundStatus.ENDED) {
                uint256 totalNodes = rounds[roundNumber]
                    .votes
                    .getTotalNodeCount();
                uint256 effectiveTotal = totalRegisteredCandidates > totalNodes
                    ? totalRegisteredCandidates
                    : totalNodes;

                uint256 thresholdIndex;
                if (settings.eliminateTop) {
                    // Top elimination: Consider the top percentage of totalNodes
                    thresholdIndex =
                        (totalNodes * settings.eliminationNumerator) /
                        100;
                } else {
                    // Bottom elimination: Consider the bottom percentage of effectiveTotal
                    thresholdIndex =
                        effectiveTotal -
                        (effectiveTotal * settings.eliminationNumerator) /
                        100;
                }
                require(
                    thresholdIndex <= effectiveTotal,
                    "Threshold index calculation overflow"
                );

                uint256 candidatePosition = rounds[roundNumber]
                    .votes
                    .getPositionByAddress(candidate);
                if (candidatePosition == 0) {
                    // For candidates with no votes, position is considered at the end if eliminateTop is false
                    candidatePosition = settings.eliminateTop
                        ? 0
                        : effectiveTotal + 1;
                }

                bool isInEliminationZone = settings.eliminateTop
                    ? candidatePosition <= thresholdIndex
                    : candidatePosition > thresholdIndex;

                if (isInEliminationZone) return true; // Candidate was eliminated in this round
            }
        }
        return false; // Candidate has not been eliminated in any round
    }

    function getCandidateStatus(
        address candidate
    ) public view virtual returns (CandidateStatus) {
        return _getCandidateStatus(candidate);
    }

    function _getCandidateStatus(
        address candidate
    ) internal view returns (CandidateStatus) {
        // If the candidate's status is already determined (either ELIMINATED or UNREGISTERED), return it
        if (candidateStatus[candidate] != CandidateStatus.REGISTERED) {
            return candidateStatus[candidate];
        }

        // Loop to determine if the candidate is eliminated
        for (
            uint256 roundNumber = 0;
            roundNumber < rounds.length;
            roundNumber++
        ) {
            if (_getRoundStatus(roundNumber) == RoundStatus.ENDED) {
                uint256 totalNodes = rounds[roundNumber]
                    .votes
                    .getTotalNodeCount();
                uint256 effectiveTotal = totalRegisteredCandidates > totalNodes
                    ? totalRegisteredCandidates
                    : totalNodes;

                uint256 thresholdIndex;
                if (settings.eliminateTop) {
                    // Top elimination: Consider the top percentage of totalNodes
                    thresholdIndex =
                        (totalNodes * settings.eliminationNumerator) /
                        100;
                } else {
                    // Bottom elimination: Consider the bottom percentage of effectiveTotal
                    thresholdIndex =
                        effectiveTotal -
                        (effectiveTotal * settings.eliminationNumerator) /
                        100;
                }
                require(
                    thresholdIndex <= effectiveTotal,
                    "Threshold index calculation overflow"
                );

                uint256 candidatePosition = rounds[roundNumber]
                    .votes
                    .getPositionByAddress(candidate);
                if (candidatePosition == 0) {
                    // For candidates with no votes, position is considered at the end if eliminateTop is false
                    candidatePosition = settings.eliminateTop
                        ? 0
                        : effectiveTotal + 1;
                }

                bool isInEliminationZone = settings.eliminateTop
                    ? candidatePosition <= thresholdIndex
                    : candidatePosition > thresholdIndex;

                if (isInEliminationZone) {
                    // Mark the candidate as eliminated and return ELIMINATED
                    return CandidateStatus.ELIMINATED;
                }
            }
        }

        // If the candidate is not eliminated in any round, return REGISTERED
        return CandidateStatus.REGISTERED;
    }
}
