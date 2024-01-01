import { ethers } from "hardhat";
import { expect } from "chai";
import {
  loadFixture,
  time,
  mine,
} from "@nomicfoundation/hardhat-network-helpers";

import {
  roundStatusToString,
  candidateStatusToString,
} from "./MedianVoteUtils";
import { MedianVote } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Signer } from "ethers";

describe.only("MedianVote", function () {
  async function deployMedianVoteFixture() {
    const [deployer, voter1, voter2, candidate1, candidate2, candidate3] =
      await ethers.getSigners();
    const MedianVote = await ethers.getContractFactory("MedianVote");
    const medianVote = await MedianVote.deploy();
    const oneMinuteInSeconds: number = 1 * 60;
    const roundDuration: number = oneMinuteInSeconds;
    const roundDelay: number = oneMinuteInSeconds;

    // call initalizer
    await medianVote.initialize(roundDuration, roundDelay);

    // Additional setup if required
    return {
      medianVote,
      deployer,
      voter1,
      voter2,
      candidate1,
      candidate2,
      candidate3,
      oneMinuteInSeconds,
      roundDuration,
      roundDelay,
    };
  }

  // ... Test cases below ...
  describe("Deplyment and initialization", function () {
    it("should deploy and initialize contract", async function () {
      const [deployer, voter1, voter2, candidate1, candidate2] =
        await ethers.getSigners();
      const MedianVote = await ethers.getContractFactory("MedianVote");
      const medianVote = await MedianVote.deploy();
      const oneMinuteInSeconds: number = 1 * 60;
      const roundDuration: number = oneMinuteInSeconds;
      const roundDelay: number = oneMinuteInSeconds;

      // call initalizer
      await expect(medianVote.initialize(roundDuration, roundDelay)).to.emit(
        medianVote,
        "Initialized"
      );
    });

    it("should deploy and initialize contract with correct values", async function () {
      const [deployer, voter1, voter2, candidate1, candidate2] =
        await ethers.getSigners();
      const MedianVote = await ethers.getContractFactory("MedianVote");
      const medianVote = await MedianVote.deploy();
      const oneMinuteInSeconds: number = 1 * 60;

      // call initalizer
      await expect(
        medianVote.initialize(oneMinuteInSeconds, oneMinuteInSeconds)
      ).to.emit(medianVote, "Initialized");

      // check values
      expect(await medianVote.getRoundDuration()).to.equal(oneMinuteInSeconds);
      expect(await medianVote.getRoundDelay()).to.equal(oneMinuteInSeconds);
    });
    it("should deploy and initialize contract only once", async function () {
      const [deployer, voter1, voter2, candidate1, candidate2] =
        await ethers.getSigners();
      const MedianVote = await ethers.getContractFactory("MedianVote");
      const medianVote = await MedianVote.deploy();
      const oneMinuteInSeconds: number = 1 * 60;

      // call initalizer
      await expect(
        medianVote.initialize(oneMinuteInSeconds, oneMinuteInSeconds)
      ).to.emit(medianVote, "Initialized");
      // call initalizer
      await expect(
        medianVote.initialize(oneMinuteInSeconds, oneMinuteInSeconds)
      ).to.be.reverted;
    });
  });

  describe("Registration", function () {
    it("should allow candidates to register", async function () {
      const { medianVote, candidate1 } = await loadFixture(
        deployMedianVoteFixture
      );
      await medianVote.connect(candidate1).registerCandidate();
      const status = await medianVote.getCandidateStatus(candidate1.address, 0);
      expect(candidateStatusToString(status)).to.equal("REGISTERED");
    });

    it("should not allow candidates to register after rounds started", async function () {
      const { medianVote, candidate1 } = await loadFixture(
        deployMedianVoteFixture
      );
      await medianVote.startNextRound();
      await expect(
        medianVote.connect(candidate1).registerCandidate()
      ).to.be.revertedWithCustomError(medianVote, "RegistrationClosed");
    });

    it("should not allow candidates to register more than once", async function () {
      const { medianVote, candidate1 } = await loadFixture(
        deployMedianVoteFixture
      );

      await medianVote.connect(candidate1).registerCandidate();
      await expect(
        medianVote.connect(candidate1).registerCandidate()
      ).to.be.revertedWithCustomError(medianVote, "CandidateAlreadyRegistered");
    });

    it("should return UNREGISTERED for unregistered candidates", async function () {
      const { medianVote, candidate2 } = await loadFixture(
        deployMedianVoteFixture
      );

      const status = await medianVote.getCandidateStatus(candidate2.address, 0);
      expect(candidateStatusToString(status)).to.equal("UNREGISTERED");
    });

    it("should emit an event when a candidate registers", async function () {
      const { medianVote, candidate1 } = await loadFixture(
        deployMedianVoteFixture
      );

      await expect(medianVote.connect(candidate1).registerCandidate())
        .to.emit(medianVote, "CandidateRegistered")
        .withArgs(candidate1.address);
    });
  });

  describe("Round Management", function () {
    it("should have an initial round status of DOES_NOT_EXIST", async function () {
      const { medianVote } = await loadFixture(deployMedianVoteFixture);
      const status = await medianVote.getRoundStatus(0);
      expect(roundStatusToString(status)).to.equal("DOES_NOT_EXIST");
    });

    it("should have an status PENDING when first started and delay has not elapsed ", async function () {
      const { medianVote } = await loadFixture(deployMedianVoteFixture);

      // start round
      await medianVote.startNextRound();
      const currentRound = await medianVote.getCurrentRoundIndex();
      const status = await medianVote.getRoundStatus(currentRound);
      expect(roundStatusToString(status)).to.equal("PENDING");
    });

    it("should have a round status of ACTIVE after starting a round and passing delay", async function () {
      const { medianVote, oneMinuteInSeconds, roundDelay } = await loadFixture(
        deployMedianVoteFixture
      );
      await medianVote.startNextRound();
      const currentRound = await medianVote.getCurrentRoundIndex();

      // increment time
      await time.increase(roundDelay + 1);
      const status = await medianVote.getRoundStatus(currentRound);

      // Depending on your roundDelay setup, adjust the expected status
      expect(roundStatusToString(status)).to.equal("ACTIVE");
    });

    it("should have a round status of ENDED after the round duration passes", async function () {
      const { medianVote, oneMinuteInSeconds, roundDuration, roundDelay } =
        await loadFixture(deployMedianVoteFixture);
      await medianVote.startNextRound();
      // Simulate time passage
      await time.increase(roundDuration + roundDelay + 1);

      const currentRound = await medianVote.getCurrentRoundIndex();
      const status = await medianVote.getRoundStatus(currentRound);
      expect(roundStatusToString(status)).to.equal("ENDED");
    });
  });

  describe("Voting", function () {
    it("should allow voting for a registered candidate", async function () {
      const { medianVote, candidate1, oneMinuteInSeconds, roundDelay } =
        await loadFixture(deployMedianVoteFixture);

      // register candidate
      await medianVote.connect(candidate1).registerCandidate();
      // start round
      await medianVote.startNextRound();
      // move time forward by 1 minute
      await time.increase(roundDelay + 1);
      // vote for candidate
      await expect(
        medianVote.connect(candidate1).castVote(candidate1.address, 10)
      )
        .to.emit(medianVote, "VoteCast")
        .withArgs(candidate1.address, candidate1.address, 0, 10);

      // Validate vote count or other relevant assertions
      expect(
        await medianVote.getCandidateVotes(candidate1.address, 0)
      ).to.equal(10);
    });
    // Additional tests for voting logic

    it("should not allow voting for a non-registered candidate", async function () {
      const { medianVote, candidate2 } = await loadFixture(
        deployMedianVoteFixture
      );

      await medianVote.startNextRound();
      await expect(
        medianVote.castVote(candidate2.address, 10)
      ).to.be.revertedWithCustomError(medianVote, "InvalidCandidate"); // Replace with your specific error message
    });

    it("should not allow voting in a pending state", async function () {
      const { medianVote, candidate1, roundDelay, roundDuration } =
        await loadFixture(deployMedianVoteFixture);

      await medianVote.connect(candidate1).registerCandidate();

      await medianVote.startNextRound();

      await expect(
        medianVote.connect(candidate1).castVote(candidate1.address, 10)
      ).to.be.revertedWithCustomError(medianVote, "RoundNotActive"); // Replace with your specific error message
    });

    it("should not allow voting if voter unregistered", async function () {
      const { medianVote, candidate1, candidate2, roundDelay, roundDuration } =
        await loadFixture(deployMedianVoteFixture);

      await medianVote.connect(candidate1).registerCandidate();

      await medianVote.startNextRound();

      await expect(
        medianVote.connect(candidate2).castVote(candidate1.address, 10)
      ).to.be.revertedWithCustomError(medianVote, "InvalidVoter"); // Replace with your specific error message
    });

    it("should not allow voting without an active round", async function () {
      const { medianVote, candidate1, roundDelay, roundDuration } =
        await loadFixture(deployMedianVoteFixture);

      await medianVote.connect(candidate1).registerCandidate();

      await expect(
        medianVote.connect(candidate1).castVote(candidate1.address, 10)
      ).to.be.revertedWithCustomError(medianVote, "RoundNotActive"); // Replace with your specific error message
    });

    it("should handle voting with zero amount", async function () {
      const { medianVote, candidate1, roundDelay, roundDuration } =
        await loadFixture(deployMedianVoteFixture);

      await medianVote.connect(candidate1).registerCandidate();
      await medianVote.startNextRound();

      await time.increase(roundDelay + 1);

      await expect(
        medianVote.connect(candidate1).castVote(candidate1.address, 0)
      )
        .to.emit(medianVote, "VoteCast")
        .withArgs(candidate1.address, candidate1.address, 0, 0);
    });

    it("should not allow voting after the round has ended", async function () {
      const { medianVote, candidate1, roundDelay, roundDuration } =
        await loadFixture(deployMedianVoteFixture);

      await medianVote.connect(candidate1).registerCandidate();
      await medianVote.startNextRound();
      await time.increase(roundDelay + roundDuration + 1); // Assuming the round duration is 1 minute
      await expect(
        medianVote.connect(candidate1).castVote(candidate1.address, 10)
      ).to.be.revertedWithCustomError(medianVote, "RoundNotActive"); // Replace with your specific error message
    });

    describe("Voting across rounds", function () {
      it("should handle multiple rounds of voting (not checking finalization)", async function () {
        const {
          medianVote,
          candidate1,
          voter1,
          voter2,
          oneMinuteInSeconds,
          roundDelay,
          roundDuration,
        } = await loadFixture(deployMedianVoteFixture);

        await medianVote.connect(candidate1).registerCandidate();

        // Round 1
        await medianVote.startNextRound();
        await time.increase(roundDelay + 1);
        await medianVote.connect(candidate1).castVote(candidate1.address, 10);
        await time.increase(roundDelay + roundDuration + 1);
        await medianVote.finalizeRound(15);
        expect(
          await medianVote.getCandidateVotes(candidate1.address, 0)
        ).to.equal(10);

        // Round 2
        await medianVote.startNextRound();
        await time.increase(roundDelay + 1);
        await medianVote.connect(candidate1).castVote(candidate1.address, 20);
        await time.increase(roundDelay + roundDuration + 1);
        await medianVote.finalizeRound(15);
        expect(
          await medianVote.getCandidateVotes(candidate1.address, 1)
        ).to.equal(20);

        // Add assertions for round status and candidate status as necessary
      });

      it("should eliminate candidates based on median threshold across multiple rounds", async function () {
        const {
          medianVote,
          candidate1,
          candidate2,
          candidate3,
          roundDelay,
          roundDuration,
        } = await loadFixture(deployMedianVoteFixture);

        // Register candidates
        await medianVote.connect(candidate1).registerCandidate();
        await medianVote.connect(candidate2).registerCandidate();
        await medianVote.connect(candidate3).registerCandidate();

        // Round 1
        await medianVote.startNextRound();
        await time.increase(roundDelay + 1);

        // Cast votes
        await medianVote.connect(candidate1).castVote(candidate1.address, 5); // Below median
        await medianVote.connect(candidate2).castVote(candidate2.address, 10); // Above median
        await medianVote.connect(candidate3).castVote(candidate3.address, 15); // Above median

        // Finalize Round 1 with a specific median threshold
        await time.increase(roundDelay + roundDuration + 1);
        await medianVote.finalizeRound(9);

        // Check candidate statuses after Round 1
        expect(
          candidateStatusToString(
            await medianVote.getCandidateStatus(candidate1.address, 0)
          )
        ).to.equal("REGISTERED");
        expect(
          candidateStatusToString(
            await medianVote.getCandidateStatus(candidate2.address, 0)
          )
        ).to.equal("ELIMINATED");
        expect(
          candidateStatusToString(
            await medianVote.getCandidateStatus(candidate3.address, 0)
          )
        ).to.equal("ELIMINATED");

        // Round 2
        await medianVote.startNextRound();
        await time.increase(roundDelay + 1);

        // Cast votes only for remaining candidate
        await medianVote.connect(candidate1).castVote(candidate1.address, 20);

        // Finalize Round 2 with a different median threshold
        await time.increase(roundDelay + roundDuration + 1);
        await medianVote.finalizeRound(21);

        // Check candidate statuses after Round 2
        expect(
          candidateStatusToString(
            await medianVote.getCandidateStatus(candidate1.address, 1)
          )
        ).to.equal("REGISTERED");
      });
    });
  });

  describe("Median Threshold Elimination Tests", function () {
    let medianVote: MedianVote;
    let candidate1: SignerWithAddress,
      candidate2: SignerWithAddress,
      candidate3: SignerWithAddress;
    let roundDelay: number, roundDuration: number;

    beforeEach(async function () {
      // Deploy and initialize as before
      const fixture = await loadFixture(deployMedianVoteFixture);
      medianVote = fixture.medianVote;
      candidate1 = fixture.candidate1;
      candidate2 = fixture.candidate2;
      candidate3 = fixture.candidate3;
      roundDelay = fixture.roundDelay;
      roundDuration = fixture.roundDuration;

      // Register candidates
      await medianVote.connect(candidate1).registerCandidate();
      await medianVote.connect(candidate2).registerCandidate();
      await medianVote.connect(candidate3).registerCandidate();
    });

    it("should eliminate candidates correctly based on median threshold", async function () {
      // Start and progress round
      await medianVote.startNextRound();
      await time.increase(roundDelay + 1);

      // Cast votes
      await medianVote.connect(candidate1).castVote(candidate1.address, 5); // Below median
      await medianVote.connect(candidate2).castVote(candidate2.address, 10); // Above median
      await medianVote.connect(candidate3).castVote(candidate3.address, 8); // At median

      // Finalize round with a specific median threshold
      await time.increase(roundDelay + roundDuration + 1);
      await medianVote.finalizeRound(8);

      // Check candidate statuses
      expect(
        candidateStatusToString(
          await medianVote.getCandidateStatus(candidate1.address, 0)
        )
      ).to.equal("REGISTERED");
      expect(
        candidateStatusToString(
          await medianVote.getCandidateStatus(candidate2.address, 0)
        )
      ).to.equal("ELIMINATED");
      expect(
        candidateStatusToString(
          await medianVote.getCandidateStatus(candidate3.address, 0)
        )
      ).to.equal("REGISTERED");
    });
    xit("should correctly handle multiple sequential rounds with elimination", async function () {
      const candidates = [candidate1, candidate2, candidate3];
      const voteCounts = [5, 10, 15]; // Adjust these numbers based on your median threshold logic
    
      // Register all candidates
      // for (let candidate of candidates) {
      //   await medianVote.connect(candidate).registerCandidate();
      // }
    
      for (let round = 0; round < 3; round++) {
        console.log("Round: ", round);
          await medianVote.startNextRound();
          await time.increase(roundDelay + 1);
      
          let currentRound = await medianVote.getCurrentRoundIndex();
          let roundStatus = await medianVote.getRoundStatus(currentRound);
          console.log(`Round ${currentRound} status: `, roundStatusToString(roundStatus));
     
      
      // Cast votes for each candidate that hasn't been eliminated
      for (let i = 0; i < candidates.length; i++) {
        const status = candidateStatusToString(await medianVote.getCandidateStatus(candidates[i].address, round));
        if (status !== "ELIMINATED") {
          await medianVote.connect(candidates[i]).castVote(candidates[i].address, voteCounts[i]);
        }
      }
    
    
        // Finalize round with a specific median threshold
        await time.increase(roundDelay + roundDuration + 1);
        await medianVote.finalizeRound(10); // Set your median threshold
    
        // Check candidate statuses
        for (let candidate of candidates) {
          const status = candidateStatusToString(await medianVote.getCandidateStatus(candidate.address, round));
          console.log(`Candidate ${candidate.address} status in round ${round}: ${status}`);
        }
         currentRound = await medianVote.getCurrentRoundIndex();
         roundStatus = await medianVote.getRoundStatus(currentRound);
        console.log(`Round ${currentRound} status: `, roundStatusToString(roundStatus));
      }
    });
    
    

    it("should correctly handle eliminations over multiple rounds", async function () {
      // Round 1
      await medianVote.startNextRound();
      await time.increase(roundDelay + 1);
      await medianVote.connect(candidate1).castVote(candidate1.address, 3); // Below median
      await medianVote.connect(candidate2).castVote(candidate2.address, 6); // Above median
      await time.increase(roundDelay + roundDuration + 1);
      await medianVote.finalizeRound(5); // Set median threshold

      // Round 2
      await medianVote.startNextRound();
      await time.increase(roundDelay + 1);
      await medianVote.connect(candidate1).castVote(candidate1.address, 4); // Below median
      await time.increase(roundDelay + roundDuration + 1);
      await medianVote.finalizeRound(4); // Set median threshold

      // Check candidate statuses after each round
      expect(
        candidateStatusToString(
          await medianVote.getCandidateStatus(candidate1.address, 0)
        )
      ).to.equal("REGISTERED");
      expect(
        candidateStatusToString(
          await medianVote.getCandidateStatus(candidate1.address, 1)
        )
      ).to.equal("REGISTERED");
      expect(
        candidateStatusToString(
          await medianVote.getCandidateStatus(candidate2.address, 0)
        )
      ).to.equal("ELIMINATED");
      expect(
        candidateStatusToString(
          await medianVote.getCandidateStatus(candidate2.address, 1)
        )
      ).to.equal("ELIMINATED");
    });

    // Additional test cases for different scenarios...
  });

  xdescribe("Round Finalization and Candidate Status", function () {
    it("should finalize a round and set median threshold", async function () {
      const { medianVote } = await loadFixture(deployMedianVoteFixture);
      // Finalize round with a specific threshold
      await medianVote.finalizeRound(5);
      expect(await medianVote.getRoundStatus(0)).to.equal("FINALIZED");
    });
    it("should correctly determine candidate status after round finalization", async function () {
      const { medianVote, candidate1 } = await loadFixture(
        deployMedianVoteFixture
      );
      // Assuming votes have been cast and round finalized
      expect(
        await medianVote.getCandidateStatus(candidate1.address, 0)
      ).to.be.oneOf(["REGISTERED", "ELIMINATED"]);
    });
    // Additional tests for checking status in different scenarios
  });
});
