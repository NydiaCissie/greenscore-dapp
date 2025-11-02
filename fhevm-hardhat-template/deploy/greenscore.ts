import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const rewardsOperator = process.env.GREEN_SCORE_REWARDS_OPERATOR ?? deployer;
  const leaderboardOperator = process.env.GREEN_SCORE_LEADERBOARD_OPERATOR ?? deployer;

  const deployment = await deploy("GreenScore", {
    from: deployer,
    args: [rewardsOperator, leaderboardOperator],
    log: true,
  });

  console.log(`GreenScore contract deployed at ${deployment.address}`);
};

export default func;
func.id = "deploy_greenscore";
func.tags = ["GreenScore"];


