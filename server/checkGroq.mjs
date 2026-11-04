import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env strictly from project root using dotenv
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MODEL_ID = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';
const apiKey = process.env.GROQ_API_KEY;

async function checkGroq() {
  if (!apiKey || apiKey.trim().length === 0) {
    console.log(`FAIL | HTTP Status: NO_KEY (GROQ_API_KEY not found in .env) | Model: ${MODEL_ID}`);
    process.exitCode = 1;
    return;
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
      process.exitCode = 0;
    } else {
      console.log(`FAIL | HTTP Status: ${statusCategory} | Model: ${MODEL_ID}`);
      process.exitCode = 1;
    }
  } catch (err) {
    console.log(`FAIL | HTTP Status: NETWORK_ERROR | Model: ${MODEL_ID}`);
    process.exitCode = 1;
  }
}

checkGroq();
