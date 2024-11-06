import local from "../../../contracts/manifest_dev.json";
import slot from "../../../contracts/manifest_slot.json";
import slotdev from "../../../contracts/manifest_slotdev.json";
import sepolia from "../../../contracts/manifest_sepolia.json";
import sepoliadev1 from "../../../contracts/manifest_sepoliadev1.json";
import sepoliadev2 from "../../../contracts/manifest_sepoliadev2.json";

const deployType = import.meta.env.VITE_PUBLIC_DEPLOY_TYPE;

const manifests = {
  sepolia,
  sepoliadev1,
  sepoliadev2,
  slot,
  slotdev,
};

// Fallback to `local` if deployType is not a key in `manifests`
export const manifest = deployType in manifests ? manifests[deployType] : local;

export type Manifest = typeof manifest;
