interface ImportMetaEnv {
  readonly VITE_PUBLIC_DEPLOY_TYPE:
    | "mainnet"
    | "sepolia"
    | "sepoliadev1"
    | "sepoliadev2"
    | "slot"
    | "slotdev";
  readonly VITE_PUBLIC_TORII: string;
  readonly VITE_PUBLIC_NODE_URL: string;
  readonly VITE_PUBLIC_MASTER_ADDRESS: string;
  readonly VITE_PUBLIC_MASTER_PRIVATE_KEY: string;
  readonly VITE_PUBLIC_ACCOUNT_CLASS_HASH: string;
  readonly VITE_PUBLIC_FEE_TOKEN_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
