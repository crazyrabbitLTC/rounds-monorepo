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

describe.only("MedianVote", function () {
  async function deployMedianVoteFixture() {
    const [deployer, voter1, voter2, candidate1, candidate2] =
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

  describe.only("Voting", function () {
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

    describe.only("Voting across rounds", function () {
      it("should handle multiple rounds of voting", async function () {
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
        await medianVote.connect(voter1).castVote(candidate1.address, 10);
        await time.increase(roundDelay + roundDuration + 1);
        await medianVote.finalizeRound(5);
        expect(
          await medianVote.getCandidateVotes(candidate1.address, 0)
        ).to.equal(10);

        // Round 2
        await medianVote.startNextRound();
        await medianVote.connect(voter2).castVote(candidate1.address, 20);
        await time.increase(roundDelay + 1);
        await medianVote.finalizeRound(15);
        expect(
          await medianVote.getCandidateVotes(candidate1.address, 1)
        ).to.equal(20);

        // Add assertions for round status and candidate status as necessary
      });
    });
  });

  describe("Round Finalization and Candidate Status", function () {
    // it("should finalize a round and set median threshold", async function () {
    //     const { medianVote } = await loadFixture(deployMedianVoteFixture);
    //     // Finalize round with a specific threshold
    //     await medianVote.finalizeRound(5);
    //     expect(await medianVote.getRoundStatus(0)).to.equal("FINALIZED");
    // });
    // it("should correctly determine candidate status after round finalization", async function () {
    //     const { medianVote, candidate1 } = await loadFixture(deployMedianVoteFixture);
    //     // Assuming votes have been cast and round finalized
    //     expect(await medianVote.getCandidateStatus(candidate1.address, 0)).to.be.oneOf(["REGISTERED", "ELIMINATED"]);
    // });
    // Additional tests for checking status in different scenarios
  });
});
