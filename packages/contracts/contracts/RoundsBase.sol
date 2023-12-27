// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRounds} from "./IRounds.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {Voting} from "./utils/Voting.sol";
import {Base} from "./Base.sol";

/// @title RoundsBase Contract
/// @dev This contract allows users to vote for candidates.
contract RoundsBase is Base {
    mapping(address => mapping(uint256 => uint256))
        public numberOfVotesCastInThisRound;
    mapping(address => uint256) public points;

    Voting public roundTracker;

    modifier isOpenToPublic() {
        if (
            !settings.allowPublicStartAndEnd &&
            !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)
        ) {
            revert NotAdmin();
        }
        _;
    }

    function initialize(Setting calldata _settings) public initializer {
        Base.BaseInitialize(_settings);
        _grantRole(DEFAULT_ADMIN_ROLE, settings.admin);

        // Setup a total vote stracker
        roundTracker = new Voting();
        emit ContestCreated(_settings);
    }

    function register() public payable override {
        super.register(msg.sender);
    }

    function startNextRound() public payable override isOpenToPublic {
        super.startNextRound();
    }

    function castVote(
        address[] calldata recipients
    ) external payable nonReentrant {
        _isValidBallot(recipients, msg.sender);
        uint256 currentRound = _getCurrentRound();
        uint256 defaultVoteAmount = 1;
        _updateVotersVotesRemaining(
            msg.sender,
            currentRound,
            recipients.length
        );
        for (uint256 i = 0; i < recipients.length; i++) {
            rounds[currentRound].votes.castVote(
                recipients[i],
                defaultVoteAmount
            );
            _tallyTotalVotes(recipients[i], defaultVoteAmount);
        emit VoteCast(msg.sender, currentRound, defaultVoteAmount, recipients[i]);
        }
    }

    function _tallyTotalVotes(address recipient, uint256 votes) internal {
        roundTracker.castVote(recipient, votes);
    }

    function getCandidateTotalVotes(
        address candidate
    ) external view returns (uint256) {
        return roundTracker.getVotes(candidate);
    }

    function _isValidBallot(
        address[] calldata recipients,
        address voter
    ) public view returns (bool) {
        uint256 currentRound = _getCurrentRound();
        if (!_haveRoundsStarted()) revert InvalidRound();
        if (!_isRoundActive(currentRound)) revert RoundNotActive();
        if (_isRoundOver(currentRound)) revert RoundOver();
        if (candidateStatus[msg.sender] == CandidateStatus.UNREGISTERED) revert UserNotRegistered();
        if (recipients.length > _votesRemainingInThisRound(msg.sender))
            revert TooManyVotes();
        for (uint256 i = 0; i < recipients.length; i++) {
            if (isEliminated(recipients[i])) revert RecipientEliminated();
        }
        if (isEliminated(voter)) revert VoterEliminated();
        return true;
    }

    // Function to check if a candidate has been eliminated in any round

    function _votesRemainingInThisRound(
        address voter
    ) internal view returns (uint256) {
        uint256 currentRound = _getCurrentRound();
        return
            settings.maxRecipientsPerVote -
            numberOfVotesCastInThisRound[voter][currentRound];
    }

    function _updateVotersVotesRemaining(
        address voter,
        uint256 roundNumber,
        uint256 votes
    ) internal {
        numberOfVotesCastInThisRound[voter][roundNumber] += votes;
    }

    function getVotes(
        address recipient,
        uint256 round
    ) external view returns (uint256) {
        return rounds[round].votes.getVotes(recipient);
    }

    function _isRoundActive(uint256 roundNumber) internal view returns (bool) {
        if (roundNumber >= rounds.length) {
            return false; // roundNumber is out of bounds
        }
        Round memory round = rounds[roundNumber];
        return
            block.timestamp >= round.startingTime &&
            block.timestamp < round.endingTime;
    }

    function _haveRoundsStarted() internal view returns (bool) {
        return rounds.length > 0;
    }
}
