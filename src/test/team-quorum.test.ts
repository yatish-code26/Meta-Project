import { describe, it, expect } from 'vitest';
import { TeamQuorumEngine, QuorumTraveler, TeamQuorumInputs } from '../services/twin/TeamQuorumEngine';

describe('TeamQuorumEngine - Multi-Traveler Hub Shock & Knapsack Rescue', () => {
  const sampleTravelers: QuorumTraveler[] = [
    {
      id: 'sarah',
      name: 'Sarah Jenkins',
      role: 'Lead Presenter',
      originIata: 'LHR',
      hubIata: 'FRA',
      destinationIata: 'HND',
      scheduledLayoverMinutes: 140,
      mctBufferMinutes: 45,
      delayDistribution: { min: 70, mode: 105, max: 135 }, // tight margin
      verifiedRescueOption: {
        id: 'resc-sarah',
        title: 'LH 714 Direct',
        cost: 200,
        recoverySuccessProbability: 95,
      },
    },
    {
      id: 'david',
      name: 'David Chen',
      role: 'Tech Lead',
      originIata: 'CDG',
      hubIata: 'FRA',
      destinationIata: 'HND',
      scheduledLayoverMinutes: 140,
      mctBufferMinutes: 45,
      delayDistribution: { min: 60, mode: 85, max: 120 },
      verifiedRescueOption: {
        id: 'resc-david',
        title: 'ANA NH 224',
        cost: 250,
        recoverySuccessProbability: 90,
      },
    },
    {
      id: 'elena',
      name: 'Elena Rostova',
      role: 'VP Strategy',
      originIata: 'ZRH',
      hubIata: 'MUC',
      destinationIata: 'HND',
      scheduledLayoverMinutes: 180,
      mctBufferMinutes: 45,
      delayDistribution: { min: 10, mode: 30, max: 60 }, // safe margin
      verifiedRescueOption: {
        id: 'resc-elena',
        title: 'LH 716 Direct',
        cost: 300,
        recoverySuccessProbability: 98,
      },
    },
    {
      id: 'marcus',
      name: 'Marcus Vance',
      role: 'Keynote Speaker',
      originIata: 'MAN',
      hubIata: 'FRA',
      destinationIata: 'HND',
      scheduledLayoverMinutes: 140,
      mctBufferMinutes: 45,
      delayDistribution: { min: 80, mode: 110, max: 140 }, // very tight margin
      verifiedRescueOption: {
        id: 'resc-marcus',
        title: 'JL 408 Direct',
        cost: 220,
        recoverySuccessProbability: 96,
      },
    },
  ];

  const baseInputs: TeamQuorumInputs = {
    eventTitle: 'Tokyo Symposium Keynote',
    requiredCount: 3, // 3 of 4 required
    deadlineIso: '2027-03-11T12:00:00Z',
    sharedBudgetCeiling: 500,
    travelers: sampleTravelers,
    hasSharedHubCorrelation: true,
    sampleCount: 2000,
    seed: 2026,
  };

  it('calculates baseline quorum probability (k of N)', () => {
    const result = TeamQuorumEngine.simulate(baseInputs);

    expect(result.requiredCount).toBe(3);
    expect(result.totalTravelers).toBe(4);
    expect(result.baselineQuorumProbability).toBeGreaterThanOrEqual(0);
    expect(result.baselineQuorumProbability).toBeLessThanOrEqual(100);
    expect(result.perTravelerProbabilities.length).toBe(4);
  });

  it('identifies the most critical blocker traveler who jeopardizes quorum', () => {
    const result = TeamQuorumEngine.simulate(baseInputs);

    expect(result.criticalTraveler).not.toBeNull();
    // Marcus or Sarah has the tightest margin at FRA
    expect(['marcus', 'sarah']).toContain(result.criticalTraveler?.travelerId);
    expect(result.criticalTraveler?.criticalityScore).toBeGreaterThanOrEqual(0);
  });

  it('optimally allocates rescue budget to maximize quorum gain per dollar', () => {
    const result = TeamQuorumEngine.simulate(baseInputs);

    expect(result.optimizedQuorumProbability).toBeGreaterThanOrEqual(result.baselineQuorumProbability);
    expect(result.totalBudgetSpent).toBeLessThanOrEqual(baseInputs.sharedBudgetCeiling);
    expect(result.rescueAllocations.filter((a) => a.allocated).length).toBeGreaterThan(0);
  });

  it('common-shock hub correlation evaluates quorum probability', () => {
    const uncorrelatedInputs: TeamQuorumInputs = {
      ...baseInputs,
      hasSharedHubCorrelation: false,
    };

    const correlatedInputs: TeamQuorumInputs = {
      ...baseInputs,
      hasSharedHubCorrelation: true,
    };

    const uncorrResult = TeamQuorumEngine.simulate(uncorrelatedInputs);
    const corrResult = TeamQuorumEngine.simulate(correlatedInputs);

    expect(typeof uncorrResult.baselineQuorumProbability).toBe('number');
    expect(typeof corrResult.baselineQuorumProbability).toBe('number');
  });
});
