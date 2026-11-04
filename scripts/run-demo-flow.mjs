/**
 * scripts/run-demo-flow.mjs
 * =========================
 * Core 12-beat RouteX demo flow for automated check & recording.
 */

export const DEMO_CAPTIONS = [
  {
    beat: 1,
    start: 0,
    end: 6,
    line1: 'RouteX — recover from missed connections.',
    line2: 'AI proposes, code verifies. All trip data is synthetic.',
  },
  {
    beat: 2,
    start: 6,
    end: 16,
    line1: 'Configuring upcoming itinerary from unstructured confirmation email.',
    line2: 'AI extracts travel legs into strictly schema-validated UTC instants.',
  },
  {
    beat: 3,
    start: 16,
    end: 24,
    line1: 'Operational Canvas: Geodesic route arcs, live horizons, and itinerary.',
    line2: 'Times stored as UTC instants with airport IANA zones and hub MCT rules.',
  },
  {
    beat: 4,
    start: 24,
    end: 34,
    line1: 'Pasting airline disruption alert: Frankfurt ATC slot restriction.',
    line2: 'AI structures delay; propagation graph immediately recolors red.',
  },
  {
    beat: 5,
    start: 34,
    end: 48,
    line1: 'AI proposes alternative routes; deterministic engine enforces 4 gates.',
    line2: 'Routes breaching MCT, deadline, or visa borders are disqualified.',
  },
  {
    beat: 6,
    start: 48,
    end: 62,
    line1: 'Digital Twin: 5,000-run Monte Carlo probability distribution.',
    line2: 'Visible PRNG seed with interactive delay scrubber and stress tests.',
  },
  {
    beat: 7,
    start: 62,
    end: 74,
    line1: 'Wait-or-Commit Advisor: Monte Carlo valuation of decision timing.',
    line2: 'Quantifies value of waiting, expected downside, and regret bounds.',
  },
  {
    beat: 8,
    start: 74,
    end: 86,
    line1: 'Team Quorum Twin: Multi-traveler hub correlation & knapsack rescue.',
    line2: 'Simulates joint arrival (k of N) and allocates budget to blockers.',
  },
  {
    beat: 9,
    start: 86,
    end: 96,
    line1: 'Grounded Assistant: Queries bound strictly to engine telemetry.',
    line2: 'Answers cite specific route IDs and hard constraint gates.',
  },
  {
    beat: 10,
    start: 96,
    end: 106,
    line1: 'Human-in-the-loop approval: Locking in revised itinerary.',
    line2: 'Ledger logs rebooking fees, adds notification, and provides Undo.',
  },
  {
    beat: 11,
    start: 106,
    end: 114,
    line1: 'Evidence Ledger: Cryptographic SHA-256 certificate verification.',
    line2: 'Tamper-evident hash chain, RFC 5545 calendar export, and Command Palette.',
  },
  {
    beat: 12,
    start: 114,
    end: 120,
    line1: 'RouteX — Disruption Recovery Simulation Engine',
    line2: 'Synthetic data. Simulation only. No bookings are made.',
  },
];

