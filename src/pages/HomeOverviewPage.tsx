import React from 'react';
import { Compass, Plane, AlertTriangle, ShieldCheck, ArrowRight, Calendar, MapPin, User, Award, Clock, DollarSign, Sparkles } from 'lucide-react';
import { ALL_PRESETS, FullPresetConfig } from '../data/syntheticTrips';
import { AppView } from '../components/navigation/Navbar';

interface HomeOverviewPageProps {
  onNavigate: (view: AppView) => void;
  selectedPresetId: string;
  onSelectPreset: (id: string) => void;
  isDisrupted: boolean;
  isApproved: boolean;
}

export const HomeOverviewPage: React.FC<HomeOverviewPageProps> = ({
  onNavigate,
  selectedPresetId,
  onSelectPreset,
  isDisrupted,
  isApproved,
}) => {
  return (
    <div className="space-y-10 py-6">
      {/* Hero Product Banner (Inspired by Wandrly & Triprise) */}
      <div className="relative rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-8 sm:p-12 overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Autonomous Journey Protection</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            When Travel Disrupts, RouteX Recovers.
          </h1>

          <p className="text-sm sm:text-base text-zinc-200 leading-relaxed max-w-2xl">
            RouteX analyzes missed connections, evaluates alternative air and multimodal pathways against hard commitments and visa constraints, explains real trade-offs, and reconciles your itinerary with sovereign traveler authorization.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('disruption')}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50"
            >
              <span>Simulate Active Disruption</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('workspace')}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-sm transition-all backdrop-blur-md"
            >
              <Plane className="w-4 h-4" />
              <span>Explore Booked Itinerary</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 mt-8 border-t border-white/10 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-white text-base">Deterministic Gates</span>
            <p className="text-zinc-300 leading-normal">
              Hard arrival deadlines, budget ceilings, and visa barriers act as strict pass/fail walls.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-bold text-white text-base">Recovery Twin™ Sandbox</span>
            <p className="text-zinc-300 leading-normal">
              Test what-if delays, MCT connection buffers, and alternative travel parameters in real time.
            </p>
          </div>
          <div className="space-y-1">
            <span className="font-bold text-white text-base">Sovereign Authorization</span>
            <p className="text-zinc-300 leading-normal">
              Nothing commits to your active journey until you review assumptions and confirm.
            </p>
          </div>
        </div>
      </div>

      {/* Active Journeys Grid */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Active & Upcoming Expeditions
            </h2>
            <p className="text-xs text-muted-foreground">
              Select a calibrated journey scenario to review constraints, simulate hub disruptions, and test autonomous recovery.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ALL_PRESETS.map(({ preset, trip }) => {
            const isSelected = selectedPresetId === preset.id;
            const isThisDisrupted = preset.id === 'tokyo-symposium' && isDisrupted;
            const isThisApproved = preset.id === 'tokyo-symposium' && isApproved;

            return (
              <div
                key={preset.id}
                onClick={() => {
                  onSelectPreset(preset.id);
                }}
                className={`group rounded-2xl border bg-card p-6 flex flex-col justify-between transition-all cursor-pointer shadow-sm hover:shadow-md ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-border/80 hover:border-foreground/30'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Header & Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                      {trip.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        isThisApproved
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : isThisDisrupted
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                      }`}
                    >
                      {isThisApproved
                        ? 'Itinerary Synchronized'
                        : isThisDisrupted
                        ? 'Disruption Active'
                        : 'On Schedule'}
                    </span>
                  </div>

                  {/* Title & Route */}
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-base text-foreground group-hover:text-blue-600 transition-colors">
                      {preset.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{trip.origin}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{trip.destination}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {preset.description}
                  </p>

                  {/* Traveler Profile Metadata */}
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3 text-muted-foreground" />
                        Traveler
                      </span>
                      <span className="font-semibold text-foreground">{trip.travelerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-500" />
                        Status Tier
                      </span>
                      <span className="font-semibold text-foreground">{trip.travelerTier}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3 text-purple-500" />
                        Hard Deadline
                      </span>
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        {preset.deadlineLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-5 mt-4 border-t border-border flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">
                    {isSelected ? 'Active Journey' : 'Click to Select'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPreset(preset.id);
                      onNavigate('workspace');
                    }}
                    className="flex items-center gap-1 text-blue-600 font-semibold group-hover:translate-x-1 transition-transform"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

