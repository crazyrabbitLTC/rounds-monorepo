import { ethers } from "hardhat";
import { expect } from "chai";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

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

    // call initalizer
    await medianVote.initialize(oneMinuteInSeconds, oneMinuteInSeconds);

    // Additional setup if required
    return {
      medianVote,
      deployer,
      voter1,
      voter2,
      candidate1,
      candidate2,
      oneMinuteInSeconds,
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

      // call initalizer
      await expect(
        medianVote.initialize(oneMinuteInSeconds, oneMinuteInSeconds)
      ).to.emit(medianVote, "Initialized");
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
      await medianVote.registerCandidate(candidate1.address);
      const status = await medianVote.getCandidateStatus(candidate1.address, 0);
      expect(candidateStatusToString(status)).to.equal("REGISTERED");
    });

    it("should not allow candidates to register after rounds started", async function () {
      const { medianVote, candidate1 } = await loadFixture(
        deployMedianVoteFixture
      );
      await medianVote.startNextRound();
      await expect(medianVote.registerCandidate(candidate1.address))
        .to.be.revertedWithCustomError(medianVote, "RegistrationClosed");

    });

    it("should not allow candidates to register more than once", async function () {
      const { medianVote, candidate1 } = await loadFixture(deployMedianVoteFixture);
      
      await medianVote.registerCandidate(candidate1.address);
      await expect(medianVote.registerCandidate(candidate1.address))
        .to.be.revertedWithCustomError(medianVote, "CandidateAlreadyRegistered");
    });

    it("should revert when registering the zero address", async function () {
      const { medianVote } = await loadFixture(deployMedianVoteFixture);
      const zeroAddress = "0x0000000000000000000000000000000000000000";
    
      await expect(medianVote.registerCandidate(zeroAddress))
        .to.be.revertedWith("InvalidCandidate"); // Replace with the specific error message used in your contract
    });

    it("should return UNREGISTERED for unregistered candidates", async function () {
      const { medianVote, candidate2 } = await loadFixture(deployMedianVoteFixture);
    
      const status = await medianVote.getCandidateStatus(candidate2.address, 0);
      expect(candidateStatusToString(status)).to.equal("UNREGISTERED");
    });

    it("should emit an event when a candidate registers", async function () {
      const { medianVote, candidate1 } = await loadFixture(deployMedianVoteFixture);
    
      await expect(medianVote.registerCandidate(candidate1.address))
        .to.emit(medianVote, "CandidateRegistered")
        .withArgs(candidate1.address);
    });
    

  });

  describe("Voting", function () {
    it("should allow voting for a registered candidate", async function () {
      const { medianVote, candidate1, oneMinuteInSeconds } = await loadFixture(
        deployMedianVoteFixture
      );

      // register candidate
      await medianVote.registerCandidate(candidate1.address);
      // start round
      await medianVote.startNextRound();
      // move time forward by 1 minute
      await time.increase(oneMinuteInSeconds + 1);
      // vote for candidate
      await expect(
        medianVote.connect(candidate1).castVote(candidate1.address, 10)
      )
        .to.emit(medianVote, "VoteCast")
        .withArgs(candidate1.address, candidate1.address, 0, 10);

      // Validate vote count or other relevant assertions
      expect(await medianVote.getCandidateVotes(candidate1.address, 0)).to.equal(10);
    });
    // Additional tests for voting logic
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
