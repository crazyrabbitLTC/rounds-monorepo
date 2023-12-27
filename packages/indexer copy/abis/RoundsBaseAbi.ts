export const RoundsBaseAbi = [
  {
    inputs: [],
    name: "AccessControlBadConfirmation",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "neededRole",
        type: "bytes32",
      },
    ],
    name: "AccessControlUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidBallot",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidInitialization",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidRound",
    type: "error",
  },
  {
    inputs: [],
    name: "MaxRoundsReached",
    type: "error",
  },
  {
    inputs: [],
    name: "NotAdmin",
    type: "error",
  },
  {
    inputs: [],
    name: "NotInitializing",
    type: "error",
  },
  {
    inputs: [],
    name: "PreviousRoundNotOver",
    type: "error",
  },
  {
    inputs: [],
    name: "RecipientEliminated",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error",
  },
  {
    inputs: [],
    name: "RegistrationClosed",
    type: "error",
  },
  {
    inputs: [],
    name: "RoundFullyProcessed",
    type: "error",
  },
  {
    inputs: [],
    name: "RoundNotActive",
    type: "error",
  },
  {
    inputs: [],
    name: "RoundNotProcessed",
    type: "error",
  },
  {
    inputs: [],
    name: "RoundOver",
    type: "error",
  },
  {
    inputs: [],
    name: "TooManyVotes",
    type: "error",
  },
  {
    inputs: [],
    name: "UserAlreadyRegistered",
    type: "error",
  },
  {
    inputs: [],
    name: "UserNotRegistered",
    type: "error",
  },
  {
    inputs: [],
    name: "VoterEliminated",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint64",
        name: "version",
        type: "uint64",
      },
    ],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "roundNumber",
        type: "uint256",
      },
    ],
    name: "RoundEnded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "roundNumber",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "roundAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "startingTime",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "endingTime",
        type: "uint256",
      },
    ],
    name: "RoundStarted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "UserRegistered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "voter",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "round",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address[]",
        name: "recipients",
        type: "address[]",
      },
    ],
    name: "VoteCast",
    type: "event",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "address",
            name: "admin",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "metadata",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "houseSplit",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "winnerSplit",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "roundDuration",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "rounds",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxRecipientsPerVote",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "allowPublicStartAndEnd",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "eliminationNumerator",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "eliminateTop",
            type: "bool",
          },
        ],
        internalType: "struct IRounds.Setting",
        name: "_settings",
        type: "tuple",
      },
    ],
    name: "BaseInitialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "recipients",
        type: "address[]",
      },
      {
        internalType: "address",
        name: "voter",
        type: "address",
      },
    ],
    name: "_isValidBallot",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "candidateStatus",
    outputs: [
      {
        internalType: "enum IRounds.CandidateStatus",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "recipients",
        type: "address[]",
      },
    ],
    name: "castVote",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "candidate",
        type: "address",
      },
    ],
    name: "getCandidateStatus",
    outputs: [
      {
        internalType: "enum IRounds.CandidateStatus",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "candidate",
        type: "address",
      },
    ],
    name: "getCandidateTotalVotes",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCurrentRound",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleAdmin",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "round",
        type: "uint256",
      },
    ],
    name: "getVotes",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "hasRole",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "address",
            name: "admin",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "metadata",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "houseSplit",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "winnerSplit",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "roundDuration",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "rounds",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxRecipientsPerVote",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "allowPublicStartAndEnd",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "eliminationNumerator",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "eliminateTop",
            type: "bool",
          },
        ],
        internalType: "struct IRounds.Setting",
        name: "_settings",
        type: "tuple",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "candidate",
        type: "address",
      },
    ],
    name: "isEliminated",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "numberOfVotesCastInThisRound",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "points",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "register",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "participant",
        type: "address",
      },
    ],
    name: "register",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "callerConfirmation",
        type: "address",
      },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "roundTracker",
    outputs: [
      {
        internalType: "contract Voting",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "rounds",
    outputs: [
      {
        internalType: "contract Voting",
        name: "votes",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "startingTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "endingTime",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "settings",
    outputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "address",
        name: "admin",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "metadata",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "houseSplit",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "winnerSplit",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "roundDuration",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "rounds",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maxRecipientsPerVote",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "allowPublicStartAndEnd",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "eliminationNumerator",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "eliminateTop",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "startNextRound",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalRegisteredCandidates",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
