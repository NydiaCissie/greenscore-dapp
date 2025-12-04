// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title GreenScore - Privacy-preserving environmental behavior scoring
/// @notice Aggregates encrypted low-carbon actions, maintains anonymized leaderboards, and manages encrypted rewards.
/// @dev Uses FHEVM's euint64 types for all sensitive score calculations
contract GreenScore is ZamaEthereumConfig {
    struct UserData {
        euint64 encryptedScore;
        euint64 encryptedActionCount;
        euint64 encryptedPendingRewards;
        uint64 plainActionCount;
    }

    uint8 public constant BUCKET_COUNT = 5;
    address public owner;
    address public rewardsOperator;
    address public leaderboardOperator;

    mapping(address => UserData) private _users;
    euint64 private _encryptedGlobalScore;
    euint64 private _encryptedGlobalActions;
    mapping(uint8 => euint64) private _bucketAggregates;
    euint64[BUCKET_COUNT] private _leaderboardSlots;

    event ActionSubmitted(
        address indexed account,
        uint8 indexed bucketIndex,
        bytes32 descriptionHash,
        uint64 cumulativePlainActions
    );
    event LeaderboardSlotUpdated(uint8 indexed slotIndex);
    event RewardSeeded(address indexed account);
    event RewardClaimed(address indexed account);
    event OperatorsUpdated(address rewardsOperator, address leaderboardOperator);

    error Unauthorized();
    error InvalidBucket();
    error ZeroAddress();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyRewardsOperator() {
        if (msg.sender != rewardsOperator) revert Unauthorized();
        _;
    }

    modifier onlyLeaderboardOperator() {
        if (msg.sender != leaderboardOperator) revert Unauthorized();
        _;
    }

    constructor(address initialRewardsOperator, address initialLeaderboardOperator) {
        owner = msg.sender;
        rewardsOperator = initialRewardsOperator;
        leaderboardOperator = initialLeaderboardOperator;
    }

    /// @notice Update operator addresses controlling rewards and leaderboard maintenance.
    function setOperators(address newRewardsOperator, address newLeaderboardOperator) external onlyOwner {
        if (newRewardsOperator == address(0) || newLeaderboardOperator == address(0)) {
            revert ZeroAddress();
        }
        rewardsOperator = newRewardsOperator;
        leaderboardOperator = newLeaderboardOperator;
        emit OperatorsUpdated(newRewardsOperator, newLeaderboardOperator);
    }

    /// @notice Submit an encrypted environmental action and update aggregates.
    /// @param encryptedPoints The encrypted weighted points for the action.
    /// @param pointsProof The input proof for the encrypted points.
    /// @param encryptedActionIncrement The encrypted increment for action counters (typically the encrypted constant 1).
    /// @param actionProof The input proof tied to the action counter increment.
    /// @param bucketIndex Index of the anonymized bucket used for leaderboard aggregation.
    /// @param descriptionHash Hash of the plaintext description (kept off-chain).
    /// @param plainActionIncrement Plain count increment for local analytics (non-sensitive metadata).
    /// @return encryptedScore The updated encrypted score for the caller.
    function submitAction(
        externalEuint64 encryptedPoints,
        bytes calldata pointsProof,
        externalEuint64 encryptedActionIncrement,
        bytes calldata actionProof,
        uint8 bucketIndex,
        bytes32 descriptionHash,
        uint64 plainActionIncrement
    ) external returns (euint64 encryptedScore) {
        if (bucketIndex >= BUCKET_COUNT) revert InvalidBucket();
        if (plainActionIncrement == 0) revert Unauthorized();

        euint64 points = FHE.fromExternal(encryptedPoints, pointsProof);
        euint64 actionIncrement = FHE.fromExternal(encryptedActionIncrement, actionProof);

        UserData storage user = _users[msg.sender];

        user.encryptedScore = FHE.add(user.encryptedScore, points);
        user.encryptedActionCount = FHE.add(user.encryptedActionCount, actionIncrement);
        user.plainActionCount += plainActionIncrement;

        _encryptedGlobalScore = FHE.add(_encryptedGlobalScore, points);
        _encryptedGlobalActions = FHE.add(_encryptedGlobalActions, actionIncrement);
        _bucketAggregates[bucketIndex] = FHE.add(_bucketAggregates[bucketIndex], points);

        _allowUserDecrypt(user.encryptedScore, msg.sender);
        _allowUserDecrypt(user.encryptedActionCount, msg.sender);
        _allowCollectiveDecrypt(_encryptedGlobalScore);
        _allowCollectiveDecrypt(_encryptedGlobalActions);
        _allowCollectiveDecrypt(_bucketAggregates[bucketIndex]);
        FHE.allow(_encryptedGlobalScore, msg.sender);
        FHE.allow(_encryptedGlobalActions, msg.sender);
        FHE.allow(_bucketAggregates[bucketIndex], msg.sender);

        emit ActionSubmitted(msg.sender, bucketIndex, descriptionHash, user.plainActionCount);

        return user.encryptedScore;
    }

    /// @notice Read the encrypted score for an account.
    function getEncryptedScore(address account) external view returns (euint64) {
        return _users[account].encryptedScore;
    }

    /// @notice Read the encrypted action counter for an account.
    function getEncryptedActionCount(address account) external view returns (euint64) {
        return _users[account].encryptedActionCount;
    }

    /// @notice Read the encrypted pending rewards for an account.
    function getEncryptedPendingRewards(address account) external view returns (euint64) {
        return _users[account].encryptedPendingRewards;
    }

    /// @notice Read the plaintext action count metadata for an account.
    function getPlainActionCount(address account) external view returns (uint64) {
        return _users[account].plainActionCount;
    }

    /// @notice Read the encrypted global score aggregation.
    function getEncryptedGlobalScore() external view returns (euint64) {
        return _encryptedGlobalScore;
    }

    /// @notice Read the encrypted global action counter aggregation.
    function getEncryptedGlobalActions() external view returns (euint64) {
        return _encryptedGlobalActions;
    }

    /// @notice Read the encrypted aggregate for a bucket.
    function getBucketAggregate(uint8 bucketIndex) external view returns (euint64) {
        if (bucketIndex >= BUCKET_COUNT) revert InvalidBucket();
        return _bucketAggregates[bucketIndex];
    }

    /// @notice Read an encrypted leaderboard slot maintained by the leaderboard operator.
    function getLeaderboardSlot(uint8 slotIndex) external view returns (euint64) {
        if (slotIndex >= BUCKET_COUNT) revert InvalidBucket();
        return _leaderboardSlots[slotIndex];
    }

    /// @notice Leaderboard operator updates an anonymized encrypted leaderboard slot.
    function updateLeaderboardSlot(
        uint8 slotIndex,
        externalEuint64 encryptedValue,
        bytes calldata proof
    ) external onlyLeaderboardOperator {
        if (slotIndex >= BUCKET_COUNT) revert InvalidBucket();

        euint64 slotValue = FHE.fromExternal(encryptedValue, proof);
        _leaderboardSlots[slotIndex] = slotValue;

        FHE.allowThis(_leaderboardSlots[slotIndex]);
        _allowOperatorDecrypt(_leaderboardSlots[slotIndex], leaderboardOperator);

        emit LeaderboardSlotUpdated(slotIndex);
    }

    /// @notice Rewards operator seeds encrypted rewards for a user.
    function seedReward(
        address account,
        externalEuint64 encryptedRewardIncrement,
        bytes calldata proof
    ) external onlyRewardsOperator {
        euint64 rewardInc = FHE.fromExternal(encryptedRewardIncrement, proof);
        UserData storage user = _users[account];

        user.encryptedPendingRewards = FHE.add(user.encryptedPendingRewards, rewardInc);

        _allowUserDecrypt(user.encryptedPendingRewards, account);
        _allowOperatorDecrypt(user.encryptedPendingRewards, rewardsOperator);

        emit RewardSeeded(account);
    }

    /// @notice Users claim encrypted rewards by providing an encrypted amount to deduct from pending rewards.
    function claimReward(
        externalEuint64 encryptedClaimAmount,
        bytes calldata proof
    ) external returns (euint64) {
        euint64 claimAmount = FHE.fromExternal(encryptedClaimAmount, proof);
        UserData storage user = _users[msg.sender];

        user.encryptedPendingRewards = FHE.sub(user.encryptedPendingRewards, claimAmount);

        _allowUserDecrypt(user.encryptedPendingRewards, msg.sender);
        _allowOperatorDecrypt(user.encryptedPendingRewards, rewardsOperator);

        emit RewardClaimed(msg.sender);
        return user.encryptedPendingRewards;
    }

    /// @notice Owner can transfer ownership.
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        owner = newOwner;
    }

    function _allowUserDecrypt(euint64 value, address account) private {
        FHE.allowThis(value);
        FHE.allow(value, account);
        _allowOperatorDecrypt(value, rewardsOperator);
        _allowOperatorDecrypt(value, leaderboardOperator);
    }

    function _allowCollectiveDecrypt(euint64 value) private {
        FHE.allowThis(value);
        _allowOperatorDecrypt(value, rewardsOperator);
        _allowOperatorDecrypt(value, leaderboardOperator);
    }

    function _allowOperatorDecrypt(euint64 value, address operator) private {
        if (operator != address(0)) {
            FHE.allow(value, operator);
        }
    }
}

