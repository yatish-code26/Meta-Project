# RouteX — Autonomous Travel Disruption Recovery Engine

> **AI proposes, code verifies.** When flight disruptions strike, RouteX computes physically verified recovery pathways against traveler budgets, Schengen border policies, Minimum Connection Times (MCT), and hard commitment deadlines.

---

## 1. Quick Start & Setup

### Requirements
- **Node.js**: v18+ (tested on Node v20/v24)
- **Package Manager**: npm

```bash
# 1. Install dependencies
npm install

# 2. Run deterministic test suite (59 unit tests)
npm test

# 3. Typecheck codebase
npx tsc --noEmit

# 4. Build production bundle
npm run build

# 5. Start development server
npm run dev
# Open http://localhost:3000 in your browser
```

---

## 2. Environment & Secrets Configuration

RouteX enforces strict separation of concerns for API keys and sensitive credentials:

1. **Local Server Only**: `GROQ_API_KEY` is loaded exclusively by the local Node server (`server/`). It is **never** bundled into client code, never exposed to `VITE_*` environment variables, never written to `localStorage`, logs, error messages, screenshots, or git history.
2. **Git Protection**: Verified via `git check-ignore .env`.
3. **Verify Connectivity**:
```bash
npm run check:groq
```
*Prints only `PASS` or `FAIL`, the HTTP status category, and the active model identifier (`llama-3.3-70b-versatile`). It never echoes or leaks the key.*

---

## 3. System Architecture & Core Modules

```
RouteX Architecture
┌────────────────────────────────────────────────────────────────────────┐
│                        Traveler Web Application                       │
│  [Serko Landing]  [OrbitTrip Canvas]  [Berlin Transit Details]        │
│  • Trip Builder (IATA autocomplete, UTC instants, editable MCT)        │
│  • Manual & AI Alternative Manager (user-entered vs AI-proposed)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┴───────────────────────────────┐
    ▼                                                               ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│        Journey Digital Twin          │  │       Dynamic Trip Engine            │
│ • Delay Propagation Directed Graph   │  │ • Luxon IANA zone to UTC instants    │
│ • Monte Carlo Stochastic Simulator   │  │ • Hub Connection Layover & MCT Math │
│   (5,000 runs, Seeded Mulberry32)    │  │ • Hard Gate: Hub MCT Feasibility     │
│ • Decision Horizon & Expiry Timer    │  │ • Hard Gate: Arrival Deadline        │
│ • 30-Point Parametric Stress Sweep   │  │ • Hard Gate: Out-of-Pocket Budget    │
│ • Risk Profiles (Cautious/Fastest)   │  │ • Hard Gate: Schengen Border Entry   │
└──────────────────────────────────────┘  └──────────────────────────────────────┘
                                    ▲
                                    │ Structured Candidates
┌───────────────────────────────────┴────────────────────────────────────┐
│                    Local Node API Server (Bounded AI)                  │
│ • Groq Llama 3.3 70B Server Adapter (server/adapters/GroqProvider...)   │
│ • Zod Schema Validation for Untrusted Disruption Email / SMS Texts     │
│ • Rate-limit (429), Timeout (10s abort), 5xx Server Error Resilience   │
│ • Deterministic Fallback Fixture for offline / uncredentialed testing │
└────────────────────────────────────────────────────────────────────────┘
```

### Distinction: Synthetic Fixtures vs. Real Computation
- **Real Computation**: All connection windows, arrival margins, physical MCT gate passes/fails, time zone conversions across daylight saving transitions, Monte Carlo percentiles (p10/p50/p90), and histogram bins are **computed live by the deterministic engine**.
- **Synthetic Fixtures**: Pre-populated example trips (Tokyo Symposium, NY Climate Delegation, London Tech Board) provide calibrated initial states for instantaneous evaluation without requiring external flight API credentials.

---

## 4. Headline Features

### Feature 1: Input-Driven Engine (Zero Hardcoded Scenarios)
- **Trip Builder**: Travelers can configure custom multi-leg itineraries with origin/destination airports chosen from a bundled dataset of major international hubs (LHR, FRA, MUC, CDG, AMS, ZRH, VIE, HND, NRT, SIN, DXB, DOH, ICN, JFK, EWR, ORD, SFO, LAX).
- **Timezone & DST Truth**: Scheduled times are entered in local date-times and parsed to true UTC instants using airport IANA zones via `luxon`.
- **Candidate Sources**: Clearly distinguishes traveler alternatives:
  - `[user-entered]`: Manually inputted route options.
  - `[AI-proposed, availability unverified]`: Model-suggested options awaiting reservation confirmation.

### Feature 2: Journey Digital Twin
- **Delay Propagation Graph**: Visual directed graph mapping Leg 1 $\rightarrow$ Hub Connection Buffer $\rightarrow$ Leg 2 $\rightarrow$ Hotel $\rightarrow$ Mandatory Commitment. Delays or leg cancellations propagate downstream dynamically, recoloring node buffers in real time.
- **Probabilistic Twin (Monte Carlo Engine)**: Simulates 5,000 stochastic executions modeling triangular delay distributions, terminal walking variances, and border queue noise with a seeded PRNG (`Mulberry32`). Displays success probability %, p10/p50/p90 deadline margins, runtime latency (typically <20ms), and SVG histogram density.
- **Decision Horizon**: Live countdown from `globalClock` tracking GDS reservation cutoffs and boarding gate closures.
- **Parametric Stress Test Matrix**: Interactive 30-point sweep evaluating delay (0–150m) vs. budget ($100–$600) to reveal survival boundaries.

