import React from 'react';
import { DisruptionEvent } from '../../types/travel';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AlertCircle, Clock, MapPin, Sparkles, Loader2, ArrowRight, ShieldAlert } from 'lucide-react';

interface DisruptionAlertBannerProps {
  disruption: DisruptionEvent;
  isGenerating: boolean;
  onGenerateRecovery: () => void;
  optionsGenerated: boolean;
}

export const DisruptionAlertBanner: React.FC<DisruptionAlertBannerProps> = ({
  disruption,
  isGenerating,
  onGenerateRecovery,
  optionsGenerated,
}) => {
  return (
    <div className="rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-950/30 via-card to-card p-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning" className="px-2.5 py-0.5 text-xs uppercase tracking-wider font-bold">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Disruption Telemetry Active
            </Badge>
            <Badge variant="synthetic">
              [SYNTHETIC TEST SCENARIO]
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              Detection Time: 13:30 CET (UTC+1)
            </span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Missed Connection: Flight LH 716 (FRA → HND) Closed
            </h2>
            <p className="text-sm text-zinc-300 mt-1 max-w-3xl leading-relaxed">
              {disruption.rootCause}
            </p>
          </div>

          {/* Operational Telemetry Metrics */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-muted-foreground pt-1 border-t border-border/50">
            <span className="flex items-center gap-1.5 text-zinc-200">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Traveler Location: <strong className="text-white">{disruption.location}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-zinc-200">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              Inbound Delay: <strong className="text-rose-300">+{disruption.delayMinutes} mins (LH 901)</strong>
            </span>
            <span className="flex items-center gap-1.5 text-zinc-200">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              Connection Gate Buffer: <strong className="text-rose-300">Exceeded by 35 mins</strong> (MCT 45m required)
            </span>
          </div>
        </div>

        <div className="shrink-0 self-start lg:self-center">
          {!optionsGenerated ? (
            <Button
              onClick={onGenerateRecovery}
              disabled={isGenerating}
              size="lg"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-semibold text-sm px-6 py-6 shadow-lg shadow-primary/20 gap-2.5 transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Evaluating Alternative Routes & Gates...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>Evaluate Alternative Recovery Routes</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Evaluation Complete: 3 Pathways Audited
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
