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
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
