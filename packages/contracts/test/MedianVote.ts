import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
describe.only("MedianVote", function () {
  async function deployMedianVotingFixture() {
    const [
      deployer,
      alice,
      bob,
      jane,
      alisha,
      newCandidate,
      mario,
      luigi,
      charlie,
      dave,
      eve,
    ] = await ethers.getSigners();

    const MedianVoteBase = await ethers.getContractFactory("MedianVoteBase");
    const MVB = await MedianVoteBase.deploy();

    return {
      MVB,
      deployer,
      alice,
      bob,
      jane,
      alisha,
      newCandidate,
      mario,
      luigi,
      charlie,
      dave,
      eve,
    };
  }

  describe("Unit Tests", function () {
    it("should deploy the contract successfully", async () => {
      const MedianVoteBase = await ethers.getContractFactory("MedianVoteBase");
      const MVB = await MedianVoteBase.deploy();

      expect(await MVB.getAddress()).to.properAddress;
    });

    it("Should register a candidate:", async () => {
      const { MVB, alice, bob } = await loadFixture(deployMedianVotingFixture);

      await expect(MVB.connect(alice).register()).to.emit(MVB, "UserRegistered").withArgs(alice.address);
    });
  });
});