### Feature 3: Bounded AI & Provider Resilience
- Plain-language disruption parser extracts structured flight delays from airline emails/SMS with strict Zod validation.
- Server-side Groq adapter with automatic 10-second request timeout, 429 rate limit fallback, and malformed JSON safety.

---

## 5. 3-Minute Scripted Demo Walkthrough

Follow this step-by-step path to demo RouteX:

1. **Explore the Public Landing (`#landing`)**:
   - Note the single deep-navy Serko-inspired hero with live stats: scenarios simulated, hard constraints checked, and 0 infeasible routes recommended.
   - Click **"Launch Recovery Canvas"**.

2. **Inspect the Active Journey Canvas (`#canvas`)**:
   - Notice the left sidebar with trip selector and live status chips in the top bar.
   - The interactive D3 SVG map displays true Great Circle coastlines and routes.
   - The floating panel shows an inbound delay notice: `LH 901 delayed +75m into Frankfurt`.
   - The connection window is compressed below the required 45m MCT, triggering autonomous recovery evaluation.

3. **Inspect Gate Verification ("AI proposes, code verifies")**:
   - In the **Paths** tab, review the **Gate Audit Summary**:
     - *N proposed, M rejected, and why*.
     - Option A (Direct Rebook) passes all hard gates and is marked **Recommended**.
     - Option B (Multimodal Rail via Munich) is **disqualified** because it breaches German border control (no Schengen visa).
     - Option C is **disqualified** because it arrives 19.5 hours past the keynote deadline.

4. **Experience the Journey Digital Twin (`Twin Lab` Tab)**:
   - Click the **Twin Lab** tab.
   - Observe the **Delay Propagation Graph**: see how +75m delay turns the Frankfurt Hub node amber/red.
   - Review the **Decision Horizon**: live countdown ticker to reservation cutoff.
   - Inspect the **Monte Carlo Engine**: observe 5,000 simulated executions with p10/p50/p90 margins and the arrival density histogram.
   - Click **"Reroll Seed"** to demonstrate deterministic reproducibility.
   - Review the **30-Point Stress Test Matrix**: click any cell (e.g. `+$60m delay, $300 budget`) to jump the live simulation to those parameters.

5. **Test the Input-Driven Trip Builder**:
   - Switch back to **Paths** and click **"Configure Trip"**.
   - Load the example **"UN Climate Delegation (LHR → JFK)"** or create a custom 2-leg trip with IATA autocomplete.
   - Click **"Apply & Run Engine"** to watch the entire engine, map, and twin recompute instantaneously from inputs.

6. **Confirm Authorization & Sovereign Traveler Gate**:
   - On the qualified recovery path, click **"Review & Select"**.
   - Review the out-of-pocket cost, timeline shift, and unverified assumptions.
   - Click **"Confirm & Lock In Itinerary"**.
   - The itinerary tab and top bar update with the confirmed rebooked flight.
   - Click **"Undo"** to rollback to the initial state cleanly.

---

## 6. Test Suite & Verification Results

```bash
npm test
```

### Test Coverage Summary (59 passing tests across 9 suites):
- `src/test/dynamic-engine.test.ts` (12 tests): Input-driven validation, IANA timezone UTC parsing, DST summer/winter transitions, cancellation short-circuiting, deadline gates, budget gates, and Schengen visa rules.
- `src/test/monte-carlo.test.ts` (4 tests): Seeded PRNG determinism, statistical convergence, cancellation handling, execution speed (<50ms for 5,000 samples).
- `src/test/groq-resilience.test.ts` (6 tests): Mocked server provider handling for missing keys, 10s request timeout, HTTP 429 rate limits, HTTP 500/503 server errors, and malformed JSON payloads.
- `src/test/scripted-demo-path.test.ts` (1 test): Complete end-to-end traveler journey test (build $\rightarrow$ disruption $\rightarrow$ twin simulation $\rightarrow$ decision horizon $\rightarrow$ gate verification $\rightarrow$ authorization $\rightarrow$ rollback).
- `src/test/engine-truth.test.ts` (16 tests): Contradiction reproduction, unified connection rule, and boundary conditions.
- `src/test/twin-lab.test.ts` (5 tests): Parameter scrubbing and margin sensitivity.
- `src/test/simulation.test.ts` (5 tests): Deterministic gate calculations.
- `src/test/recovery.test.ts` (6 tests): Lifecycle state transitions.
- `src/test/advanced-features.test.ts` (4 tests): Expense tracking, notifications, and disruption parser schema validation.

```
Test Files  9 passed (9)
Tests       59 passed (59)
Build       0 errors (built in 6.24s)
Console     0 errors, 0 warnings
```
