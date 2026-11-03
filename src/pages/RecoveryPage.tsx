import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, ArrowRight, Info } from 'lucide-react';
import { RecoveryOption } from '../types/travel';
import { DisruptionCalculation, TwinSimulationParams } from '../types/twin';
import { DelayScrubber } from '../components/recovery/DelayScrubber';
import { Screen } from '../components/navigation/AppHeader';
import { FullPresetConfig } from '../data/syntheticTrips';

interface RecoveryPageProps {
  options: RecoveryOption[];
  disruptionCalc: DisruptionCalculation;
  params: TwinSimulationParams;
  onUpdateParam: <K extends keyof TwinSimulationParams>(key: K, val: TwinSimulationParams[K]) => void;
  onSelectOption: (option: RecoveryOption) => void;
  onNavigate: (s: Screen) => void;
  currentConfig: FullPresetConfig;
  providerMode: string;
}

export function RecoveryPage({
  options,
  disruptionCalc,
  params,
  onUpdateParam,
  onSelectOption,
  onNavigate,
  currentConfig,
  providerMode,
}: RecoveryPageProps) {
  const qualified = options.filter((o) => o.hardGatePassed);
  const recommended = qualified.find((o) => o.isRecommended) ?? qualified[0] ?? null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Heading */}
      <div className="mb-6">
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-2">Recovery options</p>
        <h1 className="text-3xl sm:text-4xl font-['Fraunces'] text-foreground leading-tight">
          {disruptionCalc.isConnectionMissed
            ? 'Your Frankfurt connection was missed.'
            : 'Your connection is intact.'}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          {disruptionCalc.isConnectionMissed
            ? `LH 901 arrived ${params.delayMinutes}m late. LH 716 closed boarding before you landed — ${Math.abs(disruptionCalc.connectionMarginMinutes)}m short of the ${params.mctBufferMinutes}m minimum connection time. Here are your alternative paths.`
            : `With a ${params.delayMinutes}m delay you still have ${disruptionCalc.connectionMarginMinutes}m of margin above the ${params.mctBufferMinutes}m MCT. No recovery needed.`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Scrubber + Delay timeline */}
        <div className="space-y-5">
          <DelayScrubber
            delayMinutes={params.delayMinutes}
            onChange={(v) => onUpdateParam('delayMinutes', v)}
            mctMinutes={params.mctBufferMinutes}
            scheduledLayoverMinutes={currentConfig.scheduledLayoverMinutes}
          />

          {/* Constraint summary */}
          <div className="rounded-2xl border bg-card p-5 space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Active constraints</h3>
            {[
              { label: 'Budget ceiling', value: `$${params.budgetCeiling}` },
              { label: 'Must arrive by', value: `Day 2, ${params.arrivalDeadlineHours === 14 ? '14:00 JST' : `${params.arrivalDeadlineHours}:00`}` },
              { label: 'Visa', value: params.visaAirsideOnly ? 'Airside only' : 'Landside allowed' },
              { label: 'MCT Frankfurt', value: `${params.mctBufferMinutes}m` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground tabular-nums">{value}</span>
              </div>
            ))}
          </div>

          {/* Provider mode badge */}
          <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
            <span className="font-semibold">Mode:</span> {providerMode} — results are simulated, not real bookings.
          </p>
        </div>

        {/* Right: Recovery option cards */}
        <div className="lg:col-span-2 space-y-4">
          {!disruptionCalc.isConnectionMissed ? (
            <div className="rounded-2xl border border-success/30 bg-success/5 p-8 text-center">
              <CheckCircle className="w-10 h-10 text-success mx-auto mb-3" />
              <h3 className="font-['Fraunces'] text-xl text-foreground mb-2">You're still connected</h3>
              <p className="text-muted-foreground text-sm">
                Drag the delay scrubber past {currentConfig.scheduledLayoverMinutes - params.mctBufferMinutes}m to simulate a missed connection and see recovery options appear.
              </p>
            </div>
          ) : options.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <p className="text-muted-foreground">Loading options…</p>
            </div>
          ) : (
            options.map((opt) => (
              <OptionCard
                key={opt.id}
                option={opt}
                isRecommended={opt.id === recommended?.id}
                onSelect={() => {
                  onSelectOption(opt);
                  onNavigate('confirmed');
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function OptionCard({
  option,
  isRecommended,
  onSelect,
}: {
  option: RecoveryOption;
  isRecommended: boolean;
  onSelect: () => void;
}) {
  const seg = option.newSegments?.[0];

  return (
    <div className={`rounded-2xl border bg-card p-5 transition-all ${
      option.hardGatePassed
        ? isRecommended
          ? 'border-primary/40 ring-2 ring-primary/20'
          : 'border-border hover:border-primary/20'
        : 'border-destructive/20 opacity-75'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {isRecommended && option.hardGatePassed && (
              <span className="text-xs font-semibold bg-primary text-white rounded-full px-2 py-0.5">
                Recommended
              </span>
            )}
            {!option.hardGatePassed && (
              <span className="text-xs font-semibold bg-destructive/10 text-destructive rounded-full px-2 py-0.5">
                Not viable
              </span>
            )}
          </div>
          <h3 className="font-semibold text-foreground">{option.title}</h3>
          <p className="text-sm text-muted-foreground">{option.subtitle}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-bold font-['Fraunces'] tabular-nums text-foreground">
            {option.outOfPocketCost === 0 ? 'No cost' : `$${option.outOfPocketCost}`}
          </p>
          <p className="text-xs text-muted-foreground">out of pocket</p>
        </div>
      </div>

      {/* Flight times */}
      {seg && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/60">
          <div className="text-sm">
            <p className="font-semibold tabular-nums">{seg.departureTime}</p>
            <p className="text-xs text-muted-foreground">{seg.departureTimeZone?.replace(/\s*\(.*\)/, '')}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold tabular-nums">{seg.arrivalTime}</p>
            <p className="text-xs text-muted-foreground">{seg.arrivalTimeZone?.replace(/\s*\(.*\)/, '')}</p>
          </div>
          <div className="ml-auto text-right text-sm">
            <p className="text-muted-foreground">{seg.code}</p>
            <p className="text-xs text-muted-foreground">{seg.duration}</p>
          </div>
        </div>
      )}

      {/* Gate checks summary */}
      <div className="space-y-1.5 mb-4">
        {option.constraintChecks.filter((c) => c.isHardGate).map((c, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {c.passed
              ? <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
              : <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />}
            <span className={c.passed ? 'text-foreground' : 'text-destructive line-through opacity-70'}>
              {c.name.replace('Hard Gate: ', '').replace('Physical Gate: ', '')}
            </span>
          </div>
        ))}
      </div>

      {/* Assumptions warning */}
      {option.assumptions.some((a) => a.category === 'UNVERIFIED_DATA') && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-warning/8 border border-warning/20 mb-4">
          <Info className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-xs text-warning leading-relaxed">
            Contains unverified assumptions — confirm at the Lufthansa service desk before proceeding.
          </p>
        </div>
      )}

      {/* Gate breaches */}
      {option.gateBreaches.length > 0 && (
        <div className="space-y-1 mb-4">
          {option.gateBreaches.map((b, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-destructive">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{b}</span>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      {option.hardGatePassed && (
        <button
          onClick={onSelect}
          className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
            isRecommended
              ? 'bg-primary text-white hover:opacity-90'
              : 'bg-muted text-foreground hover:bg-muted-foreground/20'
          }`}
        >
          Select this option
        </button>
      )}
    </div>
  );
}

