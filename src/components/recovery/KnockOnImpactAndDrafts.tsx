import React, { useState } from 'react';
import {
  MessageSquare,
  Copy,
  Check,
  Building,
  Users,
  Car,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useRouteXStore } from '../../context/RouteXStore';

export function KnockOnImpactAndDrafts() {
  const { state, evaluatedOptions, disruptionCalc } = useRouteXStore();
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const activeOption = state.approvalRecord
    ? evaluatedOptions.find((o) => o.id === state.approvalRecord?.optionId) || evaluatedOptions[0]
    : state.selectedOptionForReview || evaluatedOptions[0];

  const arrivalTime = activeOption?.finalArrivalTime || 'Day 2, 11:40 JST';
  const delayHours = activeOption?.totalDelayHours || 2.5;

  const messages = [
    {
      id: 'hotel',
      title: 'Hotel Late Check-in Notice',
      icon: Building,
      recipient: 'The Prince Gallery Tokyo Kioicho (Front Desk)',
      subject: `Late Arrival Notice — Reservation #${state.trip.id.toUpperCase()}-HTL (${state.trip.travelerName})`,
      body: `Dear Front Desk Team,

I am traveling on flight LH 901 from London, which has encountered an inbound flight delay (+${state.params.delayMinutes} minutes). 

My revised expected arrival time in Tokyo is now ${arrivalTime}. 

Please hold my confirmed reservation for late check-in. I will proceed directly to the hotel upon arrival at the airport.

Best regards,
${state.trip.travelerName}
Star Alliance Gold`,
    },
    {
      id: 'organizer',
      title: 'Keynote Organizer Notice',
      icon: Users,
      recipient: 'Global Tech Symposium Executive Committee',
      subject: `Travel Disruption & ETA Update — ${state.trip.travelerName} (Keynote Speaker)`,
      body: `Dear Symposium Committee,

I am writing to provide an urgent update regarding my travel to Tokyo for tomorrow's symposium.

Due to a connecting disruption at Frankfurt Airport, I have been re-routed via ${activeOption?.carrierSummary || 'ANA'}. My revised touchdown at Tokyo Haneda is ${arrivalTime} (net delay: +${delayHours} hours).

${
  arrivalTime.includes('16:05') || arrivalTime.includes('Day 3')
    ? 'Since this crosses our scheduled 14:00 JST keynote session, I request that we adjust my presentation slot to the late afternoon session (17:30 JST) or Day 3 morning.'
    : 'This allows sufficient buffer before my scheduled 14:00 JST Keynote address. I will head straight to the Tokyo Big Sight venue.'
}

Thank you for your understanding.

Warm regards,
${state.trip.travelerName}`,
    },
    {
      id: 'transfer',
      title: 'Airport Transfer Rescheduling',
      icon: Car,
      recipient: 'Tokyo Premium Chauffeur Dispatch',
      subject: `Flight Delay & Pickup Update — Booking #${state.trip.id.toUpperCase()}-TRF`,
      body: `Hello Dispatch Team,

Please update my pickup schedule at Tokyo Haneda (HND). 

My original flight LH 716 was disrupted. My revised flight is scheduled to touch down at ${arrivalTime}. 

Please adjust my chauffeur arrival to 45 minutes following this landing time to account for customs and baggage collection.

Thank you,
${state.trip.travelerName}`,
    },
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(id);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h4 className="font-['Manrope'] font-bold text-xs text-foreground">
            Knock-On Impact & Pre-Drafted Communications
          </h4>
        </div>
        <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
          Review & Copy Only
        </span>
      </div>

      {/* Downstream Impact Alert Strip */}
      <div className="p-3 rounded-lg bg-secondary/40 border border-border space-y-1 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-foreground">
          <AlertTriangle className="w-3.5 h-3.5 text-warning" />
          <span>Downstream Impact Assessment</span>
        </div>
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          Inbound delay affects 3 downstream commitments: Hotel check-in, Symposium speaking slot, and Tokyo chauffeur pickup. Pre-drafted messages are grounded with exact revised arrival times ({arrivalTime}).
        </p>
      </div>

      {/* Message Cards */}
      <div className="space-y-3">
        {messages.map((m) => {
          const Icon = m.icon;
          const isCopied = copiedTab === m.id;

          return (
            <div key={m.id} className="p-3 rounded-xl border border-border bg-card space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  <span>{m.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(m.id, `Subject: ${m.subject}\n\n${m.body}`)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                >
                  {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopied ? 'Copied!' : 'Copy Draft'}</span>
                </button>
              </div>

              <div className="text-[12px] text-muted-foreground font-semibold">
                To: {m.recipient}
              </div>

              <div className="bg-secondary/30 p-2.5 rounded-lg border border-border/60 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-foreground/90">
                <div className="font-bold text-foreground pb-1">Subject: {m.subject}</div>
                <div>{m.body}</div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[12px] text-muted-foreground italic text-center">
        Security Note: RouteX drafts messages for traveler review. Nothing is transmitted externally without your manual submission.
      </p>
    </div>
  );
}

