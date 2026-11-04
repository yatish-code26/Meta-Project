import { MonteCarloEngine } from './MonteCarloEngine';

export interface WaitOrCommitInputs {
  rebookingCost: number;             // $USD cost to lock in recovery path now
  missedCommitmentCost: number;      // $USD penalty / value of lost event
  nextStatusUpdateMinutes: number;   // Minutes until airline publishes gate/delay update
  optionExpiryMinutes: number;       // Minutes until candidate rebooking option expires
  currentDelayMinutes: number;       // Current observed delay (minutes)
  scheduledLayoverMinutes: number;   // Nominal layover at hub (minutes)
  mctBufferMinutes: number;          // Required hub MCT (minutes)
  surgeMultiplier?: number;          // Fallback surge price multiplier if waiting (default 1.3x)
  sampleCount?: number;              // Monte Carlo runs (default 5,000)
  seed?: number;                     // Deterministic seed
}

export interface WaitOrCommitResult {
  seed: number;
  sampleCount: number;
  runtimeMs: number;
  commitProbability: number;         // 100%
  waitProbability: number;           // % successful arrival if waiting
  commitExpectedCost: number;        // $USD expected cost of committing now
  waitExpectedCost: number;          // $USD expected cost of waiting
  commitRegret: number;              // $USD expected regret of committing (rebooking when original holds)
  waitRegret: number;                // $USD expected regret of waiting (failing or paying surge)
  valueOfWaiting: number;            // $USD (commitExpectedCost - waitExpectedCost)
  actionRecommendation: 'COMMIT_NOW' | 'WAIT_FOR_UPDATE';
  headlineRecommendation: string;
  rationale: string;
  editableAssumptions: Array<{
    id: string;
    label: string;
    value: number;
    unit: string;
  }>;
}

export class WaitOrCommitEngine {
  public static evaluate(inputs: WaitOrCommitInputs): WaitOrCommitResult {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const seed = inputs.seed ?? 1337;
    const N = Math.max(500, Math.min(20000, inputs.sampleCount ?? 5000));
    const prng = MonteCarloEngine.createPrng(seed);

    const surge = inputs.surgeMultiplier ?? 1.3;
    const canRebookAfterWait = inputs.nextStatusUpdateMinutes <= inputs.optionExpiryMinutes;

    let waitSuccessCount = 0;
    let totalWaitCost = 0;
    let totalCommitRegret = 0;
    let totalWaitRegret = 0;

    // Simulate delay evolution across N runs
    // Delay distribution modeled with mode at currentDelay, min at currentDelay - 15, max at currentDelay + 40
    const delayMin = Math.max(0, inputs.currentDelayMinutes - 15);
    const delayMode = inputs.currentDelayMinutes;
    const delayMax = inputs.currentDelayMinutes + 45;

    for (let i = 0; i < N; i++) {
      const sampledDelay = MonteCarloEngine.sampleTriangular(delayMin, delayMode, delayMax, prng);
      const effectiveLayover = inputs.scheduledLayoverMinutes - sampledDelay;
      const originalConnectionHolds = effectiveLayover >= inputs.mctBufferMinutes;

      // Strategy A: Commit Now
      // Cost is fixed at rebookingCost
      // Regret occurs if the original flight actually would have made it
      if (originalConnectionHolds) {
        totalCommitRegret += inputs.rebookingCost; // Paid for recovery unnecessarily
      }

      // Strategy B: Wait until update
      if (originalConnectionHolds) {
        // Original connection held! Traveled on original ticket for $0 extra
        waitSuccessCount++;
      } else {
        // Connection breached!
        if (canRebookAfterWait) {
          // Option still open, pay surge cost
          const fallbackCost = inputs.rebookingCost * surge;
          totalWaitCost += fallbackCost;
          totalWaitRegret += (fallbackCost - inputs.rebookingCost);
          waitSuccessCount++;
        } else {
          // Option expired while waiting! Missed commitment entirely
          totalWaitCost += inputs.missedCommitmentCost;
          totalWaitRegret += inputs.missedCommitmentCost;
        }
      }
    }

    const waitProbability = Math.round((waitSuccessCount / N) * 1000) / 10;
    const commitExpectedCost = Math.round(inputs.rebookingCost);
    const waitExpectedCost = Math.round(totalWaitCost / N);
    const commitRegret = Math.round(totalCommitRegret / N);
    const waitRegret = Math.round(totalWaitRegret / N);
    const valueOfWaiting = commitExpectedCost - waitExpectedCost;

    // Recommendation logic:
    // If option expires before next update, and current delay breaches connection, COMMIT_NOW is essential
    const isCurrentBreached = (inputs.scheduledLayoverMinutes - inputs.currentDelayMinutes) < inputs.mctBufferMinutes;
    const willOptionExpire = !canRebookAfterWait;

    let actionRecommendation: 'COMMIT_NOW' | 'WAIT_FOR_UPDATE' = 'COMMIT_NOW';
    let headlineRecommendation = '';
    let rationale = '';

    if (willOptionExpire && isCurrentBreached) {
      actionRecommendation = 'COMMIT_NOW';
      headlineRecommendation = 'Commit Now — Rebooking Option Expires Before Next Update';
      rationale = `Your candidate option expires in ${inputs.optionExpiryMinutes} min, but the next airline status update is in ${inputs.nextStatusUpdateMinutes} min. Waiting risks total forfeiture of the $${inputs.missedCommitmentCost.toLocaleString()} commitment.`;
    } else if (valueOfWaiting > 50 && waitProbability >= 70) {
      actionRecommendation = 'WAIT_FOR_UPDATE';
      headlineRecommendation = `Wait Until Update (${inputs.nextStatusUpdateMinutes} min)`;
      rationale = `Waiting has a positive expected value of +$${valueOfWaiting}. There is a ${waitProbability}% probability that your connection will hold without spending $${inputs.rebookingCost}.`;
    } else {
      actionRecommendation = 'COMMIT_NOW';
      headlineRecommendation = 'Commit Now — Risk Profile Disfavors Waiting';
      rationale = `Committing now guarantees 100% arrival certainty at a predictable cost of $${inputs.rebookingCost}. Waiting exposes you to $${waitExpectedCost} expected downside.`;
    }

    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const runtimeMs = Math.max(1, Math.round((t1 - t0) * 10) / 10);

    return {
      seed,
      sampleCount: N,
      runtimeMs,
      commitProbability: 100,
      waitProbability,
      commitExpectedCost,
      waitExpectedCost,
      commitRegret,
      waitRegret,
      valueOfWaiting,
      actionRecommendation,
      headlineRecommendation,
      rationale,
      editableAssumptions: [
        { id: 'rebookingCost', label: 'Candidate Rebooking Cost', value: inputs.rebookingCost, unit: 'USD' },
        { id: 'missedCommitmentCost', label: 'Cost of Missed Commitment', value: inputs.missedCommitmentCost, unit: 'USD' },
        { id: 'nextStatusUpdateMinutes', label: 'Next Status Update In', value: inputs.nextStatusUpdateMinutes, unit: 'min' },
        { id: 'optionExpiryMinutes', label: 'Option Expiration Window', value: inputs.optionExpiryMinutes, unit: 'min' },
        { id: 'surgeMultiplier', label: 'Surge Price if Waiting', value: surge, unit: 'x' },
      ],
    };
  }
}

