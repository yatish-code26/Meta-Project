import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, ChevronDown, ChevronUp, XCircle, Info, Sparkles } from 'lucide-react';
import { RecoveryOption } from '../../types/travel';

interface GateAuditSummaryProps {
  options: RecoveryOption[];
  onOpenTwinLab?: () => void;
}

export function GateAuditSummary({ options, onOpenTwinLab }: GateAuditSummaryProps) {
  const [showRejected, setShowRejected] = useState(false);

  const totalProposed = options.length;
  const qualified = options.filter((o) => o.hardGatePassed);
  const rejected = options.filter((o) => !o.hardGatePassed);

  if (totalProposed === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-3.5 space-y-3 shadow-sm">
      {/* Top Ratio Strip */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-['Manrope'] font-bold text-foreground">
              <span>AI Proposes, Engine Verifies</span>
              <span className="text-[12px] font-semibold px-2 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20">
                Rule-Gated
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              The model proposes candidates; deterministic gates strictly enforce feasibility.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 rounded-lg bg-secondary/40 border border-border/50">
          <span className="text-[12px] text-muted-foreground block">Proposed</span>
          <span className="font-['Manrope'] font-bold text-foreground text-sm">{totalProposed}</span>
        </div>
        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
          <span className="text-[12px] font-semibold block text-emerald-700">Qualified</span>
          <span className="font-['Manrope'] font-bold text-emerald-800 text-sm">{qualified.length}</span>
        </div>
        <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
          <span className="text-[12px] font-semibold block text-rose-700">Rejected</span>
          <span className="font-['Manrope'] font-bold text-rose-800 text-sm">{rejected.length}</span>
        </div>
      </div>

      {/* Expandable Rejected Routes Audit */}
      {rejected.length > 0 && (
        <div className="border-t border-border pt-2">
          <button
            type="button"
            onClick={() => setShowRejected(!showRejected)}
            className="w-full flex items-center justify-between text-[12px] font-bold text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <span className="flex items-center gap-1.5 text-rose-700">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              Audit {rejected.length} Rejected Candidate{rejected.length > 1 ? 's' : ''}
            </span>
            {showRejected ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showRejected && (
            <div className="mt-2 space-y-2">
              {rejected.map((rej) => (
                <div
                  key={rej.id}
                  className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-200/80 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between font-bold text-rose-900">
                    <span>{rej.title}</span>
                    <span className="text-[12px] px-1.5 py-0.5 rounded bg-rose-200/80 text-rose-800">
                      Disqualified
                    </span>
                  </div>
                  <div className="space-y-1 text-[12px] text-rose-800">
                    {rej.gateBreaches.map((breach, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                        <span>{breach}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <p className="text-[12px] text-muted-foreground italic pt-1">
                Rejected routes are never presented as booking options. You can relax constraints in{' '}
                {onOpenTwinLab ? (
                  <button
                    type="button"
                    onClick={onOpenTwinLab}
                    className="text-primary font-bold hover:underline"
                  >
                    Twin Lab
                  </button>
                ) : (
                  'Twin Lab'
                )}{' '}
                to see how changes would affect qualification.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

