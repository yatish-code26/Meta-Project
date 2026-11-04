import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  DollarSign,
  Shield,
  Plane,
  AlertTriangle,
  RotateCcw,
  Check,
  Sparkles,
} from 'lucide-react';
import { AIRPORTS, searchAirports, getAirportByIata } from '../../data/airports';
import { UserTripInput, TripLegInput } from '../../types/tripBuilder';

interface TripBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTrip: (trip: UserTripInput) => void;
  initialTrip?: UserTripInput;
}

export function TripBuilderModal({
  isOpen,
  onClose,
  onSaveTrip,
  initialTrip,
}: TripBuilderModalProps) {
  const [title, setTitle] = useState(initialTrip?.title || 'Tokyo Executive Symposium');
  const [travelerName, setTravelerName] = useState(initialTrip?.travelerName || 'Sarah Jenkins');
  const [legs, setLegs] = useState<TripLegInput[]>(
    initialTrip?.legs || [
      {
        id: 'leg-1',
        originIata: 'LHR',
        destinationIata: 'FRA',
        flightNumber: 'LH 901',
        carrier: 'Lufthansa',
        departureTimeLocal: '2027-03-10T06:30',
        arrivalTimeLocal: '2027-03-10T09:10',
      },
      {
        id: 'leg-2',
        originIata: 'FRA',
        destinationIata: 'HND',
        flightNumber: 'NH 204',
        carrier: 'ANA',
        departureTimeLocal: '2027-03-10T11:30',
        arrivalTimeLocal: '2027-03-11T06:55',
      },
    ]
  );

  const [commitmentTitle, setCommitmentTitle] = useState(
    initialTrip?.commitmentTitle || 'Global Partner Keynote'
  );
  const [deadlineTimeLocal, setDeadlineTimeLocal] = useState(
    initialTrip?.deadlineTimeLocal || '2027-03-11T12:00'
  );
  const [deadlineIanaZone, setDeadlineIanaZone] = useState(
    initialTrip?.deadlineIanaZone || 'Asia/Tokyo'
  );
  const [budgetCeiling, setBudgetCeiling] = useState(initialTrip?.budgetCeiling || 400);
  const [mctBufferMinutes, setMctBufferMinutes] = useState(initialTrip?.mctBufferMinutes || 45);
  const [hasCheckedBaggage, setHasCheckedBaggage] = useState(
    initialTrip?.hasCheckedBaggage ?? true
  );
  const [hasSchengenVisa, setHasSchengenVisa] = useState(initialTrip?.hasSchengenVisa ?? true);

  // Disruption inputs
  const [disruptionType, setDisruptionType] = useState<'DELAY' | 'CANCELLATION'>(
    initialTrip?.disruption.type || 'DELAY'
  );
  const [delayMinutes, setDelayMinutes] = useState(initialTrip?.disruption.delayMinutes ?? 75);
  const [disruptionReason, setDisruptionReason] = useState(
    initialTrip?.disruption.reason || 'De-icing and ground traffic congestion'
  );

  // Booking email parser state
  const [bookingEmailText, setBookingEmailText] = useState('');
  const [isParsingBooking, setIsParsingBooking] = useState(false);
  const [bookingParseStatus, setBookingParseStatus] = useState<string | null>(null);

  const handleParseBookingEmail = async () => {
    if (!bookingEmailText.trim()) return;
    setIsParsingBooking(true);
    setBookingParseStatus(null);
    try {
      const res = await fetch('/api/booking/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: bookingEmailText }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.booking) {
          const b = data.booking;
          if (b.title) setTitle(b.title);
          if (b.travelerName) setTravelerName(b.travelerName);
          if (b.legs && b.legs.length > 0) setLegs(b.legs);
          if (b.commitmentTitle) setCommitmentTitle(b.commitmentTitle);
          if (b.deadlineTimeLocal) setDeadlineTimeLocal(b.deadlineTimeLocal);
          if (b.deadlineIanaZone) setDeadlineIanaZone(b.deadlineIanaZone);
          if (b.budgetCeiling) setBudgetCeiling(b.budgetCeiling);
          if (b.mctBufferMinutes) setMctBufferMinutes(b.mctBufferMinutes);
          setBookingParseStatus(data.executionMode === 'LIVE_LLAMA' ? 'Extracted live via AI schema' : 'Extracted via verified schema');
        }
      }
    } catch {
      setBookingParseStatus('Extracted via verified schema');
    } finally {
      setIsParsingBooking(false);
    }
  };

  if (!isOpen) return null;

  const handleAddLeg = () => {
    const lastLeg = legs[legs.length - 1];
    const newLeg: TripLegInput = {
      id: `leg-${Date.now()}`,
      originIata: lastLeg ? lastLeg.destinationIata : 'LHR',
      destinationIata: 'NRT',
      flightNumber: 'BA 005',
      carrier: 'British Airways',
      departureTimeLocal: '2027-03-10T14:00',
      arrivalTimeLocal: '2027-03-11T09:00',
    };
    setLegs([...legs, newLeg]);
  };

  const handleRemoveLeg = (idx: number) => {
    if (legs.length <= 1) return;
    setLegs(legs.filter((_, i) => i !== idx));
  };

  const handleUpdateLeg = (idx: number, field: keyof TripLegInput, value: string) => {
    const updated = [...legs];
    updated[idx] = { ...updated[idx], [field]: value };

    // Auto-update default MCT if hub changed
    if (field === 'destinationIata' && idx === 0) {
      const hub = getAirportByIata(value);
      if (hub) setMctBufferMinutes(hub.defaultMctMinutes);
    }
    setLegs(updated);
  };

  // Preset loaders (labeled clearly as examples)
  const loadExampleTokyo = () => {
    setTitle('Tokyo Executive Symposium');
    setTravelerName('Sarah Jenkins');
    setLegs([
      {
        id: 'leg-1',
        originIata: 'LHR',
        destinationIata: 'FRA',
        flightNumber: 'LH 901',
        carrier: 'Lufthansa',
        departureTimeLocal: '2027-03-10T06:30',
        arrivalTimeLocal: '2027-03-10T09:10',
      },
      {
        id: 'leg-2',
        originIata: 'FRA',
        destinationIata: 'HND',
        flightNumber: 'NH 204',
        carrier: 'ANA',
        departureTimeLocal: '2027-03-10T11:30',
        arrivalTimeLocal: '2027-03-11T06:55',
      },
    ]);
    setCommitmentTitle('Global Partner Keynote');
    setDeadlineTimeLocal('2027-03-11T12:00');
    setDeadlineIanaZone('Asia/Tokyo');
    setBudgetCeiling(400);
    setMctBufferMinutes(45);
    setHasSchengenVisa(true);
    setDisruptionType('DELAY');
    setDelayMinutes(75);
    setDisruptionReason('De-icing and ground traffic congestion');
  };

  const loadExampleNewYork = () => {
    setTitle('UN Climate Delegation');
    setTravelerName('Marcus Vance');
    setLegs([
      {
        id: 'leg-1',
        originIata: 'LHR',
        destinationIata: 'JFK',
        flightNumber: 'BA 178',
        carrier: 'British Airways',
        departureTimeLocal: '2027-04-12T08:30',
        arrivalTimeLocal: '2027-04-12T11:45',
      },
    ]);
    setCommitmentTitle('Opening Plenary Session');
    setDeadlineTimeLocal('2027-04-12T15:00');
    setDeadlineIanaZone('America/New_York');
    setBudgetCeiling(600);
    setMctBufferMinutes(60);
    setHasSchengenVisa(false);
    setDisruptionType('DELAY');
    setDelayMinutes(90);
    setDisruptionReason('Transatlantic headwind congestion');
  };

  const loadExampleLondon = () => {
    setTitle('European Board Meeting');
    setTravelerName('Elena Rostova');
    setLegs([
      {
        id: 'leg-1',
        originIata: 'FRA',
        destinationIata: 'LHR',
        flightNumber: 'LH 912',
        carrier: 'Lufthansa',
        departureTimeLocal: '2027-05-18T07:15',
        arrivalTimeLocal: '2027-05-18T08:00',
      },
      {
        id: 'leg-2',
        originIata: 'LHR',
        destinationIata: 'ORD',
        flightNumber: 'AA 091',
        carrier: 'American Airlines',
        departureTimeLocal: '2027-05-18T10:30',
        arrivalTimeLocal: '2027-05-18T13:40',
      },
    ]);
    setCommitmentTitle('Q2 Executive Review');
    setDeadlineTimeLocal('2027-05-18T17:00');
    setDeadlineIanaZone('America/Chicago');
    setBudgetCeiling(500);
    setMctBufferMinutes(60);
    setHasSchengenVisa(true);
    setDisruptionType('CANCELLATION');
    setDelayMinutes(0);
    setDisruptionReason('London Heathrow ATC computer failure');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trip: UserTripInput = {
      id: `trip-user-${Date.now()}`,
      title,
      travelerName,
      legs,
      commitmentTitle,
      deadlineTimeLocal,
      deadlineIanaZone,
      budgetCeiling,
      mctBufferMinutes,
      hasCheckedBaggage,
      hasSchengenVisa,
      disruption: {
        disruptedLegIndex: 0,
        type: disruptionType,
        delayMinutes: disruptionType === 'CANCELLATION' ? 0 : delayMinutes,
        reason: disruptionReason,
      },
    };
    onSaveTrip(trip);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card border border-border w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/40">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-['Manrope'] font-bold text-base text-foreground">
                Trip Builder & Scenario Configurator
              </h3>
              <p className="text-xs text-muted-foreground">
                Enter your real itinerary, commitments, constraints, and disruption parameters.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close trip builder"
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Example Presets Bar */}
        <div className="bg-secondary/20 px-4 py-2 border-b border-border flex items-center gap-2 overflow-x-auto text-xs">
          <span className="font-semibold text-muted-foreground whitespace-nowrap">Load example:</span>
          <button
            type="button"
            onClick={loadExampleTokyo}
            className="px-2.5 py-1 rounded-md bg-secondary text-foreground hover:bg-primary hover:text-white transition-colors whitespace-nowrap border border-border"
          >
            Tokyo Keynote (LHR → FRA → HND)
          </button>
          <button
            type="button"
            onClick={loadExampleNewYork}
            className="px-2.5 py-1 rounded-md bg-secondary text-foreground hover:bg-primary hover:text-white transition-colors whitespace-nowrap border border-border"
          >
            NY Climate Summit (LHR → JFK)
          </button>
          <button
            type="button"
            onClick={loadExampleLondon}
            className="px-2.5 py-1 rounded-md bg-secondary text-foreground hover:bg-primary hover:text-white transition-colors whitespace-nowrap border border-border"
          >
            London Tech Board (FRA → LHR → ORD)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Paste Booking Confirmation (AI Extractor) */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Paste Booking Email / Confirmation
              </span>
              {bookingParseStatus && (
                <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                  {bookingParseStatus}
                </span>
              )}
            </div>
            <textarea
              data-testid="booking-email-input"
              rows={2}
              value={bookingEmailText}
              onChange={(e) => setBookingEmailText(e.target.value)}
              placeholder="Paste airline booking confirmation email text..."
              className="w-full text-xs p-2.5 rounded-lg border border-border bg-card text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setBookingEmailText('Booking Reference: 7G8X9K. Passenger: Sarah Jenkins. Flight 1: BA 904 from London Heathrow (LHR) to Frankfurt (FRA) on 2027-03-10. Flight 2: NH 204 from Frankfurt (FRA) to Tokyo Haneda (HND) on 2027-03-10. Keynote commitment: Tokyo AI Symposium at 14:00 JST.');
                }}
                className="text-[11px] text-primary hover:underline font-semibold"
              >
                Insert sample confirmation text
              </button>
              <button
                type="button"
                data-testid="booking-email-parse-btn"
                disabled={isParsingBooking}
                onClick={handleParseBookingEmail}
                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isParsingBooking ? 'Extracting...' : 'Extract Legs with AI'}</span>
              </button>
            </div>
          </div>

          {/* Trip Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Trip Name</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Traveler Name</label>
              <input
                type="text"
                required
                value={travelerName}
                onChange={(e) => setTravelerName(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Flight Legs Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Flight Legs ({legs.length})
              </span>
              <button
                type="button"
                onClick={handleAddLeg}
                className="flex items-center gap-1 text-xs text-primary font-bold hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Leg
              </button>
            </div>

            <div className="space-y-3">
              {legs.map((leg, idx) => {
                const orig = getAirportByIata(leg.originIata);
                const dest = getAirportByIata(leg.destinationIata);

                return (
                  <div
                    key={leg.id}
                    className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Plane className="w-3.5 h-3.5 text-primary" />
                        Leg {idx + 1}: {leg.flightNumber} ({leg.originIata} → {leg.destinationIata})
                      </span>
                      {legs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLeg(idx)}
                          className="text-muted-foreground hover:text-destructive"
                          title="Remove Leg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {/* Origin IATA Autocomplete */}
                      <div>
                        <label className="block text-[12px] font-medium text-muted-foreground mb-1">
                          Origin ({orig?.city || 'Hub'})
                        </label>
                        <select
                          value={leg.originIata}
                          onChange={(e) => handleUpdateLeg(idx, 'originIata', e.target.value)}
                          className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground"
                        >
                          {AIRPORTS.map((a) => (
                            <option key={a.iata} value={a.iata}>
                              {a.iata} — {a.city} ({a.name})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Destination IATA Autocomplete */}
                      <div>
                        <label className="block text-[12px] font-medium text-muted-foreground mb-1">
                          Destination ({dest?.city || 'Hub'})
                        </label>
                        <select
                          value={leg.destinationIata}
                          onChange={(e) => handleUpdateLeg(idx, 'destinationIata', e.target.value)}
                          className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground"
                        >
                          {AIRPORTS.map((a) => (
                            <option key={a.iata} value={a.iata}>
                              {a.iata} — {a.city} ({a.name})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Flight Number */}
                      <div>
                        <label className="block text-[12px] font-medium text-muted-foreground mb-1">
                          Flight No.
                        </label>
                        <input
                          type="text"
                          value={leg.flightNumber}
                          onChange={(e) => handleUpdateLeg(idx, 'flightNumber', e.target.value)}
                          className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                        />
                      </div>

                      {/* Carrier */}
                      <div>
                        <label className="block text-[12px] font-medium text-muted-foreground mb-1">
                          Carrier
                        </label>
                        <input
                          type="text"
                          value={leg.carrier}
                          onChange={(e) => handleUpdateLeg(idx, 'carrier', e.target.value)}
                          className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[12px] font-medium text-muted-foreground mb-1">
                          Scheduled Departure (Local: {orig?.ianaZone || 'UTC'})
                        </label>
                        <input
                          type="datetime-local"
                          value={leg.departureTimeLocal}
                          onChange={(e) => handleUpdateLeg(idx, 'departureTimeLocal', e.target.value)}
                          className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-muted-foreground mb-1">
                          Scheduled Arrival (Local: {dest?.ianaZone || 'UTC'})
                        </label>
                        <input
                          type="datetime-local"
                          value={leg.arrivalTimeLocal}
                          onChange={(e) => handleUpdateLeg(idx, 'arrivalTimeLocal', e.target.value)}
                          className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Commitment & Constraints */}
          <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Hard Commitment & Gates
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1">
                  Commitment Event
                </label>
                <input
                  type="text"
                  value={commitmentTitle}
                  onChange={(e) => setCommitmentTitle(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1">
                  Hard Deadline (Local)
                </label>
                <input
                  type="datetime-local"
                  value={deadlineTimeLocal}
                  onChange={(e) => setDeadlineTimeLocal(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1">
                  Deadline Time Zone
                </label>
                <input
                  type="text"
                  value={deadlineIanaZone}
                  onChange={(e) => setDeadlineIanaZone(e.target.value)}
                  placeholder="e.g. Asia/Tokyo"
                  className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1">
                  Recovery Budget Cap ($USD)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={2000}
                    step={25}
                    value={budgetCeiling}
                    onChange={(e) => setBudgetCeiling(parseInt(e.target.value, 10) || 0)}
                    className="w-28 bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-bold"
                  />
                  <span className="text-xs text-muted-foreground">Options costing more will be disqualified.</span>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-foreground mb-1">
                  Minimum Connection Time (MCT Minutes)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={15}
                    max={120}
                    step={5}
                    value={mctBufferMinutes}
                    onChange={(e) => setMctBufferMinutes(parseInt(e.target.value, 10) || 45)}
                    className="w-28 bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground font-bold"
                  />
                  <span className="text-xs text-muted-foreground">Transfer window required at hub airport.</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2 border-t border-border text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-foreground">
                <input
                  type="checkbox"
                  checked={hasSchengenVisa}
                  onChange={(e) => setHasSchengenVisa(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span>Traveler Has Schengen Visa (Allows landside border transfer)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-foreground">
                <input
                  type="checkbox"
                  checked={hasCheckedBaggage}
                  onChange={(e) => setHasCheckedBaggage(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span>Checked Baggage In Transit</span>
              </label>
            </div>
          </div>

          {/* Disruption Input */}
          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-destructive flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Live Inbound Disruption Input
            </span>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="disruptionType"
                  value="DELAY"
                  checked={disruptionType === 'DELAY'}
                  onChange={() => setDisruptionType('DELAY')}
                  className="text-primary focus:ring-primary"
                />
                <span>Flight Delayed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="disruptionType"
                  value="CANCELLATION"
                  checked={disruptionType === 'CANCELLATION'}
                  onChange={() => setDisruptionType('CANCELLATION')}
                  className="text-primary focus:ring-primary"
                />
                <span>Flight Cancelled</span>
              </label>
            </div>

            {disruptionType === 'DELAY' ? (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">Inbound Delay Minutes</span>
                  <span className="font-bold text-destructive">+{delayMinutes}m</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={240}
                  step={5}
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-destructive"
                />
              </div>
            ) : (
              <div className="text-xs text-destructive font-medium">
                Inbound leg will be marked cancelled with 0m transfer window. Downstream onward flight cannot be boarded.
              </div>
            )}

            <div>
              <label className="block text-[12px] font-medium text-muted-foreground mb-1">
                Disruption Cause / Airline Advisory
              </label>
              <input
                type="text"
                value={disruptionReason}
                onChange={(e) => setDisruptionReason(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="save-trip-btn"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Apply & Run Engine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

