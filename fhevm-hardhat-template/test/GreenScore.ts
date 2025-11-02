import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { GreenScore, GreenScore__factory } from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  operator: HardhatEthersSigner;
};

async function deployFixture(signers: Signers) {
  const factory = (await ethers.getContractFactory("GreenScore")) as GreenScore__factory;
  const contract = (await factory.deploy(signers.operator.address, signers.operator.address)) as GreenScore;
  const contractAddress = await contract.getAddress();
  return { contract, contractAddress };
}

describe("GreenScore", function () {
  let signers: Signers;
  let contract: GreenScore;
  let contractAddress: string;

  before(async function () {
    const [deployer, alice, bob, operator] = await ethers.getSigners();
    signers = { deployer, alice, bob, operator };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This hardhat test suite requires the FHEVM mock environment");
      this.skip();
    }

    ({ contract, contractAddress } = await deployFixture(signers));
  });

  it("initial state should be zeroed", async function () {
    const aliceScore = await contract.getEncryptedScore(signers.alice.address);
    const globalScore = await contract.getEncryptedGlobalScore();

    expect(aliceScore).to.eq(ethers.ZeroHash);
    expect(globalScore).to.eq(ethers.ZeroHash);
  });

  it("should add encrypted action and update aggregates", async function () {
    const points = 25n;
    const bucketIndex = 2;
    const descriptionHash = ethers.id("metro rides");

    const encryptedPoints = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add64(points)
      .encrypt();

    const encryptedActionIncrement = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add64(1n)
      .encrypt();

    await contract
      .connect(signers.alice)
      .submitAction(
        encryptedPoints.handles[0],
        encryptedPoints.inputProof,
        encryptedActionIncrement.handles[0],
        encryptedActionIncrement.inputProof,
        bucketIndex,
        descriptionHash,
        1,
      );

    const encryptedScore = await contract.getEncryptedScore(signers.alice.address);
    const decryptedScore = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedScore,
      contractAddress,
      signers.alice,
    );

    expect(decryptedScore).to.eq(points);

    const encryptedBucket = await contract.getBucketAggregate(bucketIndex);
    const decryptedBucket = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedBucket,
      contractAddress,
      signers.alice,
    );

    expect(decryptedBucket).to.eq(points);

    const plainCount = await contract.getPlainActionCount(signers.alice.address);
    expect(plainCount).to.eq(1);
  });

  it("rewards operator can seed and user can claim encrypted rewards", async function () {
    const rewardSeed = 15n;

    const encryptedReward = await fhevm
      .createEncryptedInput(contractAddress, signers.operator.address)
      .add64(rewardSeed)
      .encrypt();

    await contract
      .connect(signers.operator)
      .seedReward(signers.alice.address, encryptedReward.handles[0], encryptedReward.inputProof);

    const pending = await contract.getEncryptedPendingRewards(signers.alice.address);
    const pendingClear = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      pending,
      contractAddress,
      signers.alice,
    );
    expect(pendingClear).to.eq(rewardSeed);

    const encryptedClaim = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add64(5n)
      .encrypt();

    await contract
      .connect(signers.alice)
      .claimReward(encryptedClaim.handles[0], encryptedClaim.inputProof);

    const pendingAfter = await contract.getEncryptedPendingRewards(signers.alice.address);
    const pendingAfterClear = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      pendingAfter,
      contractAddress,
      signers.alice,
    );
    expect(pendingAfterClear).to.eq(rewardSeed - 5n);
  });

  it("leaderboard operator can update slots", async function () {
    const slotValue = 100n;
    const encryptedSlot = await fhevm
      .createEncryptedInput(contractAddress, signers.operator.address)
      .add64(slotValue)
      .encrypt();

    await contract
      .connect(signers.operator)
      .updateLeaderboardSlot(0, encryptedSlot.handles[0], encryptedSlot.inputProof);

    const slot = await contract.getLeaderboardSlot(0);
    const clearSlot = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      slot,
      contractAddress,
      signers.operator,
    );

    expect(clearSlot).to.eq(slotValue);
  });
});


