import React, { useState, useMemo } from 'react';
import { Users, Shield, Zap, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, DollarSign } from 'lucide-react';
import { TeamQuorumEngine, QuorumTraveler, TeamQuorumInputs } from '../../services/twin/TeamQuorumEngine';
import { useRouteXStore } from '../../context/RouteXStore';

const INITIAL_TEAM: QuorumTraveler[] = [
  {
    id: 'trav-1',
    name: 'Sarah Jenkins',
    role: 'Lead Presenter',
    originIata: 'LHR',
    hubIata: 'FRA',
    destinationIata: 'HND',
    scheduledLayoverMinutes: 140,
    mctBufferMinutes: 45,
    delayDistribution: { min: 60, mode: 90, max: 130 },
    verifiedRescueOption: {
      id: 'resc-1',
      title: 'LH 714 Direct Rebook',
      cost: 150,
      recoverySuccessProbability: 95,
    },
  },
  {
    id: 'trav-2',
    name: 'David Chen',
    role: 'Technical Architect',
    originIata: 'CDG',
    hubIata: 'FRA',
    destinationIata: 'HND',
    scheduledLayoverMinutes: 80,
    mctBufferMinutes: 45,
    delayDistribution: { min: 20, mode: 50, max: 80 },
    verifiedRescueOption: {
      id: 'resc-2',
      title: 'ANA NH 224 Airside Connect',
      cost: 180,
      recoverySuccessProbability: 92,
    },
  },
  {
    id: 'trav-3',
    name: 'Elena Rostova',
    role: 'VP Corporate Strategy',
    originIata: 'ZRH',
    hubIata: 'MUC',
    destinationIata: 'HND',
    scheduledLayoverMinutes: 95,
    mctBufferMinutes: 40,
    delayDistribution: { min: 10, mode: 30, max: 60 },
    verifiedRescueOption: {
      id: 'resc-3',
      title: 'LH 716 Munich Connection',
      cost: 200,
      recoverySuccessProbability: 96,
    },
  },
  {
    id: 'trav-4',
    name: 'Marcus Vance',
    role: 'Financial Counsel',
    originIata: 'AMS',
    hubIata: 'FRA',
    destinationIata: 'HND',
    scheduledLayoverMinutes: 65,
    mctBufferMinutes: 45,
    delayDistribution: { min: 15, mode: 35, max: 70 },
    verifiedRescueOption: {
      id: 'resc-4',
      title: 'JAL JL 408 Rebook',
      cost: 220,
      recoverySuccessProbability: 90,
    },
  },
];

