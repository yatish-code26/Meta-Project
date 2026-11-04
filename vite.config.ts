import { defineConfig, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Safely load local .env into process.env for the local dev middleware
function loadLocalEnv() {
  const envPath = path.resolve(__dirname, './.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim();
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    } catch {
      // Ignore reading error if absent
    }
  }
}

loadLocalEnv();

// Local recovery API middleware plugin for zero-friction single-command dev workflow
function recoveryApiPlugin(): Plugin {
  return {
    name: 'routex-recovery-api-middleware',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url === '/api/recovery/providers' && req.method === 'GET') {
          const { getProviderTelemetry } = await import('./server/routes/recoveryRouter.mjs');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(getProviderTelemetry()));
          return;
        }

        if (req.url === '/api/recovery/evaluate' && req.method === 'POST') {
          const { handleRecoveryEvaluation } = await import('./server/routes/recoveryRouter.mjs');
          let bodyData = '';
          req.on('data', (chunk: any) => {
            bodyData += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = bodyData ? JSON.parse(bodyData) : {};
              const result = await handleRecoveryEvaluation(parsed);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Invalid request' }));
            }
          });
          return;
        }

        if (req.url === '/api/disruption/parse' && req.method === 'POST') {
          const { handleDisruptionParse } = await import('./server/routes/disruptionRouter.mjs');
          let bodyData = '';
          req.on('data', (chunk: any) => {
            bodyData += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = bodyData ? JSON.parse(bodyData) : {};
              const result = await handleDisruptionParse(parsed);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Invalid request' }));
            }
          });
          return;
        }

        if (req.url === '/api/booking/parse' && req.method === 'POST') {
          const { handleBookingParse } = await import('./server/routes/bookingRouter.mjs');
          let bodyData = '';
          req.on('data', (chunk: any) => {
            bodyData += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = bodyData ? JSON.parse(bodyData) : {};
              const result = await handleBookingParse(parsed);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Invalid request' }));
            }
          });
          return;
        }

        if (req.url === '/api/assistant/chat' && req.method === 'POST') {
          const { handleAssistantChat } = await import('./server/routes/assistantRouter.mjs');
          let bodyData = '';
          req.on('data', (chunk: any) => {
            bodyData += chunk;
          });
          req.on('end', async () => {
            try {
              const parsed = bodyData ? JSON.parse(bodyData) : {};
              const result = await handleAssistantChat(parsed);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Invalid request' }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), recoveryApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
});
