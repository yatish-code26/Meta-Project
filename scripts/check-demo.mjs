/**
 * scripts/check-demo.mjs
 * ======================
 * Preflight verification run: executes the full demo script headless with real clicks and typing.
 * Fails on any console error, page error, failed same-origin request, HTTP >=400 from /api,
 * missing element, or a live-AI step that falls back to offline.
 * Must pass 3 times in a row.
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import http from 'http';
import { executeDemoSequence } from './run-demo-flow.mjs';

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

async function runSinglePreflight(iteration) {
  console.log(`\n========================================`);
  console.log(`>>> PREFLIGHT RUN #${iteration} of 3 <<<`);
  console.log(`========================================`);

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore favicon or react devtools notifications
      if (!text.includes('favicon') && !text.includes('React DevTools')) {
        errors.push(`Console Error: ${text}`);
      }
    }
  });

  page.on('pageerror', (err) => {
    errors.push(`Page Error: ${err.message}`);
  });

  page.on('requestfailed', (req) => {
    const url = req.url();
    if (url.includes('localhost') && !url.includes('favicon')) {
      const err = req.failure()?.errorText || '';
      if (!err.includes('ERR_ABORTED')) {
        errors.push(`Request Failed: ${req.method()} ${url} (${err})`);
      }
    }
  });

  page.on('response', (res) => {
    const url = res.url();
    if (url.includes('/api/') && res.status() >= 400) {
      errors.push(`API Error ${res.status()}: ${res.request().method()} ${url}`);
    }
  });

  try {
    await executeDemoSequence(page, {
      isCheckMode: true,
      onProgress: (step) => console.log(`  [Run ${iteration}] ${step}`),
    });
  } catch (err) {
    errors.push(`Execution Exception: ${err.message}`);
  } finally {
    await browser.close();
  }

  if (errors.length > 0) {
    console.error(`\n[PREFLIGHT ${iteration} FAILED] Found ${errors.length} issue(s):`);
    errors.forEach((e) => console.error(`  - ${e}`));
    return false;
  }

  console.log(`>>> PREFLIGHT RUN #${iteration} PASSED CLEANLY <<<`);
  return true;
}

async function main() {
  console.log('[Demo Preflight] Checking server on http://localhost:3000...');
  let devProcess = null;

  const isAlreadyRunning = await checkHttpReady('http://localhost:3000', 3);
  if (!isAlreadyRunning) {
    console.log('[Demo Preflight] Starting Vite server on port 3000...');
    devProcess = spawn('npx.cmd', ['vite', '--port', '3000'], {
      stdio: 'pipe',
      shell: true,
    });
    devProcess.stdout.on('data', () => {});
    devProcess.stderr.on('data', () => {});
    const ready = await checkHttpReady('http://localhost:3000', 40);
    if (!ready) {
      console.error('[Demo Preflight] Failed to start Vite server.');
      process.exit(1);
    }
    console.log('[Demo Preflight] Server is ready.');
  }

  let allPassed = true;

  try {
    for (let i = 1; i <= 3; i++) {
      const ok = await runSinglePreflight(i);
      if (!ok) {
        allPassed = false;
        break;
      }
    }
  } finally {
    if (devProcess) {
      console.log('[Demo Preflight] Stopping background Vite server...');
      devProcess.kill();
    }
  }

  if (!allPassed) {
    console.error('\nPreflight verification failed.');
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log('>>> ALL 3 PREFLIGHT RUNS PASSED CONSECUTIVELY (100%) <<<');
  console.log('======================================================');
  process.exit(0);
}

main().catch((err) => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});
