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

export function shouldHandleMedianThreshold(): void {
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
    it.only("should handle multiple rounds with proper eliminations", async function () {
      // Test setup: votes for candidates in each round
      const votesPerRound = [
        [5, 10, 15], // Round 0
        [7, 0, 0], // Round 1
        [3, 0, 0], // Round 2
      ];
      const medianThresholds = [8, 6, 4]; // Median thresholds for each round

      for (let round = 0; round < votesPerRound.length; round++) {
        await medianVote.startNextRound();
        await time.increase(roundDelay + 1);

        // Cast votes
        for (let i = 0; i < 3; i++) {
          if (votesPerRound[round][i] > 0) {
            await medianVote
              .connect([candidate1, candidate2, candidate3][i])
              .castVote(
                [candidate1, candidate2, candidate3][i].address,
                votesPerRound[round][i]
              );
          }
        }

        // Finalize round
        await time.increase(roundDelay + roundDuration + 1);
        await medianVote.finalizeRound(medianThresholds[round]);

        // Check candidate statuses
        for (let i = 0; i < 3; i++) {
          const status = candidateStatusToString(
            await medianVote.getCandidateStatus(
              [candidate1, candidate2, candidate3][i].address,
              round
            )
          );
          let expectedStatus;
          console.log(
            "Actual Status: ",
            status,
            " of candidate: ",
            i
          );

          if (round === 0) {
            expectedStatus = i > 0 ? "ELIMINATED" : "REGISTERED"; // Only candidate1 should be registered
          } else {
            expectedStatus = "REGISTERED"; // candidate1 continues being registered
          }
          console.log(
            "Expected Status: ",
            expectedStatus,
            " of candidate: ",
            i
          );
          expect(status).to.equal(expectedStatus);
        }
      }
    });

    it("should correctly handle multiple sequential rounds with elimination", async function () {
      const candidates = [candidate1, candidate2, candidate3];
      const voteCounts = [5, 10, 15]; // Adjust based on your median threshold logic

      // Round 0
      await medianVote.startNextRound();
      await time.increase(roundDelay + 1);

      // Cast votes in Round 0
      for (let i = 0; i < candidates.length; i++) {
        await medianVote
          .connect(candidates[i])
          .castVote(candidates[i].address, voteCounts[i]);
      }

      // Finalize Round 0
      await time.increase(roundDelay + roundDuration + 1);
      await medianVote.finalizeRound(10);

      // Check statuses after Round 0
      for (let candidate of candidates) {
        const status = candidateStatusToString(
          await medianVote.getCandidateStatus(candidate.address, 0)
        );
      }
      const round0Status = await medianVote.getRoundStatus(0);

      // Round 1
      // console.log("Starting Round: 1");
      await medianVote.startNextRound();
      await time.increase(roundDelay + 1);

      // Cast votes in Round 1
      for (let i = 0; i < candidates.length; i++) {
        let status = candidateStatusToString(
          await medianVote.getCandidateStatus(candidates[i].address, 0)
        );
        if (status !== "ELIMINATED") {
          await medianVote
            .connect(candidates[i])
            .castVote(candidates[i].address, voteCounts[i]);
        }
      }

      // Finalize Round 1
      await time.increase(roundDelay + roundDuration + 1);
      await expect(medianVote.finalizeRound(10)).to.emit(
        medianVote,
        "RoundFinalized"
      );

      // Check statuses after Round 1
      for (let candidate of candidates) {
        const status = candidateStatusToString(
          await medianVote.getCandidateStatus(candidate.address, 1)
        );
      }
      const round1Status = await medianVote.getRoundStatus(1);

      // Round 2
      await medianVote.startNextRound();
      await time.increase(roundDelay + 1);

      // Cast votes in Round 2
      for (let i = 0; i < candidates.length; i++) {
        let status = candidateStatusToString(
          await medianVote.getCandidateStatus(candidates[i].address, 1)
        );
        if (status !== "ELIMINATED") {
          await medianVote
            .connect(candidates[i])
            .castVote(candidates[i].address, voteCounts[i]);
        }
      }

      // Finalize Round 2
      await time.increase(roundDelay + roundDuration + 1);
      await medianVote.finalizeRound(10);

      // Check statuses after Round 2
      for (let candidate of candidates) {
        const status = candidateStatusToString(
          await medianVote.getCandidateStatus(candidate.address, 2)
        );
      }
      const round2Status = await medianVote.getRoundStatus(2);
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
}
