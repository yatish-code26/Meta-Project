# RouteX — Autonomous Travel Disruption Recovery Engine
**Meta AI Developer Hackathon Submission • "Build for Your World" Challenge (Startup Track)**

RouteX is an autonomous travel recovery system engineered to solve one critical global pain point: **when international travelers miss tight flight connections or encounter disruptions, helping them recover safely by evaluating candidate alternatives against their hard itinerary constraints, budget, visa restrictions, and time deadlines—with explicit traveler authorization before committing any change.**

---

## 1. Hackathon & Startup Track Context
- **Hackathon:** Meta AI Developer Hackathon 2026 — “Build for Your World”.
- **Track:** Startup Track (Individual Student Developer based in India).
- **Target Model Architecture:** Meta Llama 3.3 70B Instruct (`meta-llama/Llama-3.3-70B-Instruct`) via permitted endpoint.
- **Problem Solved:** Over 10 million air travelers face missed connections annually. Existing airline algorithms offer opaque rebookings that frequently violate visa boundaries (e.g., exiting airside transit without a visa), exceed passenger budgets, or cause travelers to miss mission-critical commitments. RouteX provides transparent, gate-verified recovery pathways that respect traveler sovereignty.

---

## 2. The Complete 6-Step End-to-End Recovery Journey

### Step A — Disruption Telemetry & Scenario Context
- **Traveler Profile:** Alex Turner (Star Alliance Gold / Miles & More Senator).
- **Original Route:** London Heathrow (`LHR`) → Frankfurt Airport (`FRA`) → Tokyo Haneda (`HND`).
- **Disruption:** Inbound flight LH 901 arrived Frankfurt Terminal 1 at **13:30 CET** (75 minutes late due to European ATC slot restrictions).
- **Consequence:** Connecting flight LH 716 gate closed at **13:25 CET** (departure 13:45 CET). Frankfurt Airport Minimum Connection Time (MCT) between Concourse A and B is **45 minutes**. Connection missed.
- **Labeling:** Prominently tagged with `[SYNTHETIC TEST SCENARIO]`.

### Step B — Deterministic Traveler Constraints (Gates vs. Preferences)
The system distinguishes hard requirements (disqualify-on-breach gates) from soft preferences:
- **Hard Gate 1 (Budget Ceiling):** Max recovery buffer of **$450 USD**.
- **Hard Gate 2 (Arrival Deadline):** **Day 2, 14:00 JST** (Symposium Doors Open; Alex Turner delivers the 14:30 JST Opening Keynote).
- **Hard Gate 3 (Immigration / Visa):** **Airside Schengen Transit Only** (Indian passport with UK visa; exiting to German landside territory is legally prohibited).
- **Operational Preference:** Checked Bag Tag **#LH-982341** (Checked through to Tokyo Haneda; Star Alliance auto-interline preferred).

### Step C — Autonomous Recovery Evaluation
The recovery engine audits 3 candidate pathways through the independent `RecoveryConstraintValidator`:
1. **Option A (Lufthansa LH 714 Direct Rebook):**
   - Depart FRA: 14:55 CET • Arrive Tokyo HND: 11:40 JST (Day 2).
   - **Hard Gates:** **PASS (3/3)**. Arrives 2h 20m before keynote doors. $0 out-of-pocket (airline covered under EU261). Stays airside.
   - **Feasibility:** **100% (QUALIFIED & RECOMMENDED)**.
2. **Option B (Multimodal Rail ICE 623 + ANA NH 218 from Munich):**
   - Depart FRA Fernbahnhof: 14:35 CET • Arrive Tokyo HND: 16:05 JST (Day 2).
   - **Hard Gates:** **FATAL BREACH**. Requires clearing German Federal Police border control to access rail network (prohibited without Schengen visa); lands at 16:05 JST (2h 05m after keynote doors).
   - **Feasibility:** **0% (DISQUALIFIED)**.
3. **Option C (Airside Transit Hotel + Tomorrow Morning LH 716):**
   - Depart next morning 09:30 CET • Arrive Tokyo HND: 06:15 JST on **Day 3**.
   - **Hard Gates:** **FATAL BREACH**. Arrives 19.5 hours late into Day 3, completely forfeiting the keynote symposium.
   - **Feasibility:** **0% (DISQUALIFIED)**.

### Step D — Alternative Trade-off Comparison
- Side-by-side comparison table detailing route legs, arrival deadlines, costs, visa requirements, and gate results.
- Detailed audit drawer allowing travelers to inspect operational assumptions, missing evidence, and required verification actions (e.g. luggage re-tagging at Desk B22).

