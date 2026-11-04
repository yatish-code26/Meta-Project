import React, { useState, useMemo } from 'react';
import { HelpCircle, Clock, DollarSign, ArrowRight, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { WaitOrCommitEngine, WaitOrCommitInputs } from '../../services/twin/WaitOrCommitEngine';
import { useRouteXStore } from '../../context/RouteXStore';

export function WaitOrCommitAdvisor() {
  const { state, disruptionCalc, currentConfig } = useRouteXStore();

  const [rebookingCost, setRebookingCost] = useState<number>(150);
  const [missedCommitmentCost, setMissedCommitmentCost] = useState<number>(1200);
  const [nextStatusUpdateMinutes, setNextStatusUpdateMinutes] = useState<number>(30);
  const [optionExpiryMinutes, setOptionExpiryMinutes] = useState<number>(45);
  const [surgeMultiplier, setSurgeMultiplier] = useState<number>(1.3);

  const inputs: WaitOrCommitInputs = useMemo(
    () => ({
      rebookingCost,
      missedCommitmentCost,
      nextStatusUpdateMinutes,
      optionExpiryMinutes,
      currentDelayMinutes: state.params.delayMinutes,
      scheduledLayoverMinutes: currentConfig.scheduledLayoverMinutes,
      mctBufferMinutes: state.params.mctBufferMinutes,
      surgeMultiplier,
      sampleCount: 5000,
      seed: 1337,
    }),
    [
      rebookingCost,
      missedCommitmentCost,
      nextStatusUpdateMinutes,
      optionExpiryMinutes,
      state.params.delayMinutes,
      currentConfig.scheduledLayoverMinutes,
      state.params.mctBufferMinutes,
      surgeMultiplier,
    ]
  );

  const result = useMemo(() => {
    return WaitOrCommitEngine.evaluate(inputs);
  }, [inputs]);

  const isCommit = result.actionRecommendation === 'COMMIT_NOW';

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Wait-or-Commit Decision Advisor
          </h4>
        </div>
        <span
          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
            isCommit
              ? 'bg-primary text-white'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          }`}
        >
          Engine Recommendation: {isCommit ? 'Commit Now' : 'Wait for Update'}
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Monte Carlo game-theoretic advisor balancing the cost of premature rebooking against the risk that flight inventory expires before the next airline delay update.
      </p>

      {/* Primary Recommendation Banner */}
      <div
        className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
          isCommit
            ? 'bg-primary/5 border-primary/20 text-foreground'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-950'
        }`}
      >
        <div className="flex items-center gap-2 font-bold text-sm">
          {isCommit ? (
            <AlertTriangle className="w-4 h-4 text-primary flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          )}
          <span>{result.headlineRecommendation}</span>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          {result.rationale}
        </p>
      </div>

      {/* Side-by-Side Expected Outcome Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Strategy 1: Commit Now */}
        <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">Action: Commit Now</span>
            <span className="px-2 py-0.5 rounded bg-card text-foreground font-bold text-[11px] border border-border">
              100% Certainty
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Expected Out-of-Pocket:</span>
              <span className="font-bold text-foreground">${result.commitExpectedCost} USD</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Expected Regret (Overpaying):</span>
              <span className="font-medium text-amber-700">${result.commitRegret} USD</span>
            </div>
          </div>
        </div>

        {/* Strategy 2: Wait Until Update */}
        <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-foreground">Action: Wait Until Update</span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
              {result.waitProbability}% Success P
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Expected Net Outcome:</span>
              <span className="font-bold text-foreground">${result.waitExpectedCost} USD</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Value of Waiting:</span>
              <span
                className={`font-bold ${
                  result.valueOfWaiting >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {result.valueOfWaiting >= 0 ? `+$${result.valueOfWaiting}` : `-$${Math.abs(result.valueOfWaiting)}`} USD
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Editable Parameters Strip */}
      <div className="p-3.5 rounded-xl border border-border bg-secondary/20 space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
          Editable Advisor Assumptions
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-muted-foreground mb-1">Rebooking Cost ($)</label>
            <input
              type="number"
              min={0}
              max={1000}
              step={25}
              value={rebookingCost}
              onChange={(e) => setRebookingCost(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-card border border-border rounded px-2.5 py-1 text-xs font-bold text-foreground"
            />
          </div>

          <div>
            <label className="block text-muted-foreground mb-1">Commitment Value ($)</label>
            <input
              type="number"
              min={0}
              max={5000}
              step={100}
              value={missedCommitmentCost}
              onChange={(e) => setMissedCommitmentCost(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-card border border-border rounded px-2.5 py-1 text-xs font-bold text-foreground"
            />
          </div>

          <div>
            <label className="block text-muted-foreground mb-1">Status Update In (m)</label>
            <input
              type="number"
              min={5}
              max={120}
              step={5}
              value={nextStatusUpdateMinutes}
              onChange={(e) => setNextStatusUpdateMinutes(parseInt(e.target.value, 10) || 5)}
              className="w-full bg-card border border-border rounded px-2.5 py-1 text-xs font-bold text-foreground"
            />
          </div>

          <div>
            <label className="block text-muted-foreground mb-1">Option Expiry In (m)</label>
            <input
              type="number"
              min={5}
              max={180}
              step={5}
              value={optionExpiryMinutes}
              onChange={(e) => setOptionExpiryMinutes(parseInt(e.target.value, 10) || 5)}
              className="w-full bg-card border border-border rounded px-2.5 py-1 text-xs font-bold text-foreground"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

