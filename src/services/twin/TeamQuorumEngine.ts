import { MonteCarloEngine } from './MonteCarloEngine';

export interface QuorumTraveler {
  id: string;
  name: string;
  role: string;
  originIata: string;
  hubIata: string;
  destinationIata: string;
  scheduledLayoverMinutes: number;
  mctBufferMinutes: number;
  delayDistribution: {
    min: number;
    mode: number;
    max: number;
  };
  verifiedRescueOption?: {
    id: string;
    title: string;
    cost: number;
    recoverySuccessProbability: number; // e.g. 95%
  };
}

export interface TeamQuorumInputs {
  eventTitle: string;
  requiredCount: number;             // k required travelers (e.g. 3)
  deadlineIso: string;
  sharedBudgetCeiling: number;       // e.g. $600 USD
  travelers: QuorumTraveler[];
  hasSharedHubCorrelation: boolean;  // Common shock delay at shared hubs
  sampleCount?: number;              // default 5000
  seed?: number;                     // deterministic seed
}

export interface RescueAllocation {
  travelerId: string;
  travelerName: string;
  optionTitle: string;
  cost: number;
  marginalGainPercent: number;       // Quorum probability gain per dollar * 100
  allocated: boolean;
}

export interface TeamQuorumResult {
  seed: number;
  sampleCount: number;
  runtimeMs: number;
  requiredCount: number;
  totalTravelers: number;
  baselineQuorumProbability: number; // P(>= k arrive) without rescue
  optimizedQuorumProbability: number; // P(>= k arrive) with allocated rescues
  quorumGainPercent: number;
  perTravelerProbabilities: Array<{
    travelerId: string;
    name: string;
    role: string;
    hubIata: string;
    baselineProbability: number;
    isAtRisk: boolean;
  }>;
  criticalTraveler: {
    travelerId: string;
    name: string;
    role: string;
    criticalityScore: number;         // Marginal Shapley impact on quorum
    explanation: string;
  } | null;
  rescueAllocations: RescueAllocation[];
  totalBudgetSpent: number;
  budgetRemaining: number;
}

