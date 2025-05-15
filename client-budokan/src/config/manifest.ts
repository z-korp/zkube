import slot from "../../../contracts/manifest_slot.json";
import sepolia from "../../../contracts/manifest_sepolia.json";
import mainnet from "../../../contracts/manifest_mainnet.json";

const deployType = import.meta.env.VITE_PUBLIC_DEPLOY_TYPE;

const manifests = {
  sepolia,
  mainnet,
  slot,
};

// Fallback to `local` if deployType is not a key in `manifests`
export const manifest = deployType in manifests ? manifests[deployType] : local;

export type Manifest = typeof manifest;
