import React, { useCallback } from 'react';

interface DelayScrubberProps {
  delayMinutes: number;
  onChange: (minutes: number) => void;
  mctMinutes: number;
  scheduledLayoverMinutes: number;
}

export function DelayScrubber({ delayMinutes, onChange, mctMinutes, scheduledLayoverMinutes }: DelayScrubberProps) {
  const max = 180;
  const missThreshold = scheduledLayoverMinutes - mctMinutes; // delay at which connection is lost

  const effectiveLayover = scheduledLayoverMinutes - delayMinutes;
  const connectionMargin = effectiveLayover - mctMinutes;
  const isMissed = connectionMargin < 0;
  const isTight = !isMissed && connectionMargin < 20;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange]
  );

  const pct = (delayMinutes / max) * 100;
  const thresholdPct = (missThreshold / max) * 100;

  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">Delay scrubber</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Drag to see how delay length changes your options
          </p>
        </div>
        <div className={`text-right tabular-nums`}>
          <p className={`text-2xl font-bold font-['Fraunces'] ${
            isMissed ? 'text-destructive' : isTight ? 'text-warning' : 'text-success'
          }`}>
            +{delayMinutes}m
          </p>
          <p className="text-xs text-muted-foreground">inbound delay</p>
        </div>
      </div>

      {/* Slider track */}
      <div className="relative mb-3">
        {/* Threshold marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-destructive/50 z-10 pointer-events-none"
          style={{ left: `${thresholdPct}%` }}
          title={`Connection missed at +${missThreshold}m`}
        />

        <input
          type="range"
          min="0"
          max={max}
          step="5"
          value={delayMinutes}
          onChange={handleChange}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right,
              ${isMissed ? '#E11D48' : delayMinutes > missThreshold * 0.8 ? '#D97706' : '#147870'} ${pct}%,
              #E2E5E9 ${pct}%
            )`,
          }}
          aria-label={`Delay scrubber: ${delayMinutes} minutes`}
        />

        {/* Threshold label */}
        <div
          className="absolute -top-5 text-xs text-destructive font-medium pointer-events-none"
          style={{ left: `${Math.max(0, thresholdPct - 5)}%` }}
        >
          missed →
        </div>
      </div>

      {/* Scale labels */}
      <div className="flex justify-between text-xs text-muted-foreground font-medium mb-5">
        <span>0m</span>
        <span>45m</span>
        <span>90m</span>
        <span>135m</span>
        <span>180m</span>
      </div>

      {/* Status readout */}
      <div className={`rounded-xl border p-3 text-sm ${
        isMissed
          ? 'border-destructive/30 bg-destructive/5'
          : isTight
          ? 'border-warning/30 bg-warning/5'
          : 'border-success/30 bg-success/5'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-semibold ${
              isMissed ? 'text-destructive' : isTight ? 'text-warning' : 'text-success'
            }`}>
              {isMissed ? 'Connection missed' : isTight ? 'Tight connection' : 'Connection intact'}
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              {isMissed
                ? `Need ${mctMinutes}m MCT · only ${Math.max(0, effectiveLayover)}m available`
                : `${effectiveLayover}m available · ${connectionMargin}m above ${mctMinutes}m MCT`}
            </p>
          </div>
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
            isMissed ? 'bg-destructive' : isTight ? 'bg-warning' : 'bg-success'
          }`} />
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3 italic">
        Offline simulation — no live data. MCT = Minimum Connection Time at Frankfurt.
      </p>
    </div>
  );
}

