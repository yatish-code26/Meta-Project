import React, { useState, useMemo } from 'react';
import { ShieldAlert, Zap, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { useRouteXStore } from '../../context/RouteXStore';

export function StressTestMatrix() {
  const { state, dispatch, evaluatedOptions, currentConfig } = useRouteXStore();
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(true);

  const delaySteps = [0, 30, 60, 90, 120, 150];
  const budgetSteps = [100, 200, 300, 400, 600];

  const mct = state.params.mctBufferMinutes;
  const scheduledLayover = currentConfig.scheduledLayoverMinutes;

  // Run stress sweep
  const matrixData = useMemo(() => {
    return budgetSteps.map((b) => {
      return delaySteps.map((d) => {
        const effectiveLayover = scheduledLayover - d;
        const isOriginalIntact = effectiveLayover >= mct;

        // If delay breaks connection, check which candidate option qualifies
        let survivingOption: string | null = null;
        if (isOriginalIntact) {
          survivingOption = 'Original Safe';
        } else {
          // Check candidates
          for (const opt of evaluatedOptions) {
            const costOk = opt.outOfPocketCost <= b;
            const candMins = opt.carrierSummary.includes('ANA')
              ? 155
              : opt.carrierSummary.includes('Air France')
              ? 85
              : 120;
            const mctOk = candMins - mct >= 0;
            const visaOk = !opt.gateBreaches.some((gb) => gb.includes('Immigration'));

            if (costOk && mctOk && visaOk) {
              survivingOption = opt.title.split(' ')[0];
              break;
            }
          }
        }

        return {
          delay: d,
          budget: b,
          survivingOption,
          isOriginal: isOriginalIntact,
          isFail: !survivingOption,
        };
      });
    });
  }, [budgetSteps, delaySteps, scheduledLayover, mct, evaluatedOptions]);

  const handleCellClick = (d: number, b: number) => {
    dispatch({ type: 'UPDATE_PARAM', key: 'delayMinutes', value: d });
    dispatch({ type: 'UPDATE_PARAM', key: 'budgetCeiling', value: b });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Parametric Stress Test Matrix (Delay vs Budget)
          </h4>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsRunning(true);
            setTimeout(() => {
              setIsRunning(false);
              setHasRun(true);
            }, 250);
          }}
          disabled={isRunning}
          className="px-3 py-1 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Zap className="w-3.5 h-3.5" />
          {isRunning ? 'Sweeping...' : 'Re-Run 30-Point Sweep'}
        </button>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Exhaustively sweeps delays (0 to 150m) against recovery budgets ($100 to $600). Click any cell to immediately
        load those parameters into the live simulation.
      </p>

      {/* 2D Grid Matrix */}
      <div className="overflow-x-auto pb-1 no-scrollbar">
        <table className="w-full text-xs text-center border-collapse min-w-[500px]">
          <thead>
            <tr>
              <th className="p-1.5 text-left text-muted-foreground font-semibold text-[11px]">
                Budget \ Delay
              </th>
              {delaySteps.map((d) => (
                <th key={d} className="p-1.5 font-bold text-foreground text-[11px]">
                  +{d}m
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {budgetSteps.map((b, rIdx) => (
              <tr key={b} className="border-t border-border">
                <td className="p-1.5 text-left font-bold text-foreground text-[11px]">
                  ${b} USD
                </td>
                {matrixData[rIdx].map((cell, cIdx) => {
                  const isCurrent =
                    state.params.delayMinutes === cell.delay &&
                    state.params.budgetCeiling === cell.budget;

                  let cellBg = 'bg-rose-500/10 text-rose-700 border-rose-500/20';
                  if (cell.isOriginal) {
                    cellBg = 'bg-emerald-500/15 text-emerald-800 border-emerald-500/20';
                  } else if (cell.survivingOption) {
                    cellBg = 'bg-primary/15 text-primary border-primary/25';
                  }

                  return (
                    <td key={cIdx} className="p-1">
                      <button
                        type="button"
                        onClick={() => handleCellClick(cell.delay, cell.budget)}
                        className={`w-full py-1.5 px-1 rounded-md border text-[11px] font-bold transition-all ${cellBg} ${
                          isCurrent ? 'ring-2 ring-primary shadow-sm scale-105' : 'hover:opacity-80'
                        }`}
                        title={`Click to set delay=+${cell.delay}m, budget=$${cell.budget}`}
                      >
                        {cell.survivingOption || 'No Option'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500/50" />
            Original Intact
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-primary/30 border border-primary/50" />
            Recovery Survives
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-rose-500/30 border border-rose-500/50" />
            No Qualified Path
          </span>
        </div>
        <span>Click cell to jump</span>
      </div>
    </div>
  );
}

