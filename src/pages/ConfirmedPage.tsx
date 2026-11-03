import React from 'react';
import { CheckCircle, ArrowRight, AlertTriangle, Plane, Clock, RotateCcw } from 'lucide-react';
import { RecoveryOption, ApprovalRecord } from '../types/travel';
import { Screen } from '../components/navigation/AppHeader';

interface ConfirmedPageProps {
  option: RecoveryOption | null;
  approvalRecord: ApprovalRecord | null;
  onConfirm: (option: RecoveryOption) => void;
  onRollback: () => void;
  onNavigate: (s: Screen) => void;
}

export function ConfirmedPage({ option, approvalRecord, onConfirm, onRollback, onNavigate }: ConfirmedPageProps) {
  if (!option) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-muted-foreground text-lg">No option selected.</p>
        <button
          onClick={() => onNavigate('recovery')}
          className="mt-4 text-primary font-medium hover:underline"
        >
          Back to recovery options
        </button>
      </div>
    );
  }

  const seg = option.newSegments?.[0];
  const isConfirmed = !!approvalRecord;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Status header */}
      <div className="text-center mb-8">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
          isConfirmed ? 'bg-primary/10' : 'bg-muted'
        }`}>
          {isConfirmed
            ? <CheckCircle className="w-8 h-8 text-primary" />
            : <Plane className="w-8 h-8 text-muted-foreground" />}
        </div>
        <h1 className="text-3xl sm:text-4xl font-['Fraunces'] text-foreground mb-2">
          {isConfirmed ? 'Itinerary confirmed.' : 'Review your revised itinerary'}
        </h1>
        <p className="text-muted-foreground">
          {isConfirmed
            ? `Confirmed at ${new Date(approvalRecord!.approvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Offline simulation`
            : 'Review the option below then confirm your selection.'}
        </p>
      </div>

      {/* Option summary card */}
      <div className="rounded-2xl border bg-card p-6 mb-5">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="font-semibold text-lg text-foreground">{option.title}</h2>
            <p className="text-muted-foreground text-sm">{option.subtitle}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold font-['Fraunces'] tabular-nums text-foreground">
              {option.outOfPocketCost === 0 ? 'No cost' : `$${option.outOfPocketCost}`}
            </p>
            <p className="text-xs text-muted-foreground">out of pocket</p>
          </div>
        </div>

        {/* Revised flight */}
        {seg && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Plane className="w-4 h-4 text-primary" />
              <p className="font-semibold text-foreground text-sm">{seg.code} — {seg.carrier}</p>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xl font-bold tabular-nums font-['Fraunces']">{seg.departureTime}</p>
                <p className="text-xs text-muted-foreground">{seg.departureLocation?.split(' -')[0]}</p>
                <p className="text-xs text-muted-foreground">{seg.departureTimeZone?.replace(/\s*\(.*\)/, '')}</p>
              </div>
              <div className="flex-1 border-t border-dashed border-border relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2">
                  <p className="text-xs text-muted-foreground">{seg.duration}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold tabular-nums font-['Fraunces']">{seg.arrivalTime}</p>
                <p className="text-xs text-muted-foreground">{seg.arrivalLocation?.split(' -')[0]}</p>
                <p className="text-xs text-muted-foreground">{seg.arrivalTimeZone?.replace(/\s*\(.*\)/, '')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Deadline check */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-success/8 border border-success/20 mb-5">
          <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Arrives Day 2, 11:40 JST</p>
            <p className="text-muted-foreground text-xs">2h 20m before your 14:00 JST keynote — within deadline</p>
          </div>
        </div>

        {/* Next steps */}
        {option.nextSteps && option.nextSteps.length > 0 && (
          <div className="space-y-3 mb-5">
            <h3 className="font-semibold text-sm text-foreground">Right now, you need to</h3>
            {option.nextSteps.filter((s) => s.mandatory).map((step) => (
              <div key={step.stepNumber} className="flex items-start gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step.stepNumber}
                </div>
                <div>
                  <p className="font-medium text-foreground">{step.action}</p>
                  <p className="text-xs text-muted-foreground">{step.location}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Unverified assumptions */}
        {option.assumptions.filter((a) => a.category === 'UNVERIFIED_DATA').map((a) => (
          <div key={a.id} className="flex items-start gap-2 p-3 rounded-lg bg-warning/8 border border-warning/20 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-foreground">Unverified: {a.title}</p>
              <p className="text-muted-foreground mt-0.5">{a.detail}</p>
              <p className="text-warning font-medium mt-1">Action: {a.verificationAction}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      {!isConfirmed ? (
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('recovery')}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Back to options
          </button>
          <button
            onClick={() => onConfirm(option)}
            className="flex-1 rounded-xl bg-primary text-white py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Confirm this itinerary
          </button>
        </div>
      ) : (
        <div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center mb-4">
            <p className="text-sm text-primary font-medium">
              This is an offline simulation. No real booking was made.
            </p>
          </div>
          <button
            onClick={onRollback}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Undo — go back to options
          </button>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground mt-4">
        Offline simulation · No real airline booking was made
      </p>
    </div>
  );
}

