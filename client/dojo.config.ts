import local from "../contracts/manifests/dev/manifest.json";
import slot from "../contracts/manifests/slot/manifest.json";

const {
  VITE_PUBLIC_NODE_URL,
  VITE_PUBLIC_TORII,
  VITE_PUBLIC_MASTER_ADDRESS,
  VITE_PUBLIC_MASTER_PRIVATE_KEY,
  VITE_PUBLIC_ACCOUNT_CLASS_HASH,
  VITE_PUBLIC_FEE_TOKEN_ADDRESS,
  VITE_PUBLIC_SEPOLIA,
  VITE_PUBLIC_SLOT,
} = import.meta.env;

export type Config = ReturnType<typeof dojoConfig>;

export function dojoConfig() {
  return {
    rpcUrl: VITE_PUBLIC_NODE_URL || "http://localhost:5050",
    toriiUrl: VITE_PUBLIC_TORII || "http://0.0.0.0:8080",
    masterAddress:
      VITE_PUBLIC_MASTER_ADDRESS ||
      "0x6162896d1d7ab204c7ccac6dd5f8e9e7c25ecd5ae4fcb4ad32e57786bb46e03",
    masterPrivateKey:
      VITE_PUBLIC_MASTER_PRIVATE_KEY ||
      "0x1800000000300000180000000000030000000000003006001800006600",
    accountClassHash:
      VITE_PUBLIC_ACCOUNT_CLASS_HASH ||
      "0x05400e90f7e0ae78bd02c77cd75527280470e2fe19c54970dd79dc37a9d3645c",
    feeTokenAddress:
      VITE_PUBLIC_FEE_TOKEN_ADDRESS ||
      "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    manifest: VITE_PUBLIC_SLOT ? slot : VITE_PUBLIC_SEPOLIA ? local : local,
  };
}
