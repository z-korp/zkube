import slot from "../../../contracts/manifest_slot.json";
import sepolia from "../../../contracts/manifest_sepolia.json";
import mainnet from "../../../contracts/manifest_mainnet.json";

const deployType = import.meta.env.VITE_PUBLIC_DEPLOY_TYPE;

const manifests: Record<string, typeof slot> = {
  sepolia,
  mainnet,
  slot,
};

if (!(deployType in manifests)) {
  throw new Error(
    `Unknown VITE_PUBLIC_DEPLOY_TYPE: "${deployType}". Expected one of: ${Object.keys(manifests).join(", ")}`,
  );
}

export const manifest = manifests[deployType];

export type Manifest = typeof manifest;
