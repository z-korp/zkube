import path from "path";
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import react from "@vitejs/plugin-react";
import topLevelAwait from "vite-plugin-top-level-await";
import tailwindcss from "@tailwindcss/vite";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), wasm(), topLevelAwait(), mkcert()],
  build: {
    target: "ES2022",
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-starknet": [
            "starknet",
            "@starknet-react/core",
            "@starknet-react/chains",
          ],
          "vendor-dojo": [
            "@dojoengine/core",
            "@dojoengine/react",
            "@dojoengine/recs",
            "@dojoengine/sdk",
            "@dojoengine/state",
            "@dojoengine/torii-client",
            "@dojoengine/utils",
          ],
          "vendor-ui": ["motion"],
          "vendor-particles": ["@tsparticles/engine", "@tsparticles/slim"],
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
    host: true, // Allow access from local network
    port: 5175,
  },
});
