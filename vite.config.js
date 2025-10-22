import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteEnvs } from 'vite-envs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteEnvs({
      declarationFile: ".env"
    })
  ],
  server: {
    host: '0.0.0.0', // Bind to 0.0.0.0 to allow external access
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
    allowedHosts: true
  },
  build: {
    rollupOptions: {
      input: {
        main: "./index.html",
      },
    },
  },
});
