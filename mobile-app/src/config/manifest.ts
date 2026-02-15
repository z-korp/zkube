import slot from "../../../contracts/manifest_slot.json";
import sepolia from "../../../contracts/manifest_sepolia.json";
import mainnet from "../../../contracts/manifest_mainnet.json";

const deployType = import.meta.env.VITE_PUBLIC_DEPLOY_TYPE;

const manifests = {
  sepolia,
  mainnet,
  slot,
} as const;

if (!(deployType in manifests)) {
  throw new Error(
    `Unknown VITE_PUBLIC_DEPLOY_TYPE: "${deployType}". Expected one of: ${Object.keys(manifests).join(", ")}`,
  );
}

type ManifestKey = keyof typeof manifests;
export const manifest = manifests[deployType as ManifestKey];

export type Manifest = typeof manifest;
