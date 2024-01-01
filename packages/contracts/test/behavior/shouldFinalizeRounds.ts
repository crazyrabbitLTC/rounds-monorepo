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
} from "../MedianVoteUtils";
import { MedianVote } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Signer } from "ethers";
import { deployMedianVoteFixture } from "../MedianVote";

export function shouldFinalizeRounds(): void {
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
}