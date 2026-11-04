import React, { useState } from 'react';
import {
  Compass,
  SlidersHorizontal,
  ListOrdered,
  Sparkles,
  Receipt,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Filter,
  Plus,
  Settings2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouteXStore } from '../../context/RouteXStore';
import { RecoveryOption } from '../../types/travel';
import { StepProgress } from '../twin/StepProgress';
import { TwinLab } from '../twin/TwinLab';
import { GateAuditSummary } from '../recovery/GateAuditSummary';
import { RecoveryAssistant } from '../assistant/RecoveryAssistant';
import { ItineraryPlanner } from '../itinerary/ItineraryPlanner';
import { ExpenseTracker } from '../expenses/ExpenseTracker';
import { TripBuilderModal } from '../builder/TripBuilderModal';
import { AddOptionModal } from '../builder/AddOptionModal';
import { formatDurationHours } from '../../lib/formatters';

export function FloatingPanel() {
  const { state, dispatch, evaluatedOptions, disruptionCalc } = useRouteXStore();
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>('OPT-RECOVER-A');
  const [isTripBuilderOpen, setIsTripBuilderOpen] = useState(false);
  const [isAddOptionOpen, setIsAddOptionOpen] = useState(false);

  // Filter & Sort Options
  const filteredOptions = evaluatedOptions.filter((opt) => {
    if (state.filterStops === 'direct') {
      return opt.newSegments?.length === 1;
    }
    if (state.filterStops === '1stop') {
      return opt.newSegments?.length > 1;
    }
    return true;
  });

  const sortedOptions = [...filteredOptions].sort((a, b) => {
    if (state.sortBy === 'fastest') {
      return a.totalDelayHours - b.totalDelayHours;
    }
    if (state.sortBy === 'cheapest') {
      return a.outOfPocketCost - b.outOfPocketCost;
    }
    // 'best': qualified recommended first, then feasibility score
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    return b.feasibilityScore - a.feasibilityScore;
  });

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
      {/* Panel Top Tabs (OrbitTrip style) */}
      <div className="flex items-center border-b border-border bg-secondary/50 p-1.5 flex-shrink-0 overflow-x-auto no-scrollbar">
        {[
          { id: 'options', label: 'Paths', icon: Compass },
          { id: 'twin', label: 'Twin Lab', icon: SlidersHorizontal },
          { id: 'itinerary', label: 'Itinerary', icon: ListOrdered },
          { id: 'expenses', label: 'Expenses', icon: Receipt },
          { id: 'assistant', label: 'Assistant', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = state.activePanelTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => dispatch({ type: 'SET_PANEL_TAB', tab: tab.id as any })}
              className={`flex-1 min-w-[70px] flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-primary" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Step Progress Ribbon (Inline in Panel) */}
        <StepProgress variant="inline" />

        {/* Tab 1: Recovery Paths */}
        {state.activePanelTab === 'options' && (
          <div className="space-y-4">
            {/* Filter and Sorting Header */}
            <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-3">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                <span className="font-semibold text-foreground">Filter:</span>
                {(['all', 'direct', '1stop'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => dispatch({ type: 'SET_FILTER_STOPS', filter })}
                    className={`px-2 py-0.5 rounded-md capitalize font-medium ${
                      state.filterStops === filter
                        ? 'bg-primary text-white'
                        : 'hover:bg-secondary text-muted-foreground'
                    }`}
                  >
                    {filter === '1stop' ? '1 Stop' : filter}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">Sort:</span>
                <select
                  value={state.sortBy}
                  onChange={(e) => dispatch({ type: 'SET_SORT_BY', sort: e.target.value as any })}
                  className="bg-secondary text-foreground text-xs rounded-md px-2 py-0.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="best">Best Match</option>
                  <option value="fastest">Fastest</option>
                  <option value="cheapest">Lowest Cost</option>
                </select>
              </div>
            </div>

            {/* Input-Driven Actions: Trip Builder & Manual Option */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTripBuilderOpen(true)}
                className="flex-1 py-1.5 px-3 rounded-lg border border-border bg-secondary/60 hover:bg-secondary text-xs font-bold text-foreground flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5 text-primary" />
                <span>Configure Trip</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddOptionOpen(true)}
                className="flex-1 py-1.5 px-3 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Alternative</span>
              </button>
            </div>

            {/* Inbound Disruption Warning Banner */}
            {disruptionCalc.isConnectionMissed ? (
              <div className="p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{disruptionCalc.statusHeadline}</span>
                </div>
                <p className="text-foreground/80 leading-relaxed">
                  {disruptionCalc.statusExplanation}
                </p>
                <div className="text-[12px] text-muted-foreground flex items-center justify-between pt-1">
                  <span>Hub: Frankfurt (FRA)</span>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_PANEL_TAB', tab: 'twin' })}
                    className="font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    Adjust in Twin Lab →
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-success/20 bg-success/5 text-success text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{disruptionCalc.statusHeadline}</span>
                </div>
                <p className="text-foreground/80 leading-relaxed">
                  {disruptionCalc.statusExplanation}
                </p>
                <div className="text-[12px] text-muted-foreground flex items-center justify-between pt-1">
                  <span>Transfer Window: {disruptionCalc.effectiveLayoverMinutes}m (MCT: {state.params.mctBufferMinutes}m)</span>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_PANEL_TAB', tab: 'twin' })}
                    className="font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    Simulate Delay →
                  </button>
                </div>
              </div>
            )}

            {/* Feature F4: AI Proposes, Engine Verifies (N proposed, M rejected, why) */}
            <GateAuditSummary
              options={evaluatedOptions}
              onOpenTwinLab={() => dispatch({ type: 'SET_PANEL_TAB', tab: 'twin' })}
            />

            {/* List of Qualified Recovery Candidate Route Cards (Rejected routes never appear as options) */}
            <div className="space-y-3">
              {sortedOptions.filter((opt) => opt.hardGatePassed).length > 0 ? (
                sortedOptions
                  .filter((opt) => opt.hardGatePassed)
                  .map((option) => (
                    <RouteCard
                      key={option.id}
                      option={option}
                      isExpanded={expandedOptionId === option.id}
                      onToggleExpand={() =>
                        setExpandedOptionId(expandedOptionId === option.id ? null : option.id)
                      }
                      onSelectRoute={() => {
                        dispatch({ type: 'SELECT_OPTION_FOR_REVIEW', option });
                      }}
                      isApproved={state.approvalRecord?.optionId === option.id}
                    />
                  ))
              ) : (
                <div className="p-8 text-center bg-secondary/30 rounded-xl border border-dashed border-border text-muted-foreground space-y-2">
                  <Compass className="w-8 h-8 text-muted-foreground/60 mx-auto" />
                  <h4 className="font-bold text-foreground text-sm">
                    {disruptionCalc.isConnectionMissed ? 'No Qualified Paths' : 'Connection Intact'}
                  </h4>
                  <p className="text-xs leading-relaxed max-w-xs mx-auto">
                    {disruptionCalc.isConnectionMissed
                      ? 'All proposed recovery pathways failed hard operational gates (arrival deadline, budget, or border rules). Inspect the audit section above or adjust constraints in Twin Lab.'
                      : 'The original connection is intact. No alternative flight rebooking is necessary at this delay level.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SET_PANEL_TAB', tab: 'twin' })}
                    className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Adjust in Twin Lab
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Twin Lab Simulation */}
        {state.activePanelTab === 'twin' && <TwinLab />}

        {/* Tab 3: Itinerary View (Feature F6) */}
        {state.activePanelTab === 'itinerary' && <ItineraryPlanner />}

        {/* Tab 4: Expenses View (Feature F7) */}
        {state.activePanelTab === 'expenses' && <ExpenseTracker />}

        {/* Tab 5: Assistant View */}
        {state.activePanelTab === 'assistant' && <RecoveryAssistant />}
      </div>

      {/* Trip Builder Modal */}
      <TripBuilderModal
        isOpen={isTripBuilderOpen}
        onClose={() => setIsTripBuilderOpen(false)}
        onSaveTrip={(trip) => dispatch({ type: 'SET_USER_TRIP', userTrip: trip })}
        initialTrip={state.customUserTripInput || undefined}
      />

      {/* Manual Route Alternative Modal */}
      <AddOptionModal
        isOpen={isAddOptionOpen}
        onClose={() => setIsAddOptionOpen(false)}
        onAddOption={(option) => dispatch({ type: 'ADD_CANDIDATE_OPTION', option })}
      />
    </div>
  );
}

// =============================================================================
// Route Card Component (Berlin transit + OrbitTrip inspired)
// =============================================================================

function RouteCard({
  option,
  isExpanded,
  onToggleExpand,
  onSelectRoute,
  isApproved,
}: {
  option: RecoveryOption;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelectRoute: () => void;
  isApproved: boolean;
}) {
  const seg = option.newSegments?.[0];

  return (
    <div
      className={`rounded-xl border transition-all ${
        isApproved
          ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.02]'
          : option.hardGatePassed
          ? 'border-border bg-card hover:border-primary/40'
          : 'border-destructive/20 bg-card/60 opacity-80'
      }`}
    >
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              {option.isRecommended && option.hardGatePassed && (
                <span className="px-2 py-0.5 rounded-full bg-primary text-white font-bold text-[12px]">
                  Recommended
                </span>
              )}
              {option.hardGatePassed ? (
                <span className="px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20 font-semibold text-[12px]">
                  Feasible
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 font-semibold text-[12px]">
                  Disqualified
                </span>
              )}
              {option.subtitle?.includes('user-entered') ? (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-semibold text-[11px]">
                  user-entered
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 font-semibold text-[11px]">
                  AI-proposed, availability unverified
                </span>
              )}
              <span className="text-[12px] text-muted-foreground font-medium">
                {option.carrierSummary}
              </span>
            </div>
            <h3 className="font-['Manrope'] font-bold text-foreground text-sm sm:text-base">
              {option.title}
            </h3>
          </div>

          <div className="text-right flex-shrink-0">
            <span className="font-['Manrope'] font-bold text-base sm:text-lg text-foreground block">
              ${option.outOfPocketCost}
            </span>
            <span className="text-[12px] text-muted-foreground">
              {option.outOfPocketCost === 0 ? 'Airline covered (eligibility not verified)' : 'Out-of-pocket'}
            </span>
          </div>
        </div>

        {/* Departure & Arrival Time Strip */}
        <div className="flex items-center justify-between text-xs my-3 bg-secondary/40 p-2.5 rounded-lg border border-border/50">
          <div>
            <span className="font-bold text-foreground text-sm block">
              {seg?.departureTime || '14:55'}
            </span>
            <span className="text-muted-foreground text-[12px]">{seg?.departureLocation || 'FRA'}</span>
          </div>

          {/* Proportional Duration Bar */}
          <div className="flex-1 mx-3 flex flex-col items-center">
            <div className="w-full flex items-center gap-1">
              <div className="h-1 flex-1 bg-primary rounded-full" />
              <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <div className="h-1 flex-1 bg-primary rounded-full" />
            </div>
            <span className="text-[12px] text-muted-foreground mt-1">
              +{formatDurationHours(option.totalDelayHours)} delay (Lands {option.finalArrivalTime})
            </span>
          </div>

          <div className="text-right">
            <span className="font-bold text-foreground text-sm block">
              {option.finalArrivalTime}
            </span>
            <span className="text-muted-foreground text-[12px]">HND</span>
          </div>
        </div>

        {/* Card Actions */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <button
            type="button"
            onClick={onToggleExpand}
            className="text-primary hover:text-primary/80 font-semibold flex items-center gap-1"
          >
            <span>{isExpanded ? 'Hide Details' : 'Details & Gate Status'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isApproved ? (
            <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active Route
            </span>
          ) : (
            <button
              type="button"
              disabled={!option.hardGatePassed}
              onClick={onSelectRoute}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 ${
                option.hardGatePassed
                  ? 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              <span>{option.hardGatePassed ? 'Review & Select' : 'Gated Out'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Journey Detail (Berlin Transit Style) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 border-t border-border/60 bg-secondary/30 text-xs space-y-3 pt-3"
          >
            {/* Step-by-Step Walk/Transit Breakdown */}
            <div>
              <span className="font-bold text-foreground uppercase tracking-wider text-xs block mb-2">
                Step-by-Step Transit Instructions
              </span>
              <div className="space-y-2 border-l-2 border-primary/40 pl-3 ml-1">
                {option.nextSteps.map((step) => (
                  <div key={step.stepNumber} className="relative">
                    <div className="absolute -left-[19px] top-0.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center text-xs text-white font-bold">
                      {step.stepNumber}
                    </div>
                    <span className="font-semibold text-foreground block">{step.action}</span>
                    <span className="text-muted-foreground text-xs block">{step.location}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hard Constraint Checks */}
            <div>
              <span className="font-bold text-foreground uppercase tracking-wider text-xs block mb-1.5">
                Hard Constraint Gate Status
              </span>
              <div className="space-y-1">
                {option.constraintChecks
                  .filter((c) => c.isHardGate)
                  .map((check, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      {check.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                      )}
                      <span className={check.passed ? 'text-foreground' : 'text-destructive font-medium'}>
                        {check.name}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Gate Breaches Warnings */}
            {option.gateBreaches.length > 0 && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
                {option.gateBreaches.map((b, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
