// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMedianVote {
    struct Votes {
        address candidate;
        uint256 amount;
    }

    struct Round {
        uint256 startingTime;
        uint256 startDelay;
        uint256 endingTime;
        uint256 medianThreshold; // this is zero while the round is ongoing
        uint256 votesCast;
        RoundStatus status;
    }

    enum RoundStatus {
        DOES_NOT_EXIST,
        PENDING,
        ACTIVE,
        ENDED,
        FINALIZED
    }

    enum CandidateStatus {
        UNREGISTERED,
        REGISTERED,
        ELIMINATED
    }

    event VoteCast(
        address indexed voter,
        address indexed recipient,
        uint256 round,
        uint256 amount
    );
    event CandidateRegistered(address indexed Candidate);
    event NewRound(uint256 round);
    event RoundFinalized(uint256 round, uint256 median);

    error CandidateAlreadyRegistered();
    error PreviousRoundNotFinalized();
    error RoundNotFinalized();
    error RoundAlreadyFinalized();
    error InvalidCandidate();
    error InvalidVoter();
    error InvalidRound();
    error InvalidThreshold();
    error RoundNotActive();

    function register() external payable;

    function castVote(address candidate, uint256 voteAmount) external payable;

    function getRoundStatus(uint256 round) external view returns (RoundStatus);

    function isEliminated(
        address candidate,
        uint256 round
    ) external view returns (bool);

    function finalizeRound(uint256 threshold) external payable;

    function startNextRound() external payable;

    // function castVoteBySig(
    //     address candidate,
    //     uint256 voteAmount,
    //     uint256 deadline,
    //     uint8 v,
    //     bytes32 r,
    //     bytes32 s
    // ) external payable;

    // function registerBySig(
    //     address participant,
    //     uint256 deadline,
    //     uint8 v,
    //     bytes32 r,
    //     bytes32 s
    // ) external payable;
}

abstract contract MedianVoteBase is IMedianVote {
    Round[] public _rounds;

    //round => candidate => votes
    mapping(uint256 => mapping(address => uint256))
        internal _roundCandidateVotes;

    mapping(address => CandidateStatus) internal _candidateStatus;

    uint256 internal _roundDuration;
    uint256 internal _roundDelay;

    function _register(address _candidate) internal {
        // Check if the user is already registered
        if (_candidateStatus[_candidate] != CandidateStatus.UNREGISTERED)
            revert CandidateAlreadyRegistered();
        _candidateStatus[_candidate] = CandidateStatus.REGISTERED;
        emit CandidateRegistered(_candidate);
    }

    function register(address user) public payable virtual {
        _register(user);
    }

    function _startNextRound() internal {
        if (_rounds[_getCurrentRoundIndex()].status != RoundStatus.FINALIZED)
            revert PreviousRoundNotFinalized();

        _rounds.push(
            Round(
                block.timestamp,
                block.timestamp + _roundDelay,
                block.timestamp + _roundDuration,
                0,
                0,
                _roundDelay == 0 ? RoundStatus.ACTIVE : RoundStatus.PENDING
            )
        );

        emit NewRound(_getCurrentRoundIndex());
    }

    function startNextRound() public payable virtual {
        _startNextRound();
    }

    function _finalizeRound(uint256 _threshold) internal {
        // require a threshold above zero
        if (_threshold == 0) revert InvalidThreshold();

        // require at least 1 round or revert
        if (_rounds.length == 0) revert InvalidRound();

        // If the round has already finalized, revert
        if (_getRoundStatus(_getCurrentRoundIndex()) == RoundStatus.FINALIZED)
            revert RoundAlreadyFinalized();

        // If the round has not ended, revert
        if (_getRoundStatus(_getCurrentRoundIndex()) != RoundStatus.ENDED)
            revert RoundNotFinalized();

        // Set the median threshold
        _rounds[_getCurrentRoundIndex()].medianThreshold = _threshold;

        emit RoundFinalized(_getCurrentRoundIndex(), _threshold);
    }

    function _getRoundStatus(
        uint256 round
    ) internal view returns (RoundStatus) {
        if (round >= _rounds.length) return RoundStatus.DOES_NOT_EXIST;
        if (block.timestamp < _rounds[round].startingTime)
            return RoundStatus.PENDING;
        if (block.timestamp < _rounds[round].endingTime)
            return RoundStatus.ACTIVE;

        // Check if the round has ended but not yet finalized
        if (
            block.timestamp >= _rounds[round].endingTime &&
            _rounds[round].medianThreshold == 0
        ) return RoundStatus.ENDED;

        // If the round has ended and the median threshold is set, it's finalized
        return RoundStatus.FINALIZED;
    }

    function _getCurrentRoundIndex() internal view returns (uint256) {
        if (_rounds.length == 0) revert InvalidRound();
        return _rounds.length - 1;
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
        _rounds[_getCurrentRoundIndex()].votesCast += _voteAmount;

        // track votes
        _roundCandidateVotes[_getCurrentRoundIndex()][
            _candidate
        ] += _voteAmount;

        emit VoteCast(_voter, _candidate, _getCurrentRoundIndex(), _voteAmount);
    }

    function castVote(
        address candidate,
        uint256 voteAmount
    ) public payable virtual {
        _castVote(msg.sender, candidate, voteAmount);
    }

   function _getCandidateStatus(address _candidate, uint256 _round) internal view returns (CandidateStatus) {
    // If the candidate is not registered, return unregistered
    if (_candidateStatus[_candidate] == CandidateStatus.UNREGISTERED) {
        return CandidateStatus.UNREGISTERED;
    }

    // Handle the first round scenario
    if (_round == 0) {
        // In the first round, a registered candidate is not eliminated yet
        return CandidateStatus.REGISTERED;
    }

    // Ensure the round is finalized before proceeding
    if (_getRoundStatus(_round) != RoundStatus.FINALIZED) {
        revert RoundNotFinalized();
    }

    // Check elimination status in previous rounds
    for (uint256 i = 0; i < _round; i++) {
        if (_roundCandidateVotes[i][_candidate] > _rounds[i].medianThreshold) {
            return CandidateStatus.ELIMINATED;
        }
    }

    // If not eliminated in any previous rounds, the candidate is still registered
    return CandidateStatus.REGISTERED;
}


    function getCandidateStatus(
        address candidate,
        uint256 round
    ) public view virtual returns (CandidateStatus) {
        return _getCandidateStatus(candidate, round);
    }

    function finalizeRound(uint256 threshold) public payable virtual {
        _finalizeRound(threshold);
    }

    function getRoundStatus(
        uint256 round
    ) public view virtual override returns (RoundStatus) {
        return _getRoundStatus(round);
    }
}
