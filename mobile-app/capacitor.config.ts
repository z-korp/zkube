import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.zkube.game",
  appName: "zKube",
  webDir: "dist",
  // Uncomment for development with hot reload:
  // server: {
  //   url: "http://YOUR_LOCAL_IP:5126",
  //   cleartext: true,
  // },
  plugins: {
    // Enable HTTP cookies for Starknet RPC calls
    CapacitorCookies: {
      enabled: true,
    },
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
