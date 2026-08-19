import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";

const base = process.env.REPO_BASE || "/";

export default defineConfig({
  base,
  plugins: [
    legacy({
      targets: ["defaults", "ios >= 12"],
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        /**
         * React and the router change a few times a year; the game changes
         * every push. Keeping them in a separate file means a returning
         * player re-downloads the game and keeps the framework from cache.
         *
         * OpenLayers is NOT listed here on purpose. It is only imported by
         * the map route, which is loaded lazily, so Rollup already puts it
         * in that route's chunk — naming it here would pull it back into a
         * chunk the front page has to fetch.
         */
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
});