export function TeamQuorumView() {
  const { state } = useRouteXStore();
  const [team, setTeam] = useState<QuorumTraveler[]>(INITIAL_TEAM);
  const [requiredCount, setRequiredCount] = useState<number>(3);
  const [sharedBudget, setSharedBudget] = useState<number>(400);
  const [hasCorrelation, setHasCorrelation] = useState<boolean>(true);
  const [seed, setSeed] = useState<number>(2026);

  const rollSeed = () => {
    setSeed(Math.floor(Math.random() * 90000) + 1000);
  };

  const simulationInputs: TeamQuorumInputs = useMemo(
    () => ({
      eventTitle: 'Executive Symposium Quorum',
      requiredCount,
      deadlineIso: '2027-03-11T12:00:00Z',
      sharedBudgetCeiling: sharedBudget,
      travelers: team,
      hasSharedHubCorrelation: hasCorrelation,
      sampleCount: 5000,
      seed,
    }),
    [team, requiredCount, sharedBudget, hasCorrelation, seed]
  );

  const results = useMemo(() => {
    return TeamQuorumEngine.simulate(simulationInputs);
  }, [simulationInputs]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 pb-16">
      {/* Header Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Team Quorum Digital Twin
              </h2>
              <p className="text-xs text-muted-foreground">
                Simulates multi-traveler rendezvous where an event requires at least{' '}
                <strong>{requiredCount} of {team.length} members</strong> to be present by deadline.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={rollSeed}
              className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-semibold text-foreground flex items-center gap-1.5 shadow-sm"
              title="Roll PRNG Seed"
            >
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
              <span>Seed: {seed}</span>
            </button>
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
              {results.runtimeMs}ms
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <span className="text-[12px] font-medium text-muted-foreground block">
            Baseline Quorum P(≥{requiredCount})
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-bold ${
                results.baselineQuorumProbability >= 80
                  ? 'text-emerald-700'
                  : results.baselineQuorumProbability >= 50
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}
            >
              {results.baselineQuorumProbability}%
            </span>
            <span className="text-xs text-muted-foreground">unassisted</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <span className="text-[12px] font-medium text-muted-foreground block">
            Optimized Quorum P(≥{requiredCount})
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-700">
              {results.optimizedQuorumProbability}%
            </span>
            <span className="text-xs text-emerald-700 font-bold">
              (+{results.quorumGainPercent}%)
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <span className="text-[12px] font-medium text-muted-foreground block">
            Rescue Budget Spent
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">
              ${results.totalBudgetSpent}
            </span>
            <span className="text-xs text-muted-foreground">/ ${sharedBudget}</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <span className="text-[12px] font-medium text-muted-foreground block">
            Budget Remaining
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">
              ${results.budgetRemaining}
            </span>
            <span className="text-xs text-muted-foreground">USD reserve</span>
          </div>
        </div>
      </div>

      {/* Critical Traveler Spotlight */}
      {results.criticalTraveler && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Decisive Quorum Blocker: {results.criticalTraveler.name} ({results.criticalTraveler.role})</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {results.criticalTraveler.explanation}
          </p>
        </div>
      )}

      {/* Simulation Controls Strip */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
          Quorum Parameters & Common-Shock Assumptions
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-muted-foreground font-semibold mb-1">
              Required Quorum Count (k of {team.length})
            </label>
            <select
              value={requiredCount}
              onChange={(e) => setRequiredCount(parseInt(e.target.value, 10))}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-foreground"
            >
              {team.map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  At least {i + 1} of {team.length} must arrive
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-muted-foreground font-semibold mb-1">
              Shared Rescue Budget ($USD)
            </label>
            <input
              type="number"
              min={0}
              max={2000}
              step={50}
              value={sharedBudget}
              onChange={(e) => setSharedBudget(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-foreground"
            />
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-foreground py-2">
              <input
                type="checkbox"
                checked={hasCorrelation}
                onChange={(e) => setHasCorrelation(e.target.checked)}
                className="rounded text-primary focus:ring-primary w-4 h-4"
              />
              <span>Common-Shock Hub Delay (FRA ATC Slot)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Travelers & Rescue Recommendations List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
          Individual Traveler Status & Optimal Rescue Allocations
        </h4>

        <div className="space-y-3">
          {results.perTravelerProbabilities.map((tp) => {
            const rawTraveler = team.find((t) => t.id === tp.travelerId)!;
            const rescue = results.rescueAllocations.find((r) => r.travelerId === tp.travelerId);

            return (
              <div
                key={tp.travelerId}
                className={`p-4 rounded-xl border bg-card shadow-sm transition-all ${
                  tp.isAtRisk ? 'border-amber-500/30' : 'border-border'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">{tp.name}</span>
                      <span className="text-xs text-muted-foreground font-medium">({tp.role})</span>
                      {tp.isAtRisk && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                          At Risk
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      Routing: {rawTraveler.originIata} → {rawTraveler.hubIata} (Hub) → {rawTraveler.destinationIata}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-base font-bold ${
                        tp.baselineProbability >= 80 ? 'text-emerald-700' : 'text-amber-600'
                      }`}
                    >
                      {tp.baselineProbability}%
                    </span>
                    <span className="text-[11px] text-muted-foreground block">On-time arrival prob</span>
                  </div>
                </div>

                {/* Rescue Option Allocation */}
                {rescue && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs bg-secondary/30 p-2.5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <div>
                        <span className="font-bold text-foreground">{rescue.optionTitle}</span>
                        <span className="text-muted-foreground block text-[11px]">
                          Cost: ${rescue.cost} USD • Marginal Quorum Gain: +{rescue.marginalGainPercent}% / $
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        rescue.allocated
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {rescue.allocated ? 'Allocated by Engine' : 'Exceeds Shared Budget'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

