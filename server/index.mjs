import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { handleRecoveryEvaluation, getProviderTelemetry } from './routes/recoveryRouter.mjs';
import { handleDisruptionParse } from './routes/disruptionRouter.mjs';
import { handleAssistantChat } from './routes/assistantRouter.mjs';
import { handleBookingParse } from './routes/bookingRouter.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env strictly from project root using dotenv
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = process.env.PORT || 3001;

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function createRecoveryServer() {
  const server = http.createServer(async (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    // GET /api/recovery/providers
    if (req.method === 'GET' && parsedUrl.pathname === '/api/recovery/providers') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getProviderTelemetry()));
      return;
    }

    // POST /api/recovery/evaluate
    if (req.method === 'POST' && parsedUrl.pathname === '/api/recovery/evaluate') {
      let bodyData = '';
      req.on('data', (chunk) => {
        bodyData += chunk;
      });

      req.on('end', async () => {
        try {
          const parsed = bodyData ? JSON.parse(bodyData) : {};
          const result = await handleRecoveryEvaluation(parsed);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          console.error('[SERVER_EVAL_ERROR]', err?.message);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err?.message || 'Invalid JSON request' }));
        }
      });
      return;
    }

    // POST /api/disruption/parse
    if (req.method === 'POST' && parsedUrl.pathname === '/api/disruption/parse') {
      let bodyData = '';
      req.on('data', (chunk) => {
        bodyData += chunk;
      });

      req.on('end', async () => {
        try {
          const parsed = bodyData ? JSON.parse(bodyData) : {};
          const result = await handleDisruptionParse(parsed);
          res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          console.error('[DISRUPTION_PARSE_ERROR]', err?.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err?.message || 'Server parsing error' }));
        }
      });
      return;
    }

    // POST /api/booking/parse
    if (req.method === 'POST' && parsedUrl.pathname === '/api/booking/parse') {
      let bodyData = '';
      req.on('data', (chunk) => {
        bodyData += chunk;
      });

      req.on('end', async () => {
        try {
          const parsed = bodyData ? JSON.parse(bodyData) : {};
          const result = await handleBookingParse(parsed);
          res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          console.error('[BOOKING_PARSE_ERROR]', err?.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err?.message || 'Booking server error' }));
        }
      });
      return;
    }

    // POST /api/assistant/chat
    if (req.method === 'POST' && parsedUrl.pathname === '/api/assistant/chat') {
      let bodyData = '';
      req.on('data', (chunk) => {
        bodyData += chunk;
      });

      req.on('end', async () => {
        try {
          const parsed = bodyData ? JSON.parse(bodyData) : {};
          const result = await handleAssistantChat(parsed);
          res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          console.error('[ASSISTANT_CHAT_ERROR]', err?.message);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err?.message || 'Assistant server error' }));
        }
      });
      return;
    }

    // Default 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  });

  return server;
}

// If executed directly: start listening
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createRecoveryServer();
  server.listen(PORT, () => {
    console.log(`[RouteX Recovery Backend] Listening securely on http://localhost:${PORT}`);
  });
}
