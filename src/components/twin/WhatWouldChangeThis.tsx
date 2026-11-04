import React from 'react';
import { Sliders, Sparkles, ArrowRight, CheckCircle2, AlertCircle, Grid, HelpCircle } from 'lucide-react';
import { useRouteXStore } from '../../context/RouteXStore';
import { RecoveryOption } from '../../types/travel';

export function WhatWouldChangeThis() {
  const { state, dispatch, evaluatedOptions } = useRouteXStore();

  const failedOptions = evaluatedOptions.filter((o) => !o.hardGatePassed);

  // Heatmap Grid: Delays vs Budgets
  const delaySteps = [30, 60, 75, 90, 120];
  const budgetSteps = [150, 300, 450, 600];

  // Helper: compute what would make a failed option pass
  const getMinChange = (opt: RecoveryOption) => {
    const changes: Array<{ label: string; action: () => void }> = [];

    // Check Budget
    if (opt.outOfPocketCost > state.params.budgetCeiling) {
      const needed = opt.outOfPocketCost;
      changes.push({
        label: `Increase budget to $${needed} (+$${needed - state.params.budgetCeiling})`,
        action: () => dispatch({ type: 'UPDATE_PARAM', key: 'budgetCeiling', value: needed }),
      });
    }

    // Check Deadline
    if (opt.finalArrivalTime.includes('16:05') && state.params.arrivalDeadlineHours < 16.5) {
      changes.push({
        label: 'Extend deadline to Day 2 17:00 JST (+3.0h)',
        action: () => dispatch({ type: 'UPDATE_PARAM', key: 'arrivalDeadlineHours', value: 17.0 }),
      });
    }

    // Check Visa
    if (opt.recoveryMode === 'MULTIMODAL_RAIL_AIR' && state.params.visaAirsideOnly) {
      changes.push({
        label: 'Permit landside German rail transit',
        action: () => dispatch({ type: 'UPDATE_PARAM', key: 'visaAirsideOnly', value: false }),
      });
    }

    return changes;
  };

  // Helper for heatmap cell color
  const getSurvivingOption = (d: number, b: number) => {
    if (d <= 20) return { label: 'LH 716 Intact', color: 'bg-emerald-600 text-white' };
    if (b >= 280 && d <= 90) return { label: 'ANA NH 204', color: 'bg-primary text-white' };
    if (b >= 380) return { label: 'AF 274 Multimodal', color: 'bg-indigo-600 text-white' };
    if (b === 0 && d <= 75) return { label: 'EU261 Rebook', color: 'bg-teal-700 text-white' };
    return { label: 'No Feasible Path', color: 'bg-rose-100 text-rose-800 border border-rose-300' };
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" />
          <h4 className="font-['Manrope'] font-bold text-xs text-foreground">
            Sensitivity Analysis: "What Would Change This?"
          </h4>
        </div>
        <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
          Deterministic Search
        </span>
      </div>
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        Calculates the minimum relaxation in budget, arrival deadline, or delay required to qualify each currently disqualified route.
      </p>

      {/* Disqualified Routes Remedy Cards */}
      {failedOptions.length > 0 ? (
        <div className="space-y-2">
          {failedOptions.map((opt) => {
            const remedies = getMinChange(opt);
            return (
              <div key={opt.id} className="p-3 rounded-lg border border-border bg-secondary/30 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{opt.title}</span>
                  <span className="text-[12px] text-rose-700 font-semibold">Currently Gated Out</span>
                </div>
                <div className="space-y-1">
                  {remedies.map((rem, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[12px] text-muted-foreground">• {rem.label}</span>
                      <button
                        type="button"
                        onClick={rem.action}
                        className="px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[12px] transition-colors flex items-center gap-1"
                      >
                        <span>Apply Change</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>All proposed candidate routes currently meet all active operational gates!</span>
        </div>
      )}

      {/* Delay-vs-Budget Recovery Heatmap */}
      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-foreground flex items-center gap-1.5">
            <Grid className="w-3.5 h-3.5 text-primary" />
            Delay-vs-Budget Recovery Heatmap
          </span>
          <span className="text-[12px] text-muted-foreground">Click any cell to simulate</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-[12px] border-collapse">
            <thead>
              <tr>
                <th className="p-1.5 text-left text-muted-foreground font-semibold">Budget \ Delay</th>
                {delaySteps.map((d) => (
                  <th key={d} className="p-1.5 font-bold text-foreground">
                    +{d}m
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {budgetSteps.map((b) => (
                <tr key={b} className="border-t border-border/60">
                  <td className="p-1.5 text-left font-bold text-foreground">${b} Max</td>
                  {delaySteps.map((d) => {
                    const outcome = getSurvivingOption(d, b);
                    const isSelected = state.params.delayMinutes === d && state.params.budgetCeiling === b;
                    return (
                      <td key={d} className="p-1">
                        <button
                          type="button"
                          onClick={() => {
                            dispatch({ type: 'UPDATE_PARAM', key: 'delayMinutes', value: d });
                            dispatch({ type: 'UPDATE_PARAM', key: 'budgetCeiling', value: b });
                          }}
                          className={`w-full py-2 px-1 rounded-md text-[12px] font-bold truncate transition-transform hover:scale-105 ${
                            outcome.color
                          } ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                          title={`Delay +${d}m, Budget $${b}: ${outcome.label}`}
                        >
                          {outcome.label.split(' ')[0]}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

