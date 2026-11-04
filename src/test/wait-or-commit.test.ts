import { describe, it, expect } from 'vitest';
import { WaitOrCommitEngine, WaitOrCommitInputs } from '../services/twin/WaitOrCommitEngine';

describe('WaitOrCommitEngine - Monte Carlo Option Decision Engine', () => {
  const baseInputs: WaitOrCommitInputs = {
    rebookingCost: 150,
    missedCommitmentCost: 1000,
    nextStatusUpdateMinutes: 30,
    optionExpiryMinutes: 45,
    currentDelayMinutes: 75,
    scheduledLayoverMinutes: 140,
    mctBufferMinutes: 45,
    surgeMultiplier: 1.3,
    sampleCount: 2000,
    seed: 1337,
  };

  it('runs Monte Carlo simulations deterministically with fixed random seeds', () => {
    const res1 = WaitOrCommitEngine.evaluate(baseInputs);
    const res2 = WaitOrCommitEngine.evaluate(baseInputs);

    expect(res1.actionRecommendation).toBe(res2.actionRecommendation);
    expect(res1.commitExpectedCost).toBe(res2.commitExpectedCost);
    expect(res1.waitExpectedCost).toBe(res2.waitExpectedCost);
    expect(res1.commitProbability).toBe(100);
    expect(res1.editableAssumptions.length).toBeGreaterThan(0);
  });

  it('recommends COMMIT_NOW when option expires BEFORE next update', () => {
    const expiringSoonInputs: WaitOrCommitInputs = {
      ...baseInputs,
      optionExpiryMinutes: 10,
      nextStatusUpdateMinutes: 30, // update arrives 20 min AFTER hold expires!
      currentDelayMinutes: 85,
    };

    const result = WaitOrCommitEngine.evaluate(expiringSoonInputs);
    expect(result.actionRecommendation).toBe('COMMIT_NOW');
    expect(result.headlineRecommendation).toContain('Commit Now');
    expect(result.rationale).toContain('Committing now');
  });

  it('recommends WAIT_FOR_UPDATE when original connection is safe and waiting has positive value', () => {
    const safeOriginalInputs: WaitOrCommitInputs = {
      ...baseInputs,
      currentDelayMinutes: 10, // barely delayed, plenty of layover margin
      scheduledLayoverMinutes: 180,
      mctBufferMinutes: 45,
      optionExpiryMinutes: 90,
      nextStatusUpdateMinutes: 15,
      rebookingCost: 600, // expensive rebooking
      missedCommitmentCost: 500,
    };

    const result = WaitOrCommitEngine.evaluate(safeOriginalInputs);
    expect(result.actionRecommendation).toBe('WAIT_FOR_UPDATE');
    expect(result.valueOfWaiting).toBeGreaterThan(0);
  });

  it('computes expected loss, regret, and probability bounds', () => {
    const result = WaitOrCommitEngine.evaluate(baseInputs);

    expect(result.commitProbability).toBe(100);
    expect(result.waitProbability).toBeGreaterThanOrEqual(0);
    expect(result.waitProbability).toBeLessThanOrEqual(100);
    expect(result.commitExpectedCost).toBeGreaterThan(0);
    expect(typeof result.commitRegret).toBe('number');
    expect(typeof result.waitRegret).toBe('number');
  });
});
