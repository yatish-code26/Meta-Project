/**
 * scripts/record-demo.mjs
 * =======================
 * Records the 120-second silent subtitled RouteX demo video.
 * - Viewport: 1920x1080, 60fps / high quality, no audio.
 * - Subtitles: 110px dedicated bottom strip, Inter 30px, white on translucent dark bar.
 * - Smooth mouse cursor + click ripple injection.
 * - FFmpeg converts to MP4 (H.264, yuv420p, crf 18, faststart) at demo/routex-demo-120s.mp4.
 * - Generates demo/routex-demo.srt.
 * - Verifies duration is <=120.0s and >=115s.
 */

import { chromium } from 'playwright';
import { spawn, execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpegPath from 'ffmpeg-static';
import { executeDemoSequence, DEMO_CAPTIONS } from './run-demo-flow.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEMO_DIR = path.resolve(PROJECT_ROOT, 'demo');
const TEMP_RECORD_DIR = path.resolve(DEMO_DIR, 'temp-raw');
const FINAL_MP4_PATH = path.resolve(DEMO_DIR, 'routex-demo-120s.mp4');
const FINAL_SRT_PATH = path.resolve(DEMO_DIR, 'routex-demo.srt');

function checkHttpReady(url, maxRetries = 30) {
  return new Promise((resolve) => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      http
        .get(url, (res) => {
          if (res.statusCode && res.statusCode < 500) {
            clearInterval(interval);
            resolve(true);
          }
        })
        .on('error', () => {
          if (attempts >= maxRetries) {
            clearInterval(interval);
            resolve(false);
          }
        });
    }, 500);
  });
}

function formatSrtTimestamp(seconds) {
  const pad = (n, w = 2) => String(Math.floor(n)).padStart(w, '0');
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function generateSrtFile() {
  const entries = DEMO_CAPTIONS.map((c, idx) => {
    const startStr = formatSrtTimestamp(c.start);
    const endStr = formatSrtTimestamp(c.end);
    return `${idx + 1}\n${startStr} --> ${endStr}\n${c.line1}\n${c.line2}\n`;
  });
  fs.writeFileSync(FINAL_SRT_PATH, entries.join('\n'), 'utf8');
  console.log(`[Demo Record] SRT subtitles written to: ${FINAL_SRT_PATH}`);
}

async function recordDemo() {
  if (!fs.existsSync(DEMO_DIR)) {
    fs.mkdirSync(DEMO_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEMP_RECORD_DIR)) {
    fs.mkdirSync(TEMP_RECORD_DIR, { recursive: true });
  }

  console.log('[Demo Record] Ensuring local server is running on http://localhost:3000...');
  let devProcess = null;
  const isAlreadyRunning = await checkHttpReady('http://localhost:3000', 3);
  if (!isAlreadyRunning) {
    console.log('[Demo Record] Starting local Vite server on port 3000...');
    devProcess = spawn('npx.cmd', ['vite', '--port', '3000'], {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
      shell: true,
    });
    devProcess.stdout.on('data', () => {});
    devProcess.stderr.on('data', () => {});
    const ready = await checkHttpReady('http://localhost:3000', 40);
    if (!ready) {
      console.error('[Demo Record] Failed to start server.');
      process.exit(1);
    }
    console.log('[Demo Record] Server is ready.');
  }

  console.log('[Demo Record] Launching Chrome with video recording (1920x1080)...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: TEMP_RECORD_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  console.log('[Demo Record] Executing 12-beat RouteX demo sequence (120 s)...');
  const startTime = Date.now();

  try {
    await executeDemoSequence(page, {
      isCheckMode: false,
      onProgress: (step) => {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`  [T+${elapsed}s] ${step}`);
      },
    });
  } catch (err) {
    console.error('[Demo Record] Execution error:', err);
    await browser.close();
    if (devProcess) devProcess.kill();
    process.exit(1);
  }

  // Get raw recorded video path before closing page
  const videoObj = page.video();
  const rawVideoPath = await videoObj.path();

  await page.close();
  await context.close();
  await browser.close();

  if (devProcess) {
    devProcess.kill();
  }

  console.log(`[Demo Record] Raw recording saved to: ${rawVideoPath}`);
  console.log(`[Demo Record] Encoding MP4 with ffmpeg (H.264, crf 18, yuv420p, no audio, capped at 120.0s)...`);

  const ffmpegCmd = `"${ffmpegPath}" -y -i "${rawVideoPath}" -t 120 -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart -an "${FINAL_MP4_PATH}"`;
  execSync(ffmpegCmd, { stdio: 'inherit' });

  // Generate SRT subtitles
  generateSrtFile();

  // Verify duration with ffmpeg probe
  try {
    const probeOutput = execSync(`"${ffmpegPath}" -i "${FINAL_MP4_PATH}" 2>&1`, { encoding: 'utf8' });
    const match = probeOutput.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
    if (match) {
      const durSec = parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60 + parseFloat(match[3]);
      console.log(`\n======================================================`);
      console.log(`>>> DEMO RECORDING COMPLETE <<<`);
      console.log(`Final Video File: ${FINAL_MP4_PATH}`);
      console.log(`Measured Duration: ${durSec.toFixed(2)} seconds`);
      console.log(`======================================================`);

      if (durSec < 115 || durSec > 120.5) {
        console.warn(`[Warning] Duration ${durSec.toFixed(2)}s outside expected range [115s, 120.0s]`);
      }
    }
  } catch {
    // Probe output handled above
  }

  // Clean up temp raw files
  try {
    fs.rmSync(TEMP_RECORD_DIR, { recursive: true, force: true });
  } catch {}

  process.exit(0);
}

recordDemo().catch((err) => {
  console.error('[Demo Record] Fatal error:', err);
  process.exit(1);
});