export class TeamQuorumEngine {
  public static simulate(inputs: TeamQuorumInputs): TeamQuorumResult {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const seed = inputs.seed ?? 2026;
    const N = Math.max(500, Math.min(20000, inputs.sampleCount ?? 5000));
    const k = Math.max(1, Math.min(inputs.requiredCount, inputs.travelers.length));
    const prng = MonteCarloEngine.createPrng(seed);

    // Track baseline arrivals and counterfactuals
    let baselineQuorumSuccessCount = 0;
    const travelerArrivalCounts: Record<string, number> = {};
    const criticalFailureCounts: Record<string, number> = {};

    inputs.travelers.forEach((t) => {
      travelerArrivalCounts[t.id] = 0;
      criticalFailureCounts[t.id] = 0;
    });

    // Record sample matrix for Shapley & rescue analysis
    const sampleArrivalMatrix: boolean[][] = [];

    for (let s = 0; s < N; s++) {
      // 1. Common shock per hub if correlation enabled
      const hubShocks: Record<string, number> = {};
      if (inputs.hasSharedHubCorrelation) {
        // Unique hubs
        const hubs = Array.from(new Set(inputs.travelers.map((t) => t.hubIata)));
        hubs.forEach((hub) => {
          // 30% chance of a common ATC ground delay shock of 20-45m
          const hasCommonShock = prng() < 0.35;
          hubShocks[hub] = hasCommonShock ? Math.round(20 + prng() * 25) : 0;
        });
      }

      // 2. Individual traveler arrivals
      const arrivedTravelerIds: string[] = [];
      const sampleRow: boolean[] = [];

      inputs.travelers.forEach((t, tIdx) => {
        const indDelay = MonteCarloEngine.sampleTriangular(
          t.delayDistribution.min,
          t.delayDistribution.mode,
          t.delayDistribution.max,
          prng
        );
        const hubDelay = hubShocks[t.hubIata] || 0;
        const totalDelay = indDelay + hubDelay;
        const effectiveLayover = t.scheduledLayoverMinutes - totalDelay;
        const makesConnection = effectiveLayover >= t.mctBufferMinutes;

        if (makesConnection) {
          travelerArrivalCounts[t.id]++;
          arrivedTravelerIds.push(t.id);
          sampleRow.push(true);
        } else {
          sampleRow.push(false);
        }
      });

      sampleArrivalMatrix.push(sampleRow);

      const arrivedCount = arrivedTravelerIds.length;
      if (arrivedCount >= k) {
        baselineQuorumSuccessCount++;
      } else if (arrivedCount === k - 1) {
        // Critical quorum pivot! Any single traveler who failed was the decisive blocker
        inputs.travelers.forEach((t) => {
          if (!arrivedTravelerIds.includes(t.id)) {
            criticalFailureCounts[t.id]++;
          }
        });
      }
    }

    const baselineQuorumProbability = Math.round((baselineQuorumSuccessCount / N) * 1000) / 10;

    // Per traveler stats
    const perTravelerProbabilities = inputs.travelers.map((t) => {
      const p = Math.round((travelerArrivalCounts[t.id] / N) * 1000) / 10;
      return {
        travelerId: t.id,
        name: t.name,
        role: t.role,
        hubIata: t.hubIata,
        baselineProbability: p,
        isAtRisk: p < 80,
      };
    });

    // Determine critical traveler
    let criticalTraveler: TeamQuorumResult['criticalTraveler'] = null;
    let maxCriticalCount = -1;
    let criticalId = '';

    inputs.travelers.forEach((t) => {
      const count = criticalFailureCounts[t.id] || 0;
      if (count > maxCriticalCount) {
        maxCriticalCount = count;
        criticalId = t.id;
      }
    });

    if (criticalId) {
      const critObj = inputs.travelers.find((t) => t.id === criticalId)!;
      const critScore = Math.round((maxCriticalCount / N) * 1000) / 10;
      criticalTraveler = {
        travelerId: critObj.id,
        name: critObj.name,
        role: critObj.role,
        criticalityScore: critScore,
        explanation: `${critObj.name} (${critObj.role}) caused the quorum to fail in ${critScore}% of all critical pivot scenarios. Rescuing them yields the highest marginal quorum gain.`,
      };
    }

    // 3. Optimal Budget Allocation for Rescue
    // Evaluate marginal quorum probability gain per dollar for each candidate option
    const rescueCandidates = inputs.travelers
      .filter((t) => t.verifiedRescueOption && t.verifiedRescueOption.cost > 0)
      .map((t) => {
        const opt = t.verifiedRescueOption!;
        const baseProb = travelerArrivalCounts[t.id] / N;
        const targetProb = opt.recoverySuccessProbability / 100;
        const deltaIndividual = Math.max(0, targetProb - baseProb);

        // Estimate marginal quorum gain
        const marginalQuorumGain = ((criticalFailureCounts[t.id] || 0) / N) * deltaIndividual * 100;
        const gainPerDollar = opt.cost > 0 ? (marginalQuorumGain / opt.cost) * 100 : 0;

        return {
          travelerId: t.id,
          travelerName: t.name,
          optionTitle: opt.title,
          cost: opt.cost,
          gainPerDollar,
          marginalQuorumGain,
        };
      })
      .sort((a, b) => b.gainPerDollar - a.gainPerDollar);

    let currentBudget = inputs.sharedBudgetCeiling;
    let totalBudgetSpent = 0;
    const rescueAllocations: RescueAllocation[] = [];
    const rescuedTravelerIds = new Set<string>();

    for (const cand of rescueCandidates) {
      if (cand.cost <= currentBudget) {
        currentBudget -= cand.cost;
        totalBudgetSpent += cand.cost;
        rescuedTravelerIds.add(cand.travelerId);
        rescueAllocations.push({
          travelerId: cand.travelerId,
          travelerName: cand.travelerName,
          optionTitle: cand.optionTitle,
          cost: cand.cost,
          marginalGainPercent: Math.round(cand.gainPerDollar * 10) / 10,
          allocated: true,
        });
      } else {
        rescueAllocations.push({
          travelerId: cand.travelerId,
          travelerName: cand.travelerName,
          optionTitle: cand.optionTitle,
          cost: cand.cost,
          marginalGainPercent: Math.round(cand.gainPerDollar * 10) / 10,
          allocated: false,
        });
      }
    }

    // Re-simulate with allocated rescues
    let postRescueQuorumSuccess = 0;
    const rescuePrng = MonteCarloEngine.createPrng(seed + 100);

    for (let s = 0; s < N; s++) {
      let arrivedCount = 0;
      inputs.travelers.forEach((t, tIdx) => {
        const wasNominallyArrived = sampleArrivalMatrix[s][tIdx];
        if (wasNominallyArrived) {
          arrivedCount++;
        } else if (rescuedTravelerIds.has(t.id)) {
          // Rescue option activated!
          const rescueSuccessProb = t.verifiedRescueOption?.recoverySuccessProbability ?? 90;
          if (rescuePrng() * 100 < rescueSuccessProb) {
            arrivedCount++;
          }
        }
      });

      if (arrivedCount >= k) {
        postRescueQuorumSuccess++;
      }
    }

    const optimizedQuorumProbability = Math.round((postRescueQuorumSuccess / N) * 1000) / 10;
    const quorumGainPercent = Math.round((optimizedQuorumProbability - baselineQuorumProbability) * 10) / 10;

    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const runtimeMs = Math.max(1, Math.round((t1 - t0) * 10) / 10);

    return {
      seed,
      sampleCount: N,
      runtimeMs,
      requiredCount: k,
      totalTravelers: inputs.travelers.length,
      baselineQuorumProbability,
      optimizedQuorumProbability,
      quorumGainPercent,
      perTravelerProbabilities,
      criticalTraveler,
      rescueAllocations,
      totalBudgetSpent,
      budgetRemaining: currentBudget,
    };
  }
}

