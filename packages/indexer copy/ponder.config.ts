import { createConfig } from "@ponder/core";
import { parseAbiItem } from "abitype";
import { http } from "viem";

// import { LlamaCoreAbi } from "./abis/LlamaCoreAbi";
// import { LlamaPolicyAbi } from "./abis/LlamaPolicyAbi";
import { RoundsBaseAbi } from "./abis/RoundsBaseAbi";

const llamaFactoryEvent = parseAbiItem(
  "event LlamaInstanceCreated(address indexed deployer, string indexed name, address llamaCore, address llamaExecutor, address llamaPolicy, uint256 chainId)"
);

export default createConfig({
  networks: {
    localhost: {
      chainId: 31337,
      transport: http("http://localhost:8545"),
    },
    sepolia: {
      chainId: 11155111,
      transport: http(process.env.PONDER_RPC_URL_11155111),
    },
  },
  contracts: {
    RoundsBase: {
      network: "localhost",
      abi: RoundsBaseAbi,
      address: "0xf5059a5D33d5853360D16C683c16e67980206f36"
    },
    // LlamaCore: {
    //   network: "sepolia",
    //   abi: LlamaCoreAbi,
    //   factory: {
    //     address: "0xFf5d4E226D9A3496EECE31083a8F493edd79AbEB",
    //     event: llamaFactoryEvent,
    //     parameter: "llamaCore",
    //   },
    //   startBlock: 4121269,
    // },
    // LlamaPolicy: {
    //   network: "sepolia",
    //   abi: LlamaPolicyAbi,
    //   factory: {
    //     address: "0xFf5d4E226D9A3496EECE31083a8F493edd79AbEB",
    //     event: llamaFactoryEvent,
    //     parameter: "llamaPolicy",
    //   },
    //   startBlock: 4121269,
    // },
  },
});
