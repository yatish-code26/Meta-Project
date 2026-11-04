import React from 'react';
import {
  SlidersHorizontal,
  Clock,
  DollarSign,
  Calendar,
  Shield,
  Gauge,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info,
} from 'lucide-react';
import { useRouteXStore } from '../../context/RouteXStore';
import { RiskProfile } from '../../types/twin';
import { PasteDisruptionCard } from './PasteDisruptionCard';
import { WhatWouldChangeThis } from './WhatWouldChangeThis';
import { KnockOnImpactAndDrafts } from '../recovery/KnockOnImpactAndDrafts';
import { DelayPropagationGraph } from './DelayPropagationGraph';
import { ProbabilisticTwinView } from './ProbabilisticTwinView';
import { DecisionHorizon } from './DecisionHorizon';
import { StressTestMatrix } from './StressTestMatrix';
import { WaitOrCommitAdvisor } from './WaitOrCommitAdvisor';

export function TwinLab() {
  const { state, dispatch, disruptionCalc, evaluatedOptions, currentConfig } = useRouteXStore();

  const delay = state.params.delayMinutes;
  const budget = state.params.budgetCeiling;
  const deadline = state.params.arrivalDeadlineHours;
  const mct = state.params.mctBufferMinutes;
  const visaAirside = state.params.visaAirsideOnly;
  const riskProfile: RiskProfile = state.params.riskProfile ?? 'balanced';

  // Stats
  const viableOptions = evaluatedOptions.filter((o) => o.hardGatePassed);
  const viableCount = viableOptions.length;
  const totalCount = evaluatedOptions.length;
  const earliestArrival = viableOptions.length > 0 ? viableOptions[0].finalArrivalTime : 'None viable';
  const costs = viableOptions.map((o) => o.outOfPocketCost);
  const minCost = costs.length > 0 ? Math.min(...costs) : 0;
  const maxCost = costs.length > 0 ? Math.max(...costs) : 0;

  // Sensitivity simulation across delay checkpoints: [0, 15, 30, 50, 75, 90, 120]
  const sensitivityCheckpoints = [0, 15, 30, 50, 75, 90, 120].map((testDelay) => {
    const scheduledLayover = currentConfig.scheduledLayoverMinutes;
    const testLayover = scheduledLayover - testDelay;
    const margin = testLayover - mct;
    return {
      testDelay,
      testLayover,
      margin,
      isMissed: margin < 0,
      isCurrent: Math.abs(testDelay - delay) <= 10,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-foreground">RouteX Twin Lab™ Simulation</h3>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Live Deterministic Engine
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          Scrub parameters to test scenario resilience. Hard operational gates (MCT, budget ceiling, deadline, visa borders)
          re-evaluate synchronously without compromise.
        </p>
      </div>

      {/* Feature F3: Paste Disruption (Email / SMS Parser) */}
      <PasteDisruptionCard />

      {/* Headline Feature Stage 2: Delay Propagation Graph */}
      <DelayPropagationGraph />

      {/* Headline Feature Stage 2: Decision Horizon & Cutoff Countdown */}
      <DecisionHorizon />

      {/* Headline Feature Stage 2: Probabilistic Twin (Monte Carlo Engine) */}
      <ProbabilisticTwinView />

      {/* Sprint v4 Headline: Wait-or-Commit Advisor (Monte Carlo Option Pricing) */}
      <WaitOrCommitAdvisor />

      {/* 4-Card Stats Column (Reference 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
          <span className="text-[12px] font-medium text-muted-foreground block">Viable Routes</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-lg font-bold ${
                viableCount > 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {viableCount}
            </span>
            <span className="text-xs text-muted-foreground">/ {totalCount} evaluated</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
          <span className="text-[12px] font-medium text-muted-foreground block">Connection Margin</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-lg font-bold ${
                disruptionCalc.connectionMarginMinutes >= 0
                  ? 'text-emerald-700'
                  : 'text-rose-600'
              }`}
            >
              {disruptionCalc.connectionMarginMinutes >= 0 ? '+' : ''}
              {disruptionCalc.connectionMarginMinutes}m
            </span>
            <span className="text-xs text-muted-foreground">
              {disruptionCalc.connectionMarginMinutes >= 0 ? 'buffer' : 'breach'}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
          <span className="text-[12px] font-medium text-muted-foreground block">Earliest Arrival</span>
          <div className="mt-1">
            <span className="text-sm font-bold text-foreground truncate block">
              {earliestArrival}
            </span>
            <span className="text-[12px] text-muted-foreground">Keynote Day 2</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
          <span className="text-[12px] font-medium text-muted-foreground block">Cost Spread</span>
          <div className="mt-1">
            <span className="text-sm font-bold text-foreground block">
              ${minCost} – ${maxCost}
            </span>
            <span className="text-[12px] text-muted-foreground">USD extra</span>
          </div>
        </div>
      </div>

      {/* Risk Profile Segmented Selector */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-primary" />
            <label className="text-xs font-bold text-foreground">Risk Profile (Soft Scoring Weights)</label>
          </div>
          <span className="text-[12px] text-muted-foreground">Hard gates strictly preserved</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 bg-secondary/60 p-1 rounded-xl">
          {(
            [
              { id: 'cautious', label: 'Cautious', desc: 'Prizes MCT buffer & alliance continuity' },
              { id: 'balanced', label: 'Balanced', desc: 'Default trade-off between time & cost' },
              { id: 'fastest', label: 'Fastest', desc: 'Prioritizes earliest arrival time' },
            ] as const
          ).map((item) => {
            const isSelected = riskProfile === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => dispatch({ type: 'SET_RISK_PROFILE', profile: item.id })}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all text-center ${
                  isSelected
                    ? 'bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                }`}
              >
                <div className="font-bold">{item.label}</div>
              </button>
            );
          })}
        </div>

        <p className="text-[12px] text-muted-foreground italic flex items-center gap-1 pt-1">
          <Info className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          {riskProfile === 'cautious' &&
            'Cautious profile: penalizes tight connections (<30m) and rewards carrier alliance loyalty.'}
          {riskProfile === 'balanced' &&
            'Balanced profile: standard multi-objective optimization balancing fees and schedule buffer.'}
          {riskProfile === 'fastest' &&
            'Fastest profile: prioritizes minimum delay hours while accepting tighter viable connection buffers.'}
        </p>
      </div>

      {/* Labeled Sliders Section */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-5 shadow-sm">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
          Simulation Constraints
        </h4>

        {/* 1. Inbound Delay Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Inbound Delay
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`font-bold px-2 py-0.5 rounded-md ${
                  delay === 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : delay <= 20
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                +{delay}m {delay === 0 ? '(On Time)' : delay <= 20 ? '(Intact)' : '(Missed)'}
              </span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={180}
            step={5}
            value={delay}
            onChange={(e) =>
              dispatch({ type: 'UPDATE_PARAM', key: 'delayMinutes', value: parseInt(e.target.value, 10) })
            }
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex items-center justify-between text-[12px] text-muted-foreground">
            <span>0m (On Time)</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => dispatch({ type: 'UPDATE_PARAM', key: 'delayMinutes', value: 0 })}
                className="hover:text-primary underline text-[12px]"
              >
                0m
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => dispatch({ type: 'UPDATE_PARAM', key: 'delayMinutes', value: 75 })}
                className="hover:text-primary underline text-[12px]"
              >
                +75m (Default)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => dispatch({ type: 'UPDATE_PARAM', key: 'delayMinutes', value: 120 })}
                className="hover:text-primary underline text-[12px]"
              >
                +120m
              </button>
            </div>
            <span>180m (Severe)</span>
          </div>
        </div>

        {/* 2. Budget Ceiling Slider */}
        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-primary" />
              Emergency Budget Ceiling
            </span>
            <span className="font-bold text-foreground px-2 py-0.5 rounded-md bg-secondary">
              ${budget} USD Max
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1000}
            step={25}
            value={budget}
            onChange={(e) =>
              dispatch({ type: 'UPDATE_PARAM', key: 'budgetCeiling', value: parseInt(e.target.value, 10) })
            }
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex items-center justify-between text-[12px] text-muted-foreground">
            <span>$0 (Free Only)</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => dispatch({ type: 'UPDATE_PARAM', key: 'budgetCeiling', value: 0 })}
                className="hover:text-primary underline text-[12px]"
              >
                $0
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => dispatch({ type: 'UPDATE_PARAM', key: 'budgetCeiling', value: 450 })}
                className="hover:text-primary underline text-[12px]"
              >
                $450
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => dispatch({ type: 'UPDATE_PARAM', key: 'budgetCeiling', value: 1000 })}
                className="hover:text-primary underline text-[12px]"
              >
                $1000
              </button>
            </div>
            <span>$1000</span>
          </div>
        </div>

        {/* 3. Mandatory Arrival Deadline Slider */}
        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              Mandatory Arrival Deadline
            </span>
            <span className="font-bold text-foreground px-2 py-0.5 rounded-md bg-secondary">
              Day 2, {deadline === 14.0 ? '14:00 JST' : `${deadline.toFixed(1)}h`}
            </span>
          </div>
          <input
            type="range"
            min={10.0}
            max={24.0}
            step={0.5}
            value={deadline}
            onChange={(e) =>
              dispatch({ type: 'UPDATE_PARAM', key: 'arrivalDeadlineHours', value: parseFloat(e.target.value) })
            }
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex items-center justify-between text-[12px] text-muted-foreground">
            <span>10:00 (Early)</span>
            <button
              type="button"
              onClick={() => dispatch({ type: 'UPDATE_PARAM', key: 'arrivalDeadlineHours', value: 14.0 })}
              className="hover:text-primary underline text-[12px]"
            >
              14:00 Keynote (Default)
            </button>
            <span>24:00 (Late Night)</span>
          </div>
        </div>

        {/* 4. Minimum Connection Time (MCT) Buffer Slider */}
        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-primary" />
              Hub Minimum Connection Time (MCT)
            </span>
            <span className="font-bold text-foreground px-2 py-0.5 rounded-md bg-secondary">
              {mct}m Buffer
            </span>
          </div>
          <input
            type="range"
            min={15}
            max={90}
            step={5}
            value={mct}
            onChange={(e) =>
              dispatch({ type: 'UPDATE_PARAM', key: 'mctBufferMinutes', value: parseInt(e.target.value, 10) })
            }
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex items-center justify-between text-[12px] text-muted-foreground">
            <span>15m (Aggressive)</span>
            <button
              type="button"
              onClick={() => dispatch({ type: 'UPDATE_PARAM', key: 'mctBufferMinutes', value: 45 })}
              className="hover:text-primary underline text-[12px]"
            >
              45m (Frankfurt Standard)
            </button>
            <span>90m (Conservative)</span>
          </div>
        </div>

        {/* 5. Airside Border Crossing Toggle */}
        <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />
              Schengen Border Control
            </span>
            <p className="text-[12px] text-muted-foreground">
              {visaAirside
                ? 'Airside Only (Disqualifies landside rail transfers)'
                : 'Landside Border Permitted (German visa valid)'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: 'UPDATE_PARAM', key: 'visaAirsideOnly', value: !visaAirside })}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
              visaAirside
                ? 'bg-primary text-white'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {visaAirside ? 'Strict Airside' : 'Border Allowed'}
          </button>
        </div>
      </div>

      {/* Margin Bar Chart (Per Candidate Option) */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-bold text-foreground">Operational Margin Bar Chart</h4>
          </div>
          <span className="text-[12px] text-muted-foreground">Evaluated vs Active Gates</span>
        </div>

        {disruptionCalc.isConnectionMissed ? (
          <div className="space-y-3">
            {evaluatedOptions.map((opt) => {
              // Calculate connection margin (available window vs MCT)
              const candMins = opt.carrierSummary.includes('ANA')
                ? 155
                : opt.carrierSummary.includes('Air France')
                ? 85
                : 120;
              const candMargin = candMins - mct;
              const isFeasible = opt.hardGatePassed;

              return (
                <div key={opt.id} className="space-y-1.5 bg-secondary/30 p-2.5 rounded-lg border border-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      {isFeasible ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                      )}
                      {opt.title}
                    </span>
                    <span
                      className={`font-semibold text-[12px] px-1.5 py-0.5 rounded ${
                        isFeasible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isFeasible ? 'Feasible' : 'Gate Failed'}
                    </span>
                  </div>

                  {/* Horizontal Margin Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[12px] text-muted-foreground">
                      <span>Connection Buffer ({candMins}m transfer)</span>
                      <span className={candMargin >= 0 ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                        {candMargin >= 0 ? `+${candMargin}m safe` : `${candMargin}m breach`}
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          candMargin >= 30
                            ? 'bg-emerald-600'
                            : candMargin >= 0
                            ? 'bg-amber-500'
                            : 'bg-rose-600'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(10, ((candMargin + 30) / 150) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Gate breach detail if failed */}
                  {!isFeasible && opt.gateBreaches.length > 0 && (
                    <div className="text-[12px] text-rose-700 font-medium pt-1">
                      Reason: {opt.gateBreaches[0]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Original Connection Fully Intact
            </div>
            <p className="text-xs leading-relaxed">
              With an inbound delay of +{delay}m, the transfer window at Frankfurt remains {currentConfig.scheduledLayoverMinutes - delay}m.
              This safely exceeds the required {mct}m MCT by +{disruptionCalc.connectionMarginMinutes}m.
              No recovery options need to be booked.
            </p>
          </div>
        )}
      </div>

      {/* Delay Sensitivity Trend Grid (Reference 3 inspired) */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-bold text-foreground">Delay vs Connection Margin Curve</h4>
          </div>
          <span className="text-[12px] text-muted-foreground">Hub MCT: {mct}m</span>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {sensitivityCheckpoints.map((pt) => (
            <button
              key={pt.testDelay}
              type="button"
              onClick={() =>
                dispatch({ type: 'UPDATE_PARAM', key: 'delayMinutes', value: pt.testDelay })
              }
              className={`p-2 rounded-lg border transition-all ${
                pt.isCurrent
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border bg-secondary/30 hover:bg-secondary'
              }`}
            >
              <div className="text-[12px] text-muted-foreground font-semibold">+{pt.testDelay}m</div>
              <div
                className={`text-xs font-bold mt-1 ${
                  pt.margin >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {pt.margin >= 0 ? `+${pt.margin}m` : `${pt.margin}m`}
              </div>
              <div
                className={`w-full h-1 rounded-full mt-1.5 ${
                  pt.margin >= 30
                    ? 'bg-emerald-600'
                    : pt.margin >= 0
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
            </button>
          ))}
        </div>
        <p className="text-[12px] text-muted-foreground text-center">
          Critical breach occurs at <span className="font-bold text-foreground">+21m delay</span> where transfer window falls under {mct}m.
        </p>
      </div>

      {/* Feature F9: Sensitivity Search & Heatmap */}
      <WhatWouldChangeThis />

      {/* Headline Feature Stage 2: 30-Point Parametric Stress Test Matrix */}
      <StressTestMatrix />

      {/* Feature F10: Knock-on Impact & Pre-Drafted Communications */}
      <KnockOnImpactAndDrafts />
    </div>
  );
}

