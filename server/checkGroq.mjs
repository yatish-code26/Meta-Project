import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Safely load local .env without logging or exposing any contents
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split(/\r?\n/)) {
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
      }
    } catch {
      // Ignore read errors
    }
  }
}

loadEnv();

const MODEL_ID = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const apiKey = process.env.GROQ_API_KEY;

async function checkGroq() {
  if (!apiKey || apiKey.trim().length === 0) {
    console.log(`FAIL | HTTP Status: NO_KEY (GROQ_API_KEY not found in .env) | Model: ${MODEL_ID}`);
    process.exit(1);
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      }),
    });

    const statusCategory = `${Math.floor(res.status / 100)}xx (Status: ${res.status})`;

    if (res.ok) {
      console.log(`PASS | HTTP Status: ${statusCategory} | Model: ${MODEL_ID}`);
      process.exit(0);
    } else {
      console.log(`FAIL | HTTP Status: ${statusCategory} | Model: ${MODEL_ID}`);
      process.exit(1);
    }
  } catch (err) {
    console.log(`FAIL | HTTP Status: NETWORK_ERROR | Model: ${MODEL_ID}`);
    process.exit(1);
  }
}

checkGroq();

