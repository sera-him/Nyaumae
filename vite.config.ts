import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { spawn } from "child_process"

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    {
      name: 'generate-api-html',
      closeBundle() {
        return new Promise((resolve, reject) => {
          const proc = spawn('node', [path.resolve(__dirname, 'scripts/generate-api-html.mjs')], {
            stdio: 'inherit',
          });
          proc.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`exit code ${code}`)));
        });
      },
    },
  ],
  server: {
    port: 3000,
  },
  build: {
    // WebLLM is a prebundled browser runtime and is loaded only for the Browser WebGPU provider.
    // Keep it in its own lazy chunk and do not report its intentional size as a build regression.
    chunkSizeWarningLimit: 7000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules[\\/]@mlc-ai[\\/]web-llm[\\/]/.test(id)) return 'web-llm';
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
