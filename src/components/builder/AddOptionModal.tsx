import React, { useState } from 'react';
import { X, Plus, Trash2, Plane, Train, Check, Shield } from 'lucide-react';
import { AIRPORTS } from '../../data/airports';
import { CandidateOptionInput } from '../../types/tripBuilder';

interface AddOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOption: (option: CandidateOptionInput) => void;
}

export function AddOptionModal({ isOpen, onClose, onAddOption }: AddOptionModalProps) {
  const [title, setTitle] = useState('British Airways Direct Rebook');
  const [carrierSummary, setCarrierSummary] = useState('British Airways • Flight BA 007');
  const [cost, setCost] = useState(150);
  const [recoveryMode, setRecoveryMode] = useState<'DIRECT_REBOOK' | 'MULTIMODAL_RAIL_AIR' | 'OVERNIGHT_REST'>('DIRECT_REBOOK');
  const [requiresLandsideTransit, setRequiresLandsideTransit] = useState(false);

  const [legs, setLegs] = useState<Array<{
    originIata: string;
    destinationIata: string;
    flightNumber: string;
    carrier: string;
    departureTimeLocal: string;
    arrivalTimeLocal: string;
  }>>([
    {
      originIata: 'FRA',
      destinationIata: 'HND',
      flightNumber: 'BA 007',
      carrier: 'British Airways',
      departureTimeLocal: '2027-03-10T14:15',
      arrivalTimeLocal: '2027-03-11T09:45',
    },
  ]);

  if (!isOpen) return null;

  const handleAddLeg = () => {
    const last = legs[legs.length - 1];
    setLegs([
      ...legs,
      {
        originIata: last ? last.destinationIata : 'MUC',
        destinationIata: 'HND',
        flightNumber: 'LH 714',
        carrier: 'Lufthansa',
        departureTimeLocal: '2027-03-10T16:30',
        arrivalTimeLocal: '2027-03-11T10:45',
      },
    ]);
  };

  const handleRemoveLeg = (idx: number) => {
    if (legs.length <= 1) return;
    setLegs(legs.filter((_, i) => i !== idx));
  };

  const handleUpdateLeg = (idx: number, field: string, val: string) => {
    const updated = [...legs];
    updated[idx] = { ...updated[idx], [field]: val };
    setLegs(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newOption: CandidateOptionInput = {
      id: `opt-user-${Date.now()}`,
      title,
      source: 'user-entered',
      carrierSummary,
      cost,
      recoveryMode,
      requiresLandsideTransit,
      legs,
    };
    onAddOption(newOption);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/40">
          <div>
            <h3 className="font-['Manrope'] font-bold text-base text-foreground">
              Add Alternative Route (User-Entered)
            </h3>
            <p className="text-xs text-muted-foreground">
              Input custom flight or multimodal alternatives. The engine will verify all physical gates.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Route Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs text-foreground font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Carrier Summary</label>
              <input
                type="text"
                required
                value={carrierSummary}
                onChange={(e) => setCarrierSummary(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs text-foreground font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Out-of-Pocket Cost ($USD)
              </label>
              <input
                type="number"
                min={0}
                max={5000}
                value={cost}
                onChange={(e) => setCost(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs text-foreground font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Recovery Mode</label>
              <select
                value={recoveryMode}
                onChange={(e) => setRecoveryMode(e.target.value as any)}
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-xs text-foreground font-semibold"
              >
                <option value="DIRECT_REBOOK">Direct Rebook (Airside)</option>
                <option value="MULTIMODAL_RAIL_AIR">Multimodal (Rail + Air)</option>
                <option value="OVERNIGHT_REST">Overnight Rest & Reroute</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="landsideToggle"
              checked={requiresLandsideTransit}
              onChange={(e) => setRequiresLandsideTransit(e.target.checked)}
              className="rounded text-primary focus:ring-primary w-4 h-4"
            />
            <label htmlFor="landsideToggle" className="text-xs text-foreground font-semibold cursor-pointer">
              Requires entering landside zone (Schengen border checkpoint)
            </label>
          </div>

          {/* Legs */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Alternative Segments ({legs.length})
              </span>
              <button
                type="button"
                onClick={handleAddLeg}
                className="flex items-center gap-1 text-xs text-primary font-bold hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Segment
              </button>
            </div>

            {legs.map((leg, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-border bg-secondary/30 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>Segment {idx + 1}</span>
                  {legs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLeg(idx)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[12px] text-muted-foreground mb-1">Origin</label>
                    <select
                      value={leg.originIata}
                      onChange={(e) => handleUpdateLeg(idx, 'originIata', e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-2 py-1 text-xs"
                    >
                      {AIRPORTS.map((a) => (
                        <option key={a.iata} value={a.iata}>
                          {a.iata} ({a.city})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] text-muted-foreground mb-1">Destination</label>
                    <select
                      value={leg.destinationIata}
                      onChange={(e) => handleUpdateLeg(idx, 'destinationIata', e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-2 py-1 text-xs"
                    >
                      {AIRPORTS.map((a) => (
                        <option key={a.iata} value={a.iata}>
                          {a.iata} ({a.city})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] text-muted-foreground mb-1">Code</label>
                    <input
                      type="text"
                      value={leg.flightNumber}
                      onChange={(e) => handleUpdateLeg(idx, 'flightNumber', e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-muted-foreground mb-1">Carrier</label>
                    <input
                      type="text"
                      value={leg.carrier}
                      onChange={(e) => handleUpdateLeg(idx, 'carrier', e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-2 py-1 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[12px] text-muted-foreground mb-1">Departure Local</label>
                    <input
                      type="datetime-local"
                      value={leg.departureTimeLocal}
                      onChange={(e) => handleUpdateLeg(idx, 'departureTimeLocal', e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] text-muted-foreground mb-1">Arrival Local</label>
                    <input
                      type="datetime-local"
                      value={leg.arrivalTimeLocal}
                      onChange={(e) => handleUpdateLeg(idx, 'arrivalTimeLocal', e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-2 py-1 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Option & Validate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

