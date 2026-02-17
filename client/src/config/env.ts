type DeployType = "slot" | "sepolia" | "mainnet";

const DEPLOY_TYPES: DeployType[] = ["slot", "sepolia", "mainnet"];

const isHttpUrl = (value: string) => /^https?:\/\//.test(value);
const isHexLike = (value: string) => /^0x[0-9a-fA-F]+$/.test(value);

export function validateEnv(): void {
  const {
    VITE_PUBLIC_DEPLOY_TYPE,
    VITE_PUBLIC_NODE_URL,
    VITE_PUBLIC_TORII,
    VITE_PUBLIC_NAMESPACE,
    VITE_PUBLIC_WORLD_ADDRESS,
    VITE_PUBLIC_GAME_TOKEN_ADDRESS,
    VITE_PUBLIC_CUBE_TOKEN_ADDRESS,
    VITE_PUBLIC_CUBE_TOKEN_ID,
  } = import.meta.env;

  const errors: string[] = [];

  if (VITE_PUBLIC_DEPLOY_TYPE && !DEPLOY_TYPES.includes(VITE_PUBLIC_DEPLOY_TYPE as DeployType)) {
    errors.push(
      `VITE_PUBLIC_DEPLOY_TYPE must be one of ${DEPLOY_TYPES.join(", ")} (got: ${VITE_PUBLIC_DEPLOY_TYPE})`,
    );
  }

  if (VITE_PUBLIC_NODE_URL && !isHttpUrl(VITE_PUBLIC_NODE_URL)) {
    errors.push("VITE_PUBLIC_NODE_URL must be an http(s) URL");
  }

  if (VITE_PUBLIC_TORII && !isHttpUrl(VITE_PUBLIC_TORII)) {
    errors.push("VITE_PUBLIC_TORII must be an http(s) URL");
  }

  if (VITE_PUBLIC_NAMESPACE && !/^[a-z0-9_]+$/i.test(VITE_PUBLIC_NAMESPACE)) {
    errors.push("VITE_PUBLIC_NAMESPACE should be alphanumeric/underscore only");
  }

  for (const [key, value] of [
    ["VITE_PUBLIC_WORLD_ADDRESS", VITE_PUBLIC_WORLD_ADDRESS],
    ["VITE_PUBLIC_GAME_TOKEN_ADDRESS", VITE_PUBLIC_GAME_TOKEN_ADDRESS],
    ["VITE_PUBLIC_CUBE_TOKEN_ADDRESS", VITE_PUBLIC_CUBE_TOKEN_ADDRESS],
  ] as const) {
    if (value && !isHexLike(value)) {
      errors.push(`${key} must be a hex string starting with 0x`);
    }
  }

  if (VITE_PUBLIC_CUBE_TOKEN_ID && !isHexLike(VITE_PUBLIC_CUBE_TOKEN_ID)) {
    errors.push("VITE_PUBLIC_CUBE_TOKEN_ID must be a hex string starting with 0x");
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join("\n- ")}`);
  }
}
