import { describe, it, expect } from 'vitest';
import { MonteCarloEngine } from '../services/twin/MonteCarloEngine';

describe('MonteCarloEngine - Probabilistic Twin Simulation', () => {
  it('1. Returns deterministic results for identical seeds', () => {
    const config = {
      sampleCount: 2000,
      seed: 42,
      delayMin: 20,
      delayMode: 75,
      delayMax: 120,
      walkVarianceMinutes: 8,
      mctVarianceMinutes: 5,
    };

    const nominal = {
      scheduledLayoverMinutes: 90,
      nominalMctMinutes: 45,
      options: [
        {
          id: 'opt-ana',
          title: 'ANA Direct',
          nominalAvailableWindowMins: 155,
          deadlineBufferMinutes: 240,
        },
      ],
    };

    const run1 = MonteCarloEngine.runSimulation(config, nominal);
    const run2 = MonteCarloEngine.runSimulation(config, nominal);

    expect(run1.originalConnectionSuccessRate).toBe(run2.originalConnectionSuccessRate);
    expect(run1.optionsStats[0].successProbability).toBe(run2.optionsStats[0].successProbability);
    expect(run1.optionsStats[0].p50MarginMinutes).toBe(run2.optionsStats[0].p50MarginMinutes);
  });

  it('2. Different seeds produce slightly varying but statistically close outputs', () => {
    const baseConfig = {
      sampleCount: 3000,
      delayMin: 30,
      delayMode: 75,
      delayMax: 130,
      walkVarianceMinutes: 5,
      mctVarianceMinutes: 5,
    };

    const nominal = {
      scheduledLayoverMinutes: 90,
      nominalMctMinutes: 45,
      options: [
        {
          id: 'opt-1',
          title: 'Option 1',
          nominalAvailableWindowMins: 140,
          deadlineBufferMinutes: 180,
        },
      ],
    };

    const runA = MonteCarloEngine.runSimulation({ ...baseConfig, seed: 100 }, nominal);
    const runB = MonteCarloEngine.runSimulation({ ...baseConfig, seed: 999 }, nominal);

    // Difference between rates should be less than 5% with 3000 samples
    expect(Math.abs(runA.originalConnectionSuccessRate - runB.originalConnectionSuccessRate)).toBeLessThan(5);
  });

  it('3. Cancellation reduces original connection success rate to 0%', () => {
    const config = {
      sampleCount: 1000,
      seed: 1337,
      delayMin: 0,
      delayMode: 20,
      delayMax: 50,
      walkVarianceMinutes: 5,
      mctVarianceMinutes: 5,
    };

    const run = MonteCarloEngine.runSimulation(config, {
      scheduledLayoverMinutes: 120,
      nominalMctMinutes: 45,
      isCancelled: true,
      options: [],
    });

    expect(run.originalConnectionSuccessRate).toBe(0);
  });

  it('4. Real runtime is measured and reported under 100ms for 5,000 samples', () => {
    const config = {
      sampleCount: 5000,
      seed: 777,
      delayMin: 20,
      delayMode: 60,
      delayMax: 110,
      walkVarianceMinutes: 6,
      mctVarianceMinutes: 4,
    };

    const nominal = {
      scheduledLayoverMinutes: 90,
      nominalMctMinutes: 45,
      options: [
        { id: 'opt-a', title: 'Option A', nominalAvailableWindowMins: 150, deadlineBufferMinutes: 120 },
        { id: 'opt-b', title: 'Option B', nominalAvailableWindowMins: 180, deadlineBufferMinutes: 90 },
      ],
    };

    const run = MonteCarloEngine.runSimulation(config, nominal);
    expect(run.sampleCount).toBe(5000);
    expect(run.runtimeMs).toBeGreaterThan(0);
    expect(run.runtimeMs).toBeLessThan(100); // Fast deterministic execution
    expect(run.optionsStats.length).toBe(2);
    expect(run.optionsStats[0].histogramBins.length).toBe(10);
  });
});