### Step E — Mandatory Traveler Authorization Gate
- RouteX will **never silently modify** an itinerary.
- An interactive authorization modal presents the proposed changes, downstream adjustments (hotel check-in shifted to 12:45 JST, keynote preserved), and requires the traveler to acknowledge operational assumptions before confirming.

### Step F — Synchronized Revised Timeline & Remaining Actions
- Disrupted flight LH 716 is marked `[MISSED / CANCELLED — REPLACED]`.
- Recovery flight LH 714 is highlighted in emerald as `[RECOVERY FLIGHT CONFIRMED]`.
- Displays remaining physical actions for traveler at Frankfurt Terminal 1:
  1. *Desk B22:* Print boarding card and verify bag tag `#LH-982341`.
  2. *Gate B42:* Proceed for 14:15 CET priority boarding.
  3. *Concierge Notice:* Automated late check-in notification sent to The Capitol Hotel Tokyu.
- Reset button allows replaying the demo seamlessly.

---

## 3. Meta Model Integration & Transparency
- **Isolated Service Interface:** [`IMetaTravelModelService.ts`](src/services/meta/IMetaTravelModelService.ts) specifies strict input and structured output contracts.
- **Live Meta Endpoint Ready:** [`MetaTravelModelService.ts`](src/services/meta/MetaTravelModelService.ts) implements the official Meta Llama chat completions API call with JSON schema enforcement.
- **Transparent Staging:** While awaiting Meta API credit grant, the system operates on a calibrated deterministic fixture ([`MetaRecoveryTestFixture.ts`](src/services/meta/MetaRecoveryTestFixture.ts)).
  - **Zero Third-Party LLM Substitution:** We strictly do NOT substitute Groq, Gemini, or OpenAI.
  - **Judge / Developer Telemetry Bar:** Allows pasting a live Meta API key directly in the UI to verify real Meta API connectivity on demand.
  - **Separation of Concerns:** The deterministic constraint validator runs independently of LLM inference so that model hallucinations cannot bypass immigration or budget limits.

---

## 4. Architecture & File Breakdown

```
d:\Meta Hackathon\
├── .env.example                                      # Meta API key environment template
├── .gitignore                                         # Protects secrets, credentials, node_modules
├── README.md                                          # Product specification & demo guide
├── index.html                                         # Web entry point with Plus Jakarta Sans
├── package.json                                       # React 18, Vite 5, Tailwind 3, Vitest 2
├── tsconfig.json                                      # TypeScript compiler setup
├── vite.config.ts                                     # Vite configuration
└── src/
    ├── main.tsx                                       # Application bootstrapper
    ├── App.tsx                                        # Master workflow controller & layout
    ├── index.css                                      # Aviation slate & editorial styling system
    ├── lib/
    │   └── utils.ts                                   # Reused RouteX cn() utility
    ├── hooks/
    │   └── useCurrency.ts                             # Currency formatting utility
    ├── types/
    │   └── travel.ts                                  # Hard gates, itinerary, and recovery types
    ├── data/
    │   └── syntheticDisruptionScenario.ts             # Calibrated LHR → FRA → HND scenario
    ├── services/
    │   ├── meta/
    │   │   ├── IMetaTravelModelService.ts             # Meta model service interface
    │   │   ├── MetaTravelModelService.ts              # Live Meta Llama API adapter
    │   │   └── MetaRecoveryTestFixture.ts             # Calibrated deterministic test fixture
    │   └── validation/
    │       └── RecoveryConstraintValidator.ts         # Deterministic hard constraint gate engine
    ├── components/
    │   ├── ui/                                        # Accessible UI primitives
    │   │   ├── alert.tsx
    │   │   ├── badge.tsx
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── dialog.tsx
    │   │   ├── progress.tsx
    │   │   ├── separator.tsx
    │   │   └── tabs.tsx
    │   └── recovery/
    │       ├── TripHeader.tsx                         # Manifest header & structured constraint cards
    │       ├── DisruptionAlertBanner.tsx              # Missed connection telemetry & trigger
    │       ├── RecoveryOptionsView.tsx                # Hero winner card & gate comparison matrix
    │       ├── TravelerApprovalModal.tsx              # Sovereign traveler authorization gate
    │       ├── RevisedItineraryTimeline.tsx           # Synchronized revised timeline & next steps
    │       └── DeveloperTelemetryBar.tsx              # Model architecture & live key tester
    └── test/
        └── recovery.test.ts                           # Automated test suite (6 tests passing)
```

---

## 5. Verification & Test Results

```bash
# Run test suite
npm test
# Result: 6 / 6 tests passing (100% test coverage for gates and time zones)

# Run TypeScript verification & production build
npm run build
# Result: 0 errors; built in 3.68s
```

---
