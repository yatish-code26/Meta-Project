import React, { useState } from 'react';
import { AssumptionOrUnverifiedItem, OperationalNextStep } from '../../types/travel';
import { HelpCircle, AlertCircle, CheckCircle2, ChevronRight, ShieldCheck, MapPin } from 'lucide-react';

interface AssumptionsDrawerProps {
  assumptions: AssumptionOrUnverifiedItem[];
  nextSteps: OperationalNextStep[];
}

export const AssumptionsDrawer: React.FC<AssumptionsDrawerProps> = ({
  assumptions,
  nextSteps,
}) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!assumptions || assumptions.length === 0) return null;

  return (
    <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            Assumptions & Unverified Data Audit
          </h3>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          Transparency Standard
        </span>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Autonomous recovery models operate on probabilistic airport data. The items below must be acknowledged by the traveler before final itinerary lock:
      </p>

      {/* Assumptions List */}
      <div className="space-y-2.5">
        {assumptions.map((item) => {
          const isChecked = !!checkedItems[item.id];

          return (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                isChecked
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-background/80 border-border/80 hover:border-foreground/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isChecked
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-muted-foreground/40 bg-card'
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="h-3 w-3" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{item.title}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          item.riskLevel === 'HIGH'
                            ? 'bg-rose-500/10 text-rose-600'
                            : item.riskLevel === 'MEDIUM'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-blue-500/10 text-blue-600'
                        }`}
                      >
                        {item.riskLevel} RISK
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      {item.detail}
                    </p>
                    <div className="pt-1 flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium text-[11px]">
                      <span>Action required:</span>
                      <span>{item.verificationAction}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operational Next Steps */}
      {nextSteps && nextSteps.length > 0 && (
        <div className="pt-3 border-t border-border space-y-2.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            In-Airport Immediate Action Steps
          </span>
          <div className="space-y-2">
            {nextSteps.map((step) => (
              <div
                key={step.stepNumber}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs"
              >
                <span className="h-5 w-5 rounded-full bg-blue-500/10 text-blue-600 font-bold text-[11px] flex items-center justify-center shrink-0">
                  {step.stepNumber}
                </span>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 font-medium text-foreground">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span>{step.location}</span>
                  </div>
                  <p className="text-muted-foreground text-[11px]">{step.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