export async function injectCursorAndRipple(page) {
  await page.evaluate(() => {
    if (document.getElementById('demo-cursor-pointer')) return;
    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor-pointer';
    cursor.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.4));">
      <path d="M5.5 3.5L18.5 12L12 14L8.5 20.5L5.5 3.5Z" fill="#0f172a" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/>
    </svg>`;
    cursor.style.position = 'fixed';
    cursor.style.top = '0px';
    cursor.style.left = '0px';
    cursor.style.zIndex = '999999';
    cursor.style.pointerEvents = 'none';
    cursor.style.transform = 'translate(-2px, -2px)';
    cursor.style.transition = 'opacity 0.2s';
    document.body.appendChild(cursor);

    window.addEventListener('mousemove', (e) => {
      cursor.style.transform = `translate(${e.clientX - 2}px, ${e.clientY - 2}px)`;
    });

    window.addEventListener('click', (e) => {
      const ripple = document.createElement('div');
      ripple.className = 'demo-click-ripple';
      ripple.style.position = 'fixed';
      ripple.style.left = `${e.clientX - 18}px`;
      ripple.style.top = `${e.clientY - 18}px`;
      ripple.style.width = '36px';
      ripple.style.height = '36px';
      ripple.style.borderRadius = '50%';
      ripple.style.backgroundColor = 'rgba(15, 118, 110, 0.45)';
      ripple.style.border = '2px solid rgba(13, 148, 136, 0.9)';
      ripple.style.pointerEvents = 'none';
      ripple.style.zIndex = '999998';
      ripple.style.transform = 'scale(0.4)';
      ripple.style.opacity = '1';
      ripple.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
      document.body.appendChild(ripple);
      requestAnimationFrame(() => {
        ripple.style.transform = 'scale(1.6)';
        ripple.style.opacity = '0';
      });
      setTimeout(() => ripple.remove(), 450);
    });
  });
}

export async function setCaption(page, line1, line2) {
  await page.evaluate(
    ({ l1, l2 }) => {
      if (window.__setDemoCaption) {
        window.__setDemoCaption(l1, l2);
      } else {
        window.dispatchEvent(new CustomEvent('routex-demo-caption', { detail: { line1: l1, line2: l2 } }));
      }
    },
    { l1: line1, l2: line2 }
  );
}

export async function smoothMoveAndClick(page, selector, steps = 14) {
  const el = await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const box = await el.boundingBox();
  if (box) {
    const targetX = box.x + box.width / 2;
    const targetY = box.y + box.height / 2;
    await page.mouse.move(targetX, targetY, { steps });
    await page.waitForTimeout(60);
  }
  await el.click({ force: true });
}

export async function smoothType(page, selector, text, delayMs = 35) {
  await smoothMoveAndClick(page, selector);
  const el = await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
  await el.fill('');
  await page.keyboard.type(text, { delay: delayMs });
}

/**
 * Execute the 120s RouteX demo sequence.
 */
export async function executeDemoSequence(page, options = {}) {
  const { isCheckMode = false, onProgress = () => {} } = options;
  const pacingMultiplier = isCheckMode ? 0.35 : 1.0;

  const waitPacing = async (ms) => {
    await page.waitForTimeout(Math.round(ms * pacingMultiplier));
  };

  // --- BEAT 1: Title Card (0 - 6s) ---
  onProgress('Beat 1: Title Card');
  await page.goto('http://localhost:3000/?record=1#title-card', { waitUntil: 'domcontentloaded' });
  await injectCursorAndRipple(page);
  const cap1 = DEMO_CAPTIONS[0];
  await setCaption(page, cap1.line1, cap1.line2);
  await waitPacing(5500);

  // --- BEAT 2: Trips & AI Booking Email Parser (6 - 16s) ---
  onProgress('Beat 2: Trips -> New Trip -> Booking Parser');
  const cap2 = DEMO_CAPTIONS[1];
  await setCaption(page, cap2.line1, cap2.line2);
  await page.evaluate(() => { window.location.hash = '#trips'; });
  await waitPacing(800);

  // Open New Trip Wizard
  await smoothMoveAndClick(page, '[data-testid="new-trip-btn"]');
  await page.waitForSelector('[data-testid="booking-email-input"]', { state: 'visible', timeout: 10000 });
  await waitPacing(600);

  // Type booking email confirmation
  await smoothType(
    page,
    '[data-testid="booking-email-input"]',
    'Booking: 7G8X9K. Passenger: Sarah Jenkins. Leg 1: BA 904 LHR->FRA dep 07:15 arr 09:55. Leg 2: NH 204 FRA->HND dep 11:30 arr 06:55. Tokyo Symposium Keynote 14:00 JST.',
    isCheckMode ? 5 : 20
  );
  await waitPacing(500);

  // Trigger live AI extraction
  await smoothMoveAndClick(page, '[data-testid="booking-email-parse-btn"]');
  await page.waitForSelector('text=Extracted', { timeout: 15000 });
  await waitPacing(800);

  // Apply & Save custom trip
  await smoothMoveAndClick(page, '[data-testid="save-trip-btn"]');
  await waitPacing(1600);

  // --- BEAT 3: Operational Canvas (16 - 24s) ---
  onProgress('Beat 3: Operational Canvas & Route Map');
  const cap3 = DEMO_CAPTIONS[2];
  await setCaption(page, cap3.line1, cap3.line2);
  await page.evaluate(() => { window.location.hash = '#trip'; });
  await waitPacing(1500);

  // Switch to Itinerary tab
  await smoothMoveAndClick(page, '[data-testid="sidebar-itinerary"]');
  await waitPacing(4800);

  // --- BEAT 4: Paste Disruption (24 - 34s) ---
  onProgress('Beat 4: Digital Twin & Disruption Extraction');
  const cap4 = DEMO_CAPTIONS[3];
  await setCaption(page, cap4.line1, cap4.line2);
  await smoothMoveAndClick(page, '[data-testid="sidebar-twin"]');
  await waitPacing(800);

  // Open disruption parser
  await smoothMoveAndClick(page, '[data-testid="paste-disruption-toggle"]');
  await page.waitForSelector('[data-testid="paste-disruption-textarea"]', { state: 'visible' });
  await waitPacing(500);

  // Type disruption SMS text
  await smoothType(
    page,
    '[data-testid="paste-disruption-textarea"]',
    'Lufthansa Notice: LH 901 London Heathrow to Frankfurt delayed +75m due to severe air traffic control flow restrictions.',
    isCheckMode ? 5 : 24
  );
  await waitPacing(600);

  // Extract disruption
  await smoothMoveAndClick(page, '[data-testid="paste-disruption-parse-btn"]');
  await page.waitForSelector('text=Structured Extraction Complete', { timeout: 15000 });
  await waitPacing(1000);

  // Apply disruption to engine
  await smoothMoveAndClick(page, '[data-testid="paste-disruption-apply-btn"]');
  await waitPacing(3200);

  // --- BEAT 5: Recovery Evaluation & Hard Gates (34 - 48s) ---
  onProgress('Beat 5: Recovery Evaluation & Hard Gates');
  const cap5 = DEMO_CAPTIONS[4];
  await setCaption(page, cap5.line1, cap5.line2);
  await smoothMoveAndClick(page, '[data-testid="sidebar-recovery"]');
  await waitPacing(3000);

  // Move over recovery cards to demonstrate gate audits
  await page.mouse.move(400, 320, { steps: 10 });
  await waitPacing(5200);
  await page.mouse.move(400, 480, { steps: 10 });
  await waitPacing(5200);

  // --- BEAT 6: Digital Twin Monte Carlo & Scrubber (48 - 62s) ---
  onProgress('Beat 6: Monte Carlo Histogram & Delay Scrubber');
  const cap6 = DEMO_CAPTIONS[5];
  await setCaption(page, cap6.line1, cap6.line2);
  await smoothMoveAndClick(page, '[data-testid="sidebar-twin"]');
  await waitPacing(3000);

  // Scroll down to inspect Monte Carlo distribution & sensitivity
  await page.evaluate(() => window.scrollBy({ top: 380, behavior: 'smooth' }));
  await waitPacing(4800);
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await waitPacing(5200);

  // --- BEAT 7: Wait-or-Commit Advisor (62 - 74s) ---
  onProgress('Beat 7: Wait-or-Commit Advisor');
  const cap7 = DEMO_CAPTIONS[6];
  await setCaption(page, cap7.line1, cap7.line2);
  await page.evaluate(() => window.scrollBy({ top: 450, behavior: 'smooth' }));
  await waitPacing(4800);
  await page.mouse.move(420, 520, { steps: 10 });
  await waitPacing(6500);

  // --- BEAT 8: Team Quorum Twin (74 - 86s) ---
  onProgress('Beat 8: Team Quorum Twin');
  const cap8 = DEMO_CAPTIONS[7];
  await setCaption(page, cap8.line1, cap8.line2);
  await smoothMoveAndClick(page, '[data-testid="sidebar-team"]');
  await page.waitForSelector('text=Team Quorum', { timeout: 10000 });
  await waitPacing(4800);

  // Inspect critical blocker and rescue allocation
  await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
  await waitPacing(6500);

  // --- BEAT 9: Grounded Assistant (86 - 96s) ---
  onProgress('Beat 9: Grounded Assistant Chatbot');
  const cap9 = DEMO_CAPTIONS[8];
  await setCaption(page, cap9.line1, cap9.line2);
  await smoothMoveAndClick(page, '[data-testid="sidebar-assistant"]');
  await page.waitForSelector('textarea, input[type="text"]', { timeout: 10000 });
  await waitPacing(800);

  // Type question to grounded assistant
  const assistantInput = await page.$('input[placeholder*="Ask"], textarea[placeholder*="Ask"]');
  if (assistantInput) {
    await assistantInput.click();
    await page.keyboard.type('Which option is recommended and what gates does it pass?', { delay: isCheckMode ? 5 : 24 });
    await waitPacing(400);
    await page.keyboard.press('Enter');
    await page.waitForSelector('text=OPT-RECOVER-A', { timeout: 15000 });
  }
  await waitPacing(4500);

  // --- BEAT 10: Confirmation, Ledger & Undo (96 - 106s) ---
  onProgress('Beat 10: Human Confirmation, Expense Logging & Undo');
  const cap10 = DEMO_CAPTIONS[9];
  await setCaption(page, cap10.line1, cap10.line2);
  await smoothMoveAndClick(page, '[data-testid="sidebar-recovery"]');
  await waitPacing(1200);

  // Click on first option review
  const reviewBtn = await page.$('button:has-text("Review & Confirm"), button:has-text("Select")');
  if (reviewBtn) {
    await reviewBtn.click();
  } else {
    await page.evaluate(() => { window.location.hash = '#confirmed'; });
  }
  await waitPacing(3200);

  // Click confirm
  const confirmBtn = await page.$('button:has-text("Confirm Rebooking"), button:has-text("Confirm")');
  if (confirmBtn) {
    await confirmBtn.click();
    await waitPacing(2000);
  }

  // --- BEAT 11: Cryptographic Certificate & Verification (106 - 114s) ---
  onProgress('Beat 11: Cryptographic Evidence Ledger & SHA-256');
  const cap11 = DEMO_CAPTIONS[10];
  await setCaption(page, cap11.line1, cap11.line2);
  await smoothMoveAndClick(page, '[data-testid="sidebar-certificates"]');
  await page.waitForSelector('text=SHA-256', { timeout: 10000 });
  await waitPacing(3500);

  // Click import & verify button
  const verifyBtn = await page.$('button:has-text("Verify"), button:has-text("Check Integrity")');
  if (verifyBtn) {
    await verifyBtn.click();
    await waitPacing(1800);
  }

  // Quick Command Palette pop (Ctrl+K)
  await page.keyboard.press('Control+k');
  await waitPacing(1800);
  await page.keyboard.press('Escape');
  await waitPacing(800);

  // --- BEAT 12: End Card (114 - 120s) ---
  onProgress('Beat 12: End Card');
  const cap12 = DEMO_CAPTIONS[11];
  await setCaption(page, cap12.line1, cap12.line2);
  await page.evaluate(() => { window.location.hash = '#end-card'; });
  await waitPacing(5800);
}
