import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin, type ViteDevServer } from "vite"
import { spawn } from "child_process"

function routeGuardDataPlugin(): Plugin {
  const generate = () => new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, ['--experimental-strip-types', path.resolve(__dirname, 'scripts/generate-route-guard-data.ts')], {
      stdio: 'inherit',
    });
    proc.on('exit', (code) => code === 0 ? resolve(null) : reject(new Error(`route guard data generation failed with exit code ${code}`)));
  });

  return {
    name: 'generate-route-guard-data',
    async buildStart() {
      await generate();
    },
    configureServer(server: ViteDevServer) {
      server.watcher.on('change', async (file: string) => {
        if (/[\\/]src[\\/]data[\\/](characters|extraCharacters|stories)\.ts$/.test(file)) {
          await generate();
        }
      });
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    routeGuardDataPlugin(),
    {
      name: 'generate-api-html',
      closeBundle() {
        return new Promise((resolve, reject) => {
          const proc = spawn(process.execPath, [path.resolve(__dirname, 'scripts/generate-api-html.mjs')], {
            stdio: 'inherit',
          });
          proc.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`exit code ${code}`)));
        });
      },
    },
  ],
  server: {
    port: Number(process.env.PORT) || 3000,
    host: '0.0.0.0',
    // 发布到反向代理域名时需要显式放行，否则 Vite 会拒绝请求。
    allowedHosts: true,
  },
  preview: {
    port: Number(process.env.PORT) || 4173,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    // WebLLM is a prebundled browser runtime and is loaded only for the Browser WebGPU provider.
    // Keep it in its own lazy chunk and do not report its intentional size as a build regression.
    chunkSizeWarningLimit: 7000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules[\\/]@mlc-ai[\\/]web-llm[\\/]/.test(id)) return 'web-llm';
          // Stable vendor chunks: these change far less often than app code,
          // so splitting them keeps deploys from invalidating the whole bundle.
          // All three are eagerly imported by the app shell, so no lazy
          // boundary is disturbed.
          if (/node_modules[\\/](?:react|react-dom|react-router|scheduler)[\\/]/.test(id)) return 'react-vendor';
          if (/node_modules[\\/]framer-motion[\\/]/.test(id)) return 'motion';
          if (/node_modules[\\/]@radix-ui[\\/]/.test(id)) return 'radix';
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
