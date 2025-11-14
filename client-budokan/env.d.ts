interface ImportMetaEnv {
  readonly VITE_PUBLIC_DEPLOY_TYPE:
    | "mainnet"
    | "sepolia"
    | "sepoliadev1"
    | "sepoliadev2"
    | "slot"
    | "slotdev";
  readonly VITE_PUBLIC_NODE_URL: string;
  readonly VITE_PUBLIC_DENSHOKAN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
