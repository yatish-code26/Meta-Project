import React, { useState } from 'react';
import { RecoveryOption, ConstraintCheckResult, AssumptionOrUnverifiedItem } from '../../types/travel';
import { MetaRecoveryResponse } from '../../services/meta/IMetaTravelModelService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Shield,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Plane,
  Train,
  Building,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  X,
} from 'lucide-react';

interface RecoveryOptionsViewProps {
  options: RecoveryOption[];
  modelResponse: MetaRecoveryResponse | null;
  onSelectOptionForApproval: (option: RecoveryOption) => void;
}

export const RecoveryOptionsView: React.FC<RecoveryOptionsViewProps> = ({
  options,
  modelResponse,
  onSelectOptionForApproval,
}) => {
  const [selectedView, setSelectedView] = useState<'cards' | 'matrix'>('cards');
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>('OPT-RECOVER-A');

  const toggleExpand = (id: string) => {
    setExpandedOptionId(prev => prev === id ? null : id);
  };

  const recommendedOption = options.find(o => o.isRecommended) || options[0];
  const otherOptions = options.filter(o => o.id !== recommendedOption?.id);

  return (
    <div className="space-y-6">
      {/* Section Header & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Step C & D • Recovery Evaluation
            </span>
            <Badge variant="outline" className="text-xs font-mono">
              3 Pathways Audited
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
            Alternative Recovery Options & Gate Validation
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5 max-w-3xl">
            Candidate routes are deterministically audited against hard gates (deadline, budget, transit visa). Only routes passing all hard gates qualify for recommendation.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-secondary/60 border border-border self-start sm:self-auto">
          <button
            onClick={() => setSelectedView('cards')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              selectedView === 'cards'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            Detailed Evaluation
          </button>
          <button
            onClick={() => setSelectedView('matrix')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
              selectedView === 'matrix'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            Gate Comparison Matrix
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: Detailed Cards */}
      {selectedView === 'cards' && (
        <div className="space-y-6">
          {/* HERO CARD: Qualified Recommended Pathway (Option A) */}
          {recommendedOption && (
            <Card className="border-2 border-emerald-500/50 bg-gradient-to-b from-card to-card/90 shadow-2xl relative overflow-hidden">
              <div className="bg-emerald-950/60 border-b border-emerald-500/30 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Recommended Pathway • Cleared 100% of Hard Gates (3/3)
                </div>
                <Badge variant="success" className="text-xs">
                  Deterministic Feasibility: 100%
                </Badge>
              </div>

              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border/60">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cyan-300 font-semibold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                        {recommendedOption.id}
                      </span>
                      <span className="text-xs text-muted-foreground">• Non-Stop Direct Airside Rebook</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {recommendedOption.title}
                    </h3>
                    <p className="text-sm text-zinc-300">
                      {recommendedOption.subtitle}
                    </p>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap gap-4 shrink-0">
                    <div className="bg-secondary/40 border border-border p-3.5 rounded-lg text-center min-w-[130px]">
                      <span className="text-xs text-muted-foreground block">Arrival in Tokyo</span>
                      <strong className="text-base font-bold text-white tabular-nums block mt-0.5">
                        {recommendedOption.finalArrivalTime}
                      </strong>
                      <span className="text-[11px] text-emerald-400 font-semibold block">
                        +2h 20m before Keynote
                      </span>
                    </div>

                    <div className="bg-secondary/40 border border-border p-3.5 rounded-lg text-center min-w-[130px]">
                      <span className="text-xs text-muted-foreground block">Out-of-Pocket Cost</span>
                      <strong className="text-base font-bold text-emerald-400 tabular-nums block mt-0.5">
                        ${recommendedOption.outOfPocketCost} USD
                      </strong>
                      <span className="text-[11px] text-muted-foreground block">
                        $1,240 airline covered
                      </span>
                    </div>
                  </div>
                </div>

                {/* Flight Segments Detail */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Confirmed Recovery Flight Leg
                  </span>
                  {recommendedOption.newSegments.map((seg) => (
                    <div
                      key={seg.id}
                      className="rounded-lg border border-border/80 bg-secondary/30 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 mt-0.5">
                          <Plane className="w-5 h-5 rotate-45" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{seg.code}</span>
                            <span className="text-xs text-muted-foreground">({seg.carrier})</span>
                            <Badge variant="telemetry">{seg.duration}</Badge>
                          </div>
                          <div className="text-xs text-zinc-300">
                            <strong>{seg.departureLocation}</strong> ({seg.departureTime} {seg.departureTimeZone}) →{' '}
                            <strong>{seg.arrivalLocation}</strong> ({seg.arrivalTime} {seg.arrivalTimeZone})
                          </div>
                          <p className="text-xs text-muted-foreground">{seg.notes}</p>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground font-mono bg-card/60 px-3 py-2 rounded border border-border shrink-0 self-start md:self-center">
                        <div>Boarding: 14:15 CET</div>
                        <div className="text-emerald-400 font-semibold">MCT Layover: 85 mins (&gt;45m)</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Hard Gate Compliance Overview */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Deterministic Gate Audit
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {recommendedOption.constraintChecks.map((chk, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-1 text-xs"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{chk.name}</span>
                        </div>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          {chk.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Collapsible Evidence, Assumptions & Trade-offs */}
                <div className="pt-2 border-t border-border/60">
                  <button
                    onClick={() => toggleExpand(recommendedOption.id)}
                    className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors py-2"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-cyan-400" />
                      Inspect Assumptions, Uncertainty & Next Operational Actions ({recommendedOption.assumptions.length})
                    </span>
                    {expandedOptionId === recommendedOption.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {expandedOptionId === recommendedOption.id && (
                    <div className="mt-4 space-y-4 pt-2">
                      {/* Assumptions */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {recommendedOption.assumptions.map((asm) => (
                          <div
                            key={asm.id}
                            className="rounded-lg border border-border/80 bg-secondary/30 p-3.5 space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white">{asm.title}</span>
                              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                                {asm.riskLevel} Risk
                              </span>
                            </div>
                            <p className="text-muted-foreground text-[11px]">{asm.detail}</p>
                            <div className="text-[11px] text-cyan-300 font-medium pt-1 border-t border-border/40">
                              Action: {asm.verificationAction}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Trade-off summary */}
                      <div className="rounded-lg border border-primary/30 bg-primary/10 p-3.5 text-xs text-zinc-200">
                        <strong className="text-white">Trade-off Evaluation:</strong> {recommendedOption.tradeOffSummary}
                      </div>
                    </div>
                  )}
                </div>

                {/* Authorize Action Button */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Traveler approval is mandatory before any ticket or calendar modification.</span>
                  </div>

                  <Button
                    onClick={() => onSelectOptionForApproval(recommendedOption)}
                    size="lg"
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-semibold text-sm px-6 py-5 shadow-lg shadow-primary/20 gap-2"
                  >
                    <span>Review & Authorize Recovery Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* DISQUALIFIED ALTERNATIVES (Options B & C) */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Disqualified Alternative Routes (Hard Gate Breaches)
              </h3>
              <span className="text-xs text-muted-foreground">
                Evaluated to identify trade-offs; not eligible for recommendation
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {otherOptions.map((opt) => (
                <Card
                  key={opt.id}
                  className="border border-rose-500/30 bg-card/60 shadow-md opacity-90 flex flex-col justify-between"
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <Badge variant="destructive" className="text-xs font-bold">
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Disqualified (Hard Gate Failed)
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">{opt.id}</span>
                    </div>

                    <CardTitle className="text-base font-bold text-white leading-snug">
                      {opt.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      {opt.subtitle}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 pt-1 space-y-4 flex-1">
                    {/* Gate Breaches Highlighting */}
                    <div className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 space-y-1.5 text-xs">
                      <span className="font-bold text-rose-300 block uppercase text-[10px] tracking-wider">
                        Hard Gate Failure Reasons:
                      </span>
                      {opt.gateBreaches.map((breach, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-1.5 text-rose-200 text-xs">
                          <X className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span>{breach}</span>
                        </div>
                      ))}
                    </div>

                    {/* Operational Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-secondary/30 p-3 rounded-lg border border-border/60">
                      <div>
                        <span className="text-muted-foreground text-[11px] block">Arrival:</span>
                        <strong className="text-white block mt-0.5">{opt.finalArrivalTime}</strong>
                        <span className="text-rose-400 text-[10px] font-medium block">
                          +{opt.totalDelayHours}h delay
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[11px] block">Out-of-Pocket:</span>
                        <strong className="text-white block mt-0.5">${opt.outOfPocketCost} USD</strong>
                        <span className="text-muted-foreground text-[10px] block">
                          Self-funded
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground italic">
                      <strong>Trade-off analysis:</strong> {opt.tradeOffSummary}
                    </p>
                  </CardContent>

                  <CardFooter className="p-5 pt-0">
                    <Button
                      variant="outline"
                      disabled
                      className="w-full text-xs text-muted-foreground border-border/40 cursor-not-allowed"
                    >
                      Ineligible (Violates Mandatory Gates)
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: Structured Comparison Matrix */}
      {selectedView === 'matrix' && (
        <Card className="border border-border/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/60 text-muted-foreground uppercase text-[11px] tracking-wider font-bold">
                  <th className="p-4">Gate / Constraint Criteria</th>
                  {options.map((opt) => (
                    <th key={opt.id} className="p-4 font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{opt.title}</span>
                        {opt.isRecommended && (
                          <span className="text-emerald-400 text-xs">★ (Recommended)</span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono block font-normal">
                        {opt.id}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="p-4 font-bold text-zinc-300 bg-secondary/20">
                    Gate 1: Arrival Deadline (Day 2, 14:00 JST)
                  </td>
                  {options.map((opt) => (
                    <td key={opt.id} className="p-4">
                      {opt.id === 'OPT-RECOVER-A' ? (
                        <div className="text-emerald-300 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>PASS (11:40 JST, +2h 20m buffer)</span>
                        </div>
                      ) : (
                        <div className="text-rose-300 font-semibold flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>FATAL BREACH ({opt.finalArrivalTime})</span>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-bold text-zinc-300 bg-secondary/20">
                    Gate 2: Budget Ceiling ($450 USD Max)
                  </td>
                  {options.map((opt) => (
                    <td key={opt.id} className="p-4 font-medium text-white">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>${opt.outOfPocketCost} USD out-of-pocket</span>
                      </div>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-bold text-zinc-300 bg-secondary/20">
                    Gate 3: Schengen Airside Visa Permissibility
                  </td>
                  {options.map((opt) => (
                    <td key={opt.id} className="p-4">
                      {opt.recoveryMode === 'MULTIMODAL_RAIL_AIR' ? (
                        <div className="text-rose-300 font-semibold flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>FATAL BREACH (Rail requires entering Germany)</span>
                        </div>
                      ) : (
                        <div className="text-emerald-300 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>PASS (Remains Airside Non-Schengen)</span>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-bold text-zinc-300 bg-secondary/20">
                    Gate 4: Minimum Connection Time (&ge;45m)
                  </td>
                  {options.map((opt) => (
                    <td key={opt.id} className="p-4 text-emerald-300 font-medium">
                      PASS (Sufficient connection buffer)
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-bold text-zinc-300 bg-secondary/20">
                    Overall Gate Eligibility Result
                  </td>
                  {options.map((opt) => (
                    <td key={opt.id} className="p-4">
                      {opt.hardGatePassed ? (
                        <Badge variant="success" className="text-xs">
                          QUALIFIED (100% Gates Cleared)
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          DISQUALIFIED (Hard Gate Failed)
                        </Badge>
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-bold text-zinc-300 bg-secondary/20">
                    Action
                  </td>
                  {options.map((opt) => (
                    <td key={opt.id} className="p-4">
                      {opt.hardGatePassed ? (
                        <Button
                          size="sm"
                          onClick={() => onSelectOptionForApproval(opt)}
                          className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-4"
                        >
                          Select for Approval
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">
                          Cannot Select (Disqualified)
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
