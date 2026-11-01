import React from 'react';
import { Sliders, Clock, DollarSign, ShieldAlert, AlertTriangle, CheckCircle, Info, Plane, ArrowRight } from 'lucide-react';
import { TwinSimulationParams, DisruptionCalculation } from '../../types/twin';
import { Slider } from '../ui/slider';

interface SimulationControlPanelProps {
  params: TwinSimulationParams;
  onUpdateParam: <K extends keyof TwinSimulationParams>(key: K, val: TwinSimulationParams[K]) => void;
  disruptionCalc: DisruptionCalculation;
  origin: string;
  destination: string;
  hubLocation: string;
}

export const SimulationControlPanel: React.FC<SimulationControlPanelProps> = ({
  params,
  onUpdateParam,
  disruptionCalc,
  origin,
  destination,
  hubLocation,
}) => {
  return (
    <div className="space-y-6">
      {/* Simulation Controls Card */}
      <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-foreground tracking-tight">
              Recovery Twin™ Parameters
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
            Live Re-evaluation
          </span>
        </div>

        {/* 1. Inbound Delay Slider */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              Inbound Flight Delay
            </span>
            <span className="font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              +{params.delayMinutes} mins
            </span>
          </div>
          <Slider
            min={15}
            max={180}
            step={5}
            value={[params.delayMinutes]}
            onValueChange={([val]) => onUpdateParam('delayMinutes', val)}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>+15m (Minor)</span>
            <span>+75m (Default)</span>
            <span>+180m (Severe)</span>
          </div>
        </div>

        {/* 2. Airport Minimum Connection Time (MCT) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <Plane className="h-3.5 w-3.5 text-blue-500" />
              Airport MCT Threshold
            </span>
            <span className="font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {params.mctBufferMinutes} mins
            </span>
          </div>
          <Slider
            min={20}
            max={90}
            step={5}
            value={[params.mctBufferMinutes]}
            onValueChange={([val]) => onUpdateParam('mctBufferMinutes', val)}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>20m (Same Terminal)</span>
            <span>45m (FRA Hub Std)</span>
            <span>90m (Inter-Terminal)</span>
          </div>
        </div>

        {/* 3. Emergency Recovery Budget Ceiling */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
              Max Out-of-Pocket Budget
            </span>
            <span className="font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              ${params.budgetCeiling} USD
            </span>
          </div>
          <Slider
            min={0}
            max={1000}
            step={25}
            value={[params.budgetCeiling]}
            onValueChange={([val]) => onUpdateParam('budgetCeiling', val)}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>$0 (Airline only)</span>
            <span>$450 (Standard)</span>
            <span>$1,000 (Premium)</span>
          </div>
        </div>

        {/* 4. Hard Arrival Deadline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-purple-500" />
              Mandatory Arrival Deadline
            </span>
            <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">
              {params.arrivalDeadlineHours.toFixed(1)}h
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[12.0, 14.0, 16.5, 24.0].map((hour) => {
              const isSelected = Math.abs(params.arrivalDeadlineHours - hour) < 0.1;
              const label =
                hour === 12.0
                  ? '12:00'
                  : hour === 14.0
                  ? '14:00'
                  : hour === 16.5
                  ? '16:30'
                  : 'Open';
              return (
                <button
                  key={hour}
                  type="button"
                  onClick={() => onUpdateParam('arrivalDeadlineHours', hour)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono transition-all text-center border ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold ring-1 ring-purple-500'
                      : 'border-border bg-background hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Schengen Visa Boundary Toggle */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-blue-500" />
                Airside Transit Only (No Visa)
              </span>
              <p className="text-[11px] text-muted-foreground">
                Disqualifies routes requiring German border entry (ICE rail).
              </p>
            </div>
            <button
              type="button"
              onClick={() => onUpdateParam('visaAirsideOnly', !params.visaAirsideOnly)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                params.visaAirsideOnly ? 'bg-blue-600' : 'bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  params.visaAirsideOnly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Disruption Mathematical Calculation Card */}
      <div
        className={`rounded-xl border p-4.5 space-y-3.5 transition-all shadow-sm ${
          disruptionCalc.statusCategory === 'MISSED_CONNECTION'
            ? 'bg-rose-500/5 border-rose-500/30'
            : disruptionCalc.statusCategory === 'TIGHT_BUFFER'
            ? 'bg-amber-500/5 border-amber-500/30'
            : 'bg-emerald-500/5 border-emerald-500/30'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {disruptionCalc.statusCategory === 'MISSED_CONNECTION' ? (
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
            ) : disruptionCalc.statusCategory === 'TIGHT_BUFFER' ? (
              <Info className="h-4 w-4 text-amber-500 shrink-0" />
            ) : (
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
            )}
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              {disruptionCalc.statusHeadline}
            </h3>
          </div>
          <span
            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
              disruptionCalc.statusCategory === 'MISSED_CONNECTION'
                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                : disruptionCalc.statusCategory === 'TIGHT_BUFFER'
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {disruptionCalc.statusCategory}
          </span>
        </div>

        {/* Live Mathematical Formula Pill Grid */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded bg-background/80 border border-border">
            <span className="text-[10px] text-muted-foreground block font-mono">Scheduled Layover</span>
            <span className="font-mono font-bold text-foreground text-sm">
              {disruptionCalc.scheduledLayoverMinutes}m
            </span>
          </div>
          <div className="p-2 rounded bg-background/80 border border-border">
            <span className="text-[10px] text-muted-foreground block font-mono">Effective Window</span>
            <span
              className={`font-mono font-bold text-sm ${
                disruptionCalc.effectiveLayoverMinutes < params.mctBufferMinutes
                  ? 'text-rose-500'
                  : 'text-foreground'
              }`}
            >
              {disruptionCalc.effectiveLayoverMinutes}m
            </span>
          </div>
          <div className="p-2 rounded bg-background/80 border border-border">
            <span className="text-[10px] text-muted-foreground block font-mono">MCT Margin</span>
            <span
              className={`font-mono font-bold text-sm ${
                disruptionCalc.connectionMarginMinutes < 0
                  ? 'text-rose-500'
                  : 'text-emerald-500'
              }`}
            >
              {disruptionCalc.connectionMarginMinutes >= 0 ? '+' : ''}
              {disruptionCalc.connectionMarginMinutes}m
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {disruptionCalc.statusExplanation}
        </p>
      </div>
    </div>
  );
};

