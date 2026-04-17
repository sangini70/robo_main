import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';

// Simple check-auth simulation for local dev
function apiPlugin() {
  return {
    name: 'api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/')) {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const pathname = url.pathname;
          
          // Basic mapping of /api/something to api/something.ts
          // For nested routes like /api/admin/login
          let filePath = pathname.substring(1); // 'api/admin/login'
          
          try {
            // Smart matching for dynamic routes [file] or [slug]
            let fullPath = path.resolve(process.cwd(), `${filePath}.ts`);
            let queryParams = Object.fromEntries(url.searchParams);

            if (!fs.existsSync(fullPath)) {
              // Try dynamic matches
              if (filePath.startsWith('api/data/detail/')) {
                const slug = filePath.replace('api/data/detail/', '');
                fullPath = path.resolve(process.cwd(), 'api/data/detail/[slug].ts');
                queryParams.slug = slug;
              } else if (filePath.startsWith('api/data/')) {
                const file = filePath.replace('api/data/', '');
                fullPath = path.resolve(process.cwd(), 'api/data/[file].ts');
                queryParams.file = file;
              }
            }

            if (fs.existsSync(fullPath)) {
              const module = await server.ssrLoadModule(fullPath);
              if (module.default) {
                // Mock VercelRequest and VercelResponse
                const vReq = req as any;
                const vRes = res as any;
                
                // Add common vercel helpers
                vReq.query = queryParams;
                vReq.body = await new Promise((resolve) => {
                  let body = '';
                  req.on('data', chunk => body += chunk);
                  req.on('end', () => {
                    try { resolve(JSON.parse(body)); }
                    catch { resolve({}); }
                  });
                });
                
                vRes.json = (data: any) => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                };
                vRes.status = (code: number) => {
                  res.statusCode = code;
                  return vRes;
                };
                vRes.send = (data: any) => res.end(data);

                await module.default(vReq, vRes);
                return;
              }
            }
          } catch (e) {
            console.error('API Simulation error:', e);
          }
        }
        next();
      });
    }
  }
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
