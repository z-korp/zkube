interface ImportMetaEnv {
  readonly VITE_PUBLIC_DEPLOY_TYPE:
    | "sepolia"
    | "sepoliadev1"
    | "sepoliadev2"
    | "slot"
    | "slotdev";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
