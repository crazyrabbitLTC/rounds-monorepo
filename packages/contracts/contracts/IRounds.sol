// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Voting } from "./utils/Voting.sol";

interface IRounds {
    struct Setting {
        string name;
        address admin;
        bytes32 metadata;
        uint256 houseSplit;
        uint256 winnerSplit;
        uint256 roundDuration;
        uint256 rounds;
        uint256 maxRecipientsPerVote;
        bool allowPublicStartAndEnd;
        uint256 eliminationNumerator;
        bool eliminateTop;
    }

    struct Round {
        Voting votes;
        uint256 startingTime;
        uint256 endingTime;
    }

    enum RoundStatus { NOT_STARTED, ACTIVE, ENDED, DOES_NOT_EXIST }
    enum ContestStatus { PENDING, ACTIVE, ENDED }
    enum CandidateStatus { UNREGISTERED, REGISTERED, ELIMINATED }


    event RoundStarted(
        uint256 indexed roundNumber,
        address indexed roundAddress,
        uint256 startingTime,
        uint256 endingTime
    );
    event RoundEnded(uint256 indexed roundNumber);
    event UserRegistered(address indexed user);
    event VoteCast(address indexed voter, uint256 round, address[] recipients);

    // event CandidateEliminated(address indexed candidate, uint256 round);

    error RecipientEliminated();
    error MaxRoundsReached();
    error InvalidBallot();
    error InvalidRound();
    error RoundFullyProcessed();
    error RoundNotProcessed();
    error RegistrationClosed();
    error UserAlreadyRegistered();
    error PreviousRoundNotOver();
    error RoundNotActive();
    error RoundOver();
    error TooManyVotes();
    error UserNotRegistered();
    error VoterEliminated();
    error NotAdmin();

    function register() external payable;

    function startNextRound() external payable;

    function castVote(address[] calldata recipients) external payable;
}
