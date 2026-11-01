import React from 'react';
import { Trip, RecoveryOption } from '../types/travel';
import { TwinSimulationParams, DisruptionCalculation } from '../types/twin';
import { Sliders, Clock, DollarSign, ShieldAlert, AlertTriangle, CheckCircle, Info, Plane, RotateCcw, ArrowRight, Sparkles } from 'lucide-react';
import { Slider } from '../components/ui/slider';
import { AppView } from '../components/navigation/Navbar';

interface RecoveryTwinLabPageProps {
  trip: Trip;
  params: TwinSimulationParams;
  onUpdateParam: <K extends keyof TwinSimulationParams>(key: K, val: TwinSimulationParams[K]) => void;
  disruptionCalc: DisruptionCalculation;
  evaluatedOptions: RecoveryOption[];
  onSelectOptionForReview: (opt: RecoveryOption) => void;
  onResetParams: () => void;
  onNavigate: (view: AppView) => void;
}

export const RecoveryTwinLabPage: React.FC<RecoveryTwinLabPageProps> = ({
  trip,
  params,
  onUpdateParam,
  disruptionCalc,
  evaluatedOptions,
  onSelectOptionForReview,
  onResetParams,
  onNavigate,
}) => {
  const qualifiedOptions = evaluatedOptions.filter((o) => o.hardGatePassed);
  const disqualifiedOptions = evaluatedOptions.filter((o) => !o.hardGatePassed);

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20">
              Recovery Twin™ Sandbox
            </span>
            <span className="text-xs text-muted-foreground">
              Dynamic What-If Recalculation (&lt; 16ms)
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
            Simulation & What-If Laboratory
          </h1>
          <p className="text-xs text-muted-foreground">
            Adjust delay minutes, airport minimum connection time, emergency budgets, or visa rules to inspect how the autonomous engine re-evaluates candidate routes.
          </p>
        </div>

        <button
          onClick={onResetParams}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card hover:bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground transition-all shadow-sm shrink-0 self-start sm:self-center"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Parameters</span>
        </button>
      </div>

      {/* Main Dual Grid: Sliders (Left 5 Cols) + Live Outcome (Right 7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Sliders */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-3 border-b border-border flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-500" />
              <span>Interactive What-If Controls</span>
            </h3>

            {/* 1. Inbound Flight Delay */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Inbound Flight Delay
                </span>
                <span className="font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
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

            {/* 2. Airport MCT Threshold */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-blue-500" />
                  Airport MCT Threshold
                </span>
                <span className="font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
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
                <span>20m (Same Gate)</span>
                <span>45m (Hub Std)</span>
                <span>90m (Inter-Terminal)</span>
              </div>
            </div>

            {/* 3. Emergency Budget Ceiling */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  Emergency Budget Ceiling
                </span>
                <span className="font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
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
                <span>$1,000 (Flexible)</span>
              </div>
            </div>

            {/* 4. Arrival Deadline Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-500" />
                  Mandatory Arrival Deadline
                </span>
                <span className="font-mono font-bold text-purple-600">
                  {params.arrivalDeadlineHours.toFixed(1)}h
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
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
                      className={`py-2 px-2 rounded-xl text-xs font-mono transition-all text-center border ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/10 text-purple-600 font-bold ring-1 ring-purple-500'
                          : 'border-border bg-secondary hover:bg-secondary/80 text-muted-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Airside Visa Boundary Toggle */}
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />
                  Airside Transit Only
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Prohibits landside border crossing into German rail (ICE 623).
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

        {/* Right Column: Live Calculated Outcome */}
        <div className="lg:col-span-7 space-y-6">
          {/* Mathematical Status Card */}
          <div
            className={`rounded-2xl border p-6 space-y-4 shadow-sm transition-all ${
              disruptionCalc.statusCategory === 'MISSED_CONNECTION'
                ? 'bg-rose-500/5 border-rose-500/30'
                : disruptionCalc.statusCategory === 'TIGHT_BUFFER'
                ? 'bg-amber-500/5 border-amber-500/30'
                : 'bg-emerald-500/5 border-emerald-500/30'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {disruptionCalc.statusCategory === 'MISSED_CONNECTION' ? (
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                ) : disruptionCalc.statusCategory === 'TIGHT_BUFFER' ? (
                  <Info className="w-5 h-5 text-amber-500 shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    {disruptionCalc.statusHeadline}
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Layover: {disruptionCalc.scheduledLayoverMinutes}m &minus; {params.delayMinutes}m = {disruptionCalc.effectiveLayoverMinutes}m
                  </span>
                </div>
              </div>

              <span
                className={`text-[10px] font-mono uppercase px-3 py-1 rounded-full font-bold ${
                  disruptionCalc.statusCategory === 'MISSED_CONNECTION'
                    ? 'bg-rose-500/20 text-rose-600'
                    : disruptionCalc.statusCategory === 'TIGHT_BUFFER'
                    ? 'bg-amber-500/20 text-amber-600'
                    : 'bg-emerald-500/20 text-emerald-600'
                }`}
              >
                {disruptionCalc.statusCategory}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block font-mono">Scheduled</span>
                <strong className="text-foreground text-sm font-bold font-mono">
                  {disruptionCalc.scheduledLayoverMinutes}m
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block font-mono">Effective Window</span>
                <strong
                  className={`text-sm font-bold font-mono ${
                    disruptionCalc.effectiveLayoverMinutes < params.mctBufferMinutes
                      ? 'text-rose-500'
                      : 'text-foreground'
                  }`}
                >
                  {disruptionCalc.effectiveLayoverMinutes}m
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block font-mono">MCT Margin</span>
                <strong
                  className={`text-sm font-bold font-mono ${
                    disruptionCalc.connectionMarginMinutes < 0
                      ? 'text-rose-500'
                      : 'text-emerald-500'
                  }`}
                >
                  {disruptionCalc.connectionMarginMinutes >= 0 ? '+' : ''}
                  {disruptionCalc.connectionMarginMinutes}m
                </strong>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {disruptionCalc.statusExplanation}
            </p>
          </div>

          {/* Condition: If Delay is small (< MCT), show "Connection Intact" - Resolves Contradiction! */}
          {!disruptionCalc.isConnectionMissed ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center space-y-3">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-base text-foreground">
                Original Connection Secured — No Rebooking Required
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                With an inbound delay of +{params.delayMinutes}m, you have {disruptionCalc.effectiveLayoverMinutes}m available at Frankfurt Airport. This safely exceeds the {params.mctBufferMinutes}m Minimum Connection Time. Your flight LH 716 and checked luggage remain intact.
              </p>
              <button
                onClick={() => onNavigate('workspace')}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md"
              >
                <span>View Booked Itinerary</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Condition: Connection is missed -> Show live evaluated candidate cards */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Recalculated Candidate Outcomes ({qualifiedOptions.length} Feasible)
                </h3>
              </div>

              {qualifiedOptions.map((opt) => (
                <div
                  key={opt.id}
                  className="rounded-2xl border border-blue-500/40 bg-card p-5 space-y-3 shadow-sm hover:border-blue-500 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-xs">
                      Qualified: {opt.title}
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground">
                      Feasibility: {opt.feasibilityScore}/100
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">{opt.subtitle}</p>

                  <div className="grid grid-cols-3 gap-2 text-xs p-3 rounded-lg bg-secondary/50 font-mono">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Arrival</span>
                      <strong>{opt.finalArrivalTime}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Cost</span>
                      <strong className="text-emerald-600">${opt.outOfPocketCost} USD</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Carrier</span>
                      <strong className="text-foreground">{opt.carrierSummary}</strong>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      Clears all hard gates under current parameters.
                    </span>
                    <button
                      onClick={() => onSelectOptionForReview(opt)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
                    >
                      <span>Authorize</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {disqualifiedOptions.map((opt) => (
                <div
                  key={opt.id}
                  className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-2 opacity-80"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Disqualified: {opt.title}
                    </span>
                    <span className="font-mono text-xs font-bold text-rose-500">
                      Score: 0/100
                    </span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-rose-600 space-y-0.5">
                    {opt.gateBreaches.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

