/**
 * Monte Carlo Probabilistic Simulation Engine for RouteX Digital Twin.
 *
 * Simulates journey execution across thousands of runs with parameter uncertainty:
 * - Inbound flight delay modeled as a triangular distribution (min, most likely, max)
 * - Airport terminal transfer & walking time variance (+/- minutes)
 * - Hub border & gate operational MCT variance (+/- minutes)
 *
 * Uses a deterministic seeded PRNG (Mulberry32) for exact reproducibility.
 */

export interface MonteCarloConfig {
  sampleCount: number;         // e.g. 5000
  seed: number;                // PRNG seed, e.g. 1337
  delayMin: number;            // Minimum delay in minutes (e.g. 30)
  delayMode: number;           // Most likely delay in minutes (e.g. 75)
  delayMax: number;            // Maximum delay in minutes (e.g. 140)
  walkVarianceMinutes: number; // +/- walking time variance (e.g. 10)
  mctVarianceMinutes: number;  // +/- MCT requirement variance (e.g. 5)
  minConfidenceThreshold?: number; // Optional filter (e.g. 80%)
}

export interface OptionSimulationStats {
  optionId: string;
  optionTitle: string;
  successProbability: number; // 0 to 100%
  p10MarginMinutes: number;   // 10th percentile margin (pessimistic)
  p50MarginMinutes: number;   // 50th percentile margin (median)
  p90MarginMinutes: number;   // 90th percentile margin (optimistic)
  histogramBins: Array<{ binStart: number; binEnd: number; count: number }>;
}

export interface MonteCarloResult {
  seed: number;
  sampleCount: number;
  runtimeMs: number;
  originalConnectionSuccessRate: number; // % of samples where original connection makes MCT
  optionsStats: OptionSimulationStats[];
}

export class MonteCarloEngine {
  /**
   * Mulberry32 32-bit seeded pseudo-random number generator.
   */
  public static createPrng(seed: number): () => number {
    let s = Math.floor(seed) >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Sample from a Triangular distribution (min, mode, max).
   */
  public static sampleTriangular(min: number, mode: number, max: number, rand: () => number): number {
    const u = rand();
    const f = (mode - min) / (max - min);
    if (u < f) {
      return min + Math.sqrt(u * (max - min) * (mode - min));
    }
    return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
  }

  /**
   * Run Monte Carlo simulation for nominal scheduled layover, hub MCT, and candidate options.
   */
  public static runSimulation(
    config: MonteCarloConfig,
    nominalParams: {
      scheduledLayoverMinutes: number;
      nominalMctMinutes: number;
      isCancelled?: boolean;
      options: Array<{
        id: string;
        title: string;
        nominalAvailableWindowMins: number; // available transfer window at hub
        deadlineBufferMinutes: number;      // nominal buffer before keynote (deadline - arr)
      }>;
    }
  ): MonteCarloResult {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const prng = this.createPrng(config.seed);
    const N = Math.max(100, Math.min(20000, config.sampleCount));

    let originalSuccessCount = 0;

    // Track arrival margin samples for each option
    const optionSamples: Record<string, number[]> = {};
    const optionSuccessCounts: Record<string, number> = {};

    for (const opt of nominalParams.options) {
      optionSamples[opt.id] = [];
      optionSuccessCounts[opt.id] = 0;
    }

    if (nominalParams.isCancelled) {
      // If cancelled, original connection success is 0%
      originalSuccessCount = 0;
    }

    for (let i = 0; i < N; i++) {
      // 1. Sample inbound delay
      const sampleDelay = nominalParams.isCancelled
        ? 9999
        : this.sampleTriangular(config.delayMin, config.delayMode, config.delayMax, prng);

      // 2. Sample transfer / walk variance (-walkVariance to +walkVariance)
      const walkDelta = (prng() * 2 - 1) * config.walkVarianceMinutes;

      // 3. Sample effective hub MCT required (+/- mctVariance)
      const sampleMct = Math.max(
        15,
        nominalParams.nominalMctMinutes + (prng() * 2 - 1) * config.mctVarianceMinutes
      );

      // Check original connection
      if (!nominalParams.isCancelled) {
        const effectiveLayover = nominalParams.scheduledLayoverMinutes - sampleDelay - walkDelta;
        if (effectiveLayover >= sampleMct) {
          originalSuccessCount++;
        }
      }

      // Check each recovery candidate option
      for (const opt of nominalParams.options) {
        // Candidate connection window under sampled delay
        const sampleAvailableWindow = opt.nominalAvailableWindowMins - (sampleDelay - config.delayMode) - walkDelta;
        const candidateMakesConnection = sampleAvailableWindow >= sampleMct;

        // Sampled deadline buffer: variance in terminal arrival might shift arrival slightly
        const sampleDeadlineMargin = opt.deadlineBufferMinutes - (sampleDelay - config.delayMode) * 0.1;
        const candidateMeetsDeadline = sampleDeadlineMargin >= 0;

        const isSuccess = candidateMakesConnection && candidateMeetsDeadline;
        if (isSuccess) {
          optionSuccessCounts[opt.id]++;
        }
        optionSamples[opt.id].push(sampleDeadlineMargin);
      }
    }

    // Compute percentiles and histogram for each candidate
    const optionsStats: OptionSimulationStats[] = nominalParams.options.map((opt) => {
      const samples = optionSamples[opt.id].sort((a, b) => a - b);
      const successRate = Math.round((optionSuccessCounts[opt.id] / N) * 1000) / 10;

      const p10 = samples[Math.floor(N * 0.1)] ?? 0;
      const p50 = samples[Math.floor(N * 0.5)] ?? 0;
      const p90 = samples[Math.floor(N * 0.9)] ?? 0;

      // 10-bin histogram
      const minVal = samples[0] ?? -60;
      const maxVal = samples[samples.length - 1] ?? 180;
      const binWidth = Math.max(1, (maxVal - minVal) / 10);
      const bins = Array.from({ length: 10 }, (_, bIdx) => ({
        binStart: Math.round(minVal + bIdx * binWidth),
        binEnd: Math.round(minVal + (bIdx + 1) * binWidth),
        count: 0,
      }));

      for (const val of samples) {
        let bIdx = Math.floor((val - minVal) / binWidth);
        if (bIdx >= 10) bIdx = 9;
        if (bIdx < 0) bIdx = 0;
        bins[bIdx].count++;
      }

      return {
        optionId: opt.id,
        optionTitle: opt.title,
        successProbability: successRate,
        p10MarginMinutes: Math.round(p10),
        p50MarginMinutes: Math.round(p50),
        p90MarginMinutes: Math.round(p90),
        histogramBins: bins,
      };
    });

    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const runtimeMs = Math.max(1, Math.round((t1 - t0) * 10) / 10);

    return {
      seed: config.seed,
      sampleCount: N,
      runtimeMs,
      originalConnectionSuccessRate: Math.round((originalSuccessCount / N) * 1000) / 10,
      optionsStats,
    };
  }
}

