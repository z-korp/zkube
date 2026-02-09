import path from "path";
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import react from "@vitejs/plugin-react";
import topLevelAwait from "vite-plugin-top-level-await";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait(), mkcert()],
  build: {
    target: "ES2022",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/src/cartridgeConnector")) {
            return "wallet";
          }

          if (id.includes("/src/dojo/setup")) {
            return "dojo-setup";
          }

          if (!id.includes("node_modules")) return;

          if (
            id.includes("pixi.js") ||
            id.includes("@pixi/react")
          ) {
            return "pixi";
          }

          if (id.includes("pixi-filters")) {
            return "pixi-filters";
          }

          if (
            id.includes("@dojoengine") ||
            id.includes("starknet") ||
            id.includes("@starknet-react") ||
            id.includes("@cartridge") ||
            id.includes("metagame-sdk") ||
            id.includes("@dojo")
          ) {
            return "chain";
          }

          if (
            id.includes("@radix-ui") ||
            id.includes("framer-motion") ||
            id.includes("lucide-react") ||
            id.includes("@fortawesome")
          ) {
            return "ui";
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5176, // Different port from budokan
  },
});
