const deployType = import.meta.env.VITE_PUBLIC_DEPLOY_TYPE as
  | "sepolia"
  | "mainnet"
  | "slot"
  | "slotdev"
  | "sepoliadev1"
  | "sepoliadev2"
  | undefined;

const modules = import.meta.glob("../../../contracts/manifest_*.json", {
  eager: true,
});

const pick = (name: string) => modules[`../../../contracts/manifest_${name}.json`];

const selectedModule =
  (deployType && pick(deployType)) || pick("slot") || pick("sepolia") || pick("mainnet");

export const manifest = (selectedModule as any)?.default ?? {};

export type Manifest = typeof manifest;
