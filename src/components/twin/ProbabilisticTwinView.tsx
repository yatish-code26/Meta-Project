import React, { useState, useMemo } from 'react';
import {
  Dice5,
  Sliders,
  TrendingUp,
  Clock,
  ShieldCheck,
  Filter,
  RefreshCw,
  Sparkles,
  BarChart2,
} from 'lucide-react';
import { useRouteXStore } from '../../context/RouteXStore';
import { MonteCarloEngine, MonteCarloConfig } from '../../services/twin/MonteCarloEngine';

export function ProbabilisticTwinView() {
  const { state, disruptionCalc, evaluatedOptions, currentConfig } = useRouteXStore();

  // Monte Carlo parameters state
  const [sampleCount, setSampleCount] = useState<number>(5000);
  const [seed, setSeed] = useState<number>(1337);
  const [delayMin, setDelayMin] = useState<number>(Math.max(0, state.params.delayMinutes - 30));
  const [delayMode, setDelayMode] = useState<number>(state.params.delayMinutes);
  const [delayMax, setDelayMax] = useState<number>(state.params.delayMinutes + 45);
  const [walkVariance, setWalkVariance] = useState<number>(8);
  const [mctVariance, setMctVariance] = useState<number>(5);
  const [minConfidenceFilter, setMinConfidenceFilter] = useState<boolean>(false);
  const [selectedOptId, setSelectedOptId] = useState<string>('OPT-RECOVER-A');

  // Roll new seed
  const rollNewSeed = () => {
    setSeed(Math.floor(Math.random() * 90000) + 1000);
  };

  // Run Monte Carlo simulation reactively with useMemo
  const simulationResult = useMemo(() => {
    const config: MonteCarloConfig = {
      sampleCount,
      seed,
      delayMin: Math.min(delayMin, delayMode),
      delayMode,
      delayMax: Math.max(delayMode, delayMax),
      walkVarianceMinutes: walkVariance,
      mctVarianceMinutes: mctVariance,
    };

    const nominalParams = {
      scheduledLayoverMinutes: currentConfig.scheduledLayoverMinutes,
      nominalMctMinutes: state.params.mctBufferMinutes,
      isCancelled: state.customUserTripInput?.disruption.type === 'CANCELLATION',
      options: evaluatedOptions.map((opt) => ({
        id: opt.id,
        title: opt.title,
        nominalAvailableWindowMins: opt.carrierSummary.includes('ANA')
          ? 155
          : opt.carrierSummary.includes('Air France')
          ? 85
          : 120,
        deadlineBufferMinutes: Math.round(opt.totalDelayHours * 60),
      })),
    };

    return MonteCarloEngine.runSimulation(config, nominalParams);
  }, [
    sampleCount,
    seed,
    delayMin,
    delayMode,
    delayMax,
    walkVariance,
    mctVariance,
    currentConfig.scheduledLayoverMinutes,
    state.params.mctBufferMinutes,
    disruptionCalc.statusCategory,
    evaluatedOptions,
  ]);

  const selectedStats =
    simulationResult.optionsStats.find((s) => s.optionId === selectedOptId) ||
    simulationResult.optionsStats[0];

  // Highest count in histogram bins for scaling
  const maxBinCount = selectedStats
    ? Math.max(...selectedStats.histogramBins.map((b) => b.count), 1)
    : 1;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
      {/* Title & Seed Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Dice5 className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Probabilistic Twin (Monte Carlo Engine)
          </h4>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-muted-foreground">
            Seed: <span className="font-mono text-foreground font-bold">{seed}</span>
          </span>
          <button
            type="button"
            onClick={rollNewSeed}
            className="p-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground transition-colors flex items-center gap-1 text-[12px] font-bold px-2"
            title="Generate new PRNG seed"
          >
            <RefreshCw className="w-3 h-3 text-primary" />
            Reroll
          </button>
          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[12px]">
            {simulationResult.runtimeMs}ms runtime
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Simulates <strong>{sampleCount.toLocaleString()} stochastic executions</strong> with uncertain inbound delay, terminal
        walk times, and border queue variances. Hard constraints remain absolute.
      </p>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-secondary/40 border border-border rounded-xl p-3">
          <span className="text-[12px] font-medium text-muted-foreground block">
            Original Leg Success
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-lg font-bold ${
                simulationResult.originalConnectionSuccessRate > 50
                  ? 'text-emerald-700'
                  : 'text-rose-600'
              }`}
            >
              {simulationResult.originalConnectionSuccessRate}%
            </span>
          </div>
          <span className="text-[12px] text-muted-foreground">makes nominal MCT</span>
        </div>

        {selectedStats && (
          <>
            <div className="bg-secondary/40 border border-border rounded-xl p-3">
              <span className="text-[12px] font-medium text-muted-foreground block">
                Option Confidence
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span
                  className={`text-lg font-bold ${
                    selectedStats.successProbability >= 80
                      ? 'text-emerald-700'
                      : selectedStats.successProbability >= 50
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}
                >
                  {selectedStats.successProbability}%
                </span>
              </div>
              <span className="text-[12px] text-muted-foreground">on-time arrival</span>
            </div>

            <div className="bg-secondary/40 border border-border rounded-xl p-3">
              <span className="text-[12px] font-medium text-muted-foreground block">
                p50 Median Margin
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-bold text-foreground">
                  +{selectedStats.p50MarginMinutes}m
                </span>
              </div>
              <span className="text-[12px] text-muted-foreground">before deadline</span>
            </div>

            <div className="bg-secondary/40 border border-border rounded-xl p-3">
              <span className="text-[12px] font-medium text-muted-foreground block">
                p10 Worst-Case Margin
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span
                  className={`text-lg font-bold ${
                    selectedStats.p10MarginMinutes >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {selectedStats.p10MarginMinutes >= 0 ? '+' : ''}
                  {selectedStats.p10MarginMinutes}m
                </span>
              </div>
              <span className="text-[12px] text-muted-foreground">pessimistic 10th %</span>
            </div>
          </>
        )}
      </div>

      {/* SVG Histogram Distribution Curve */}
      {selectedStats && (
        <div className="bg-secondary/20 border border-border rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-primary" />
              Arrival Margin Probability Density (10 Bins)
            </span>
            <div className="flex items-center gap-2">
              <label className="text-[12px] font-semibold text-muted-foreground">Inspect:</label>
              <select
                value={selectedOptId}
                onChange={(e) => setSelectedOptId(e.target.value)}
                className="bg-card border border-border rounded px-2 py-0.5 text-xs font-bold text-foreground"
              >
                {simulationResult.optionsStats.map((st) => (
                  <option key={st.optionId} value={st.optionId}>
                    {st.optionTitle} ({st.successProbability}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Histogram Bars */}
          <div className="pt-2">
            <div className="h-28 flex items-end gap-1.5 px-2 pb-1 border-b border-border">
              {selectedStats.histogramBins.map((bin, idx) => {
                const heightPct = Math.max(8, Math.round((bin.count / maxBinCount) * 100));
                const isPositive = bin.binStart >= 0;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    <div
                      className={`w-full rounded-t transition-all ${
                        isPositive ? 'bg-primary/80 group-hover:bg-primary' : 'bg-rose-500/80 group-hover:bg-rose-500'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <div className="absolute -top-7 hidden group-hover:flex px-1.5 py-0.5 rounded bg-black text-white text-[10px] font-bold whitespace-nowrap z-10 shadow">
                      {bin.count} runs ({bin.binStart}m to {bin.binEnd}m)
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground pt-1.5">
              <span>{selectedStats.histogramBins[0]?.binStart ?? -60}m breach</span>
              <span className="font-semibold text-foreground">0m (Commitment Deadline)</span>
              <span>+{selectedStats.histogramBins[selectedStats.histogramBins.length - 1]?.binEnd ?? 180}m safe buffer</span>
            </div>
          </div>
        </div>
      )}

      {/* Uncertainty Sliders & Controls */}
      <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-3">
        <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
          Simulation Uncertainty Parameters
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Sample Count Slider */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Sample Runs</span>
              <span className="font-bold text-foreground">{sampleCount.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={1000}
              max={10000}
              step={1000}
              value={sampleCount}
              onChange={(e) => setSampleCount(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Terminal Walk Variance */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Terminal Walk Noise</span>
              <span className="font-bold text-foreground">±{walkVariance}m</span>
            </div>
            <input
              type="range"
              min={2}
              max={20}
              step={2}
              value={walkVariance}
              onChange={(e) => setWalkVariance(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* MCT Hub Variance */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Hub Border Noise</span>
              <span className="font-bold text-foreground">±{mctVariance}m</span>
            </div>
            <input
              type="range"
              min={2}
              max={15}
              step={1}
              value={mctVariance}
              onChange={(e) => setMctVariance(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        {/* Optional Min Confidence Filter */}
        <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-foreground">
            <input
              type="checkbox"
              checked={minConfidenceFilter}
              onChange={(e) => setMinConfidenceFilter(e.target.checked)}
              className="rounded text-primary focus:ring-primary w-4 h-4"
            />
            <span>Filter out options with &lt;80% Monte Carlo confidence</span>
          </label>
          <span className="text-[12px] text-muted-foreground">
            {minConfidenceFilter ? 'Filtering Active' : 'Showing All Qualified'}
          </span>
        </div>
      </div>
    </div>
  );
}
