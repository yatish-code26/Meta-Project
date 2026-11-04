import React, { createContext, useContext, useReducer, useEffect, useMemo, ReactNode } from 'react';
import { z } from 'zod';
import { Trip, RecoveryOption, ApprovalRecord, ItinerarySegment } from '../types/travel';
import { TwinSimulationParams, DisruptionCalculation, RiskProfile, RecoveryLifecycleStep } from '../types/twin';
import { MetaRecoveryResponse } from '../services/meta/IMetaTravelModelService';
import { ALL_PRESETS, getPresetById, FullPresetConfig } from '../data/syntheticTrips';
import { SYNTHETIC_DISRUPTION_EVENT } from '../data/syntheticDisruptionScenario';
import { DeterministicConstraintEngine } from '../services/validation/DeterministicConstraintEngine';
import { MetaRecoveryTestFixture } from '../services/meta/MetaRecoveryTestFixture';
import { globalClock, DEFAULT_DEMO_INSTANT, ClockMode } from '../services/clockService';
import { UserTripInput, CandidateOptionInput } from '../types/tripBuilder';
import { DynamicTripEngine } from '../services/validation/DynamicTripEngine';

// =============================================================================
// Zod Storage Schema (Versioned for safe local persistence)
// =============================================================================

export interface ExpenseItem {
  id: string;
  tripId: string;
  category: 'flight' | 'train' | 'hotel' | 'meals' | 'ground_transport' | 'other';
  title: string;
  amount: number;
  currency: 'USD';
  isRecoveryExpense: boolean;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  tripId: string;
  title: string;
  message: string;
  category: 'disruption' | 'recovery' | 'gate' | 'system';
  severity: 'info' | 'warning' | 'alert' | 'success';
  timestamp: string;
  read: boolean;
}

const PersistentStateSchema = z.object({
  version: z.literal('1.0'),
  activeTripId: z.string(),
  approvedOptionId: z.string().nullable(),
  readNotificationIds: z.array(z.string()),
  customExpenses: z.array(
    z.object({
      id: z.string(),
      tripId: z.string(),
      category: z.enum(['flight', 'train', 'hotel', 'meals', 'ground_transport', 'other']),
      title: z.string(),
      amount: z.number(),
      currency: z.literal('USD'),
      isRecoveryExpense: z.boolean(),
      timestamp: z.string(),
    })
  ),
  clockMode: z.enum(['demo', 'real']),
  demoTimeIso: z.string(),
  riskProfile: z.enum(['cautious', 'balanced', 'fastest']).optional(),
});

type PersistentState = z.infer<typeof PersistentStateSchema>;

const STORAGE_KEY = 'routex_v3_local_state';

function loadPersistedState(): PersistentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const validated = PersistentStateSchema.safeParse(parsed);
    if (validated.success) {
      return validated.data;
    }
    console.warn('[RouteX Store] Discarding invalid localStorage schema:', validated.error);
    return null;
  } catch (err) {
    console.warn('[RouteX Store] Failed to read localStorage:', err);
    return null;
  }
}

function savePersistedState(state: PersistentState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[RouteX Store] Failed to write localStorage:', err);
  }
}

// =============================================================================
// Initial Mock Notifications and Expenses
// =============================================================================

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    tripId: 'tokyo-symposium',
    title: 'Connection at Risk',
    message: 'LH 901 delayed +75m on arrival into Frankfurt. Connection window reduced below 45m MCT.',
    category: 'disruption',
    severity: 'alert',
    timestamp: '2027-03-10T13:30:00+01:00',
    read: false,
  },
  {
    id: 'notif-2',
    tripId: 'tokyo-symposium',
    title: 'Simulated Alert: Airside Transit Enforced',
    message: 'German Federal Police Schengen border rules active: airside corridor only.',
    category: 'system',
    severity: 'info',
    timestamp: '2027-03-10T13:31:00+01:00',
    read: false,
  },
];

const INITIAL_EXPENSES: ExpenseItem[] = [
  {
    id: 'exp-1',
    tripId: 'tokyo-symposium',
    category: 'flight',
    title: 'Original Itinerary Ticket (LHR → FRA → HND)',
    amount: 1240,
    currency: 'USD',
    isRecoveryExpense: false,
    timestamp: '2027-02-15T10:00:00Z',
  },
];

// =============================================================================
// Store State & Actions
// =============================================================================

export interface RouteXState {
  // Navigation & View
  currentView: 'landing' | 'app';
  activeTripId: string;
  activePanelTab: 'options' | 'twin' | 'itinerary' | 'expenses' | 'assistant';
  isMobileSheetOpen: boolean;

  // Active Trip & Simulation Params
  trip: Trip;
  params: TwinSimulationParams;

  // Recovery State
  approvalRecord: ApprovalRecord | null;
  selectedOptionForReview: RecoveryOption | null;

  // Features Data
  expenses: ExpenseItem[];
  notifications: AppNotification[];

  // Clock
  clockMode: ClockMode;
  demoTimeIso: string;

  // Filters & Sorting
  filterStops: 'all' | 'direct' | '1stop';
  sortBy: 'best' | 'fastest' | 'cheapest';

  // Dynamic Trip Inputs
  customCandidateOptions: CandidateOptionInput[];
  customUserTripInput: UserTripInput | null;
}

export type RouteXAction =
  | { type: 'SET_CURRENT_VIEW'; view: 'landing' | 'app' }
  | { type: 'SET_ACTIVE_TRIP'; tripId: string }
  | { type: 'SET_PANEL_TAB'; tab: 'options' | 'twin' | 'itinerary' | 'expenses' | 'assistant' }
  | { type: 'SET_MOBILE_SHEET_OPEN'; open: boolean }
  | { type: 'UPDATE_PARAM'; key: keyof TwinSimulationParams; value: any }
  | { type: 'SET_RISK_PROFILE'; profile: RiskProfile }
  | { type: 'SELECT_OPTION_FOR_REVIEW'; option: RecoveryOption | null }
  | { type: 'CONFIRM_APPROVAL'; option: RecoveryOption }
  | { type: 'ROLLBACK_APPROVAL' }
  | { type: 'RESET_DEMO' }
  | { type: 'ADD_EXPENSE'; expense: Omit<ExpenseItem, 'id' | 'timestamp'> }
  | { type: 'DELETE_EXPENSE'; id: string }
  | { type: 'ADD_ITINERARY_ITEM'; item: Omit<ItinerarySegment, 'id'> }
  | { type: 'DELETE_ITINERARY_ITEM'; id: string }
  | { type: 'MARK_NOTIFICATION_READ'; id: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'SET_CLOCK_MODE'; mode: ClockMode }
  | { type: 'SET_DEMO_TIME'; iso: string }
  | { type: 'SET_FILTER_STOPS'; filter: 'all' | 'direct' | '1stop' }
  | { type: 'SET_SORT_BY'; sort: 'best' | 'fastest' | 'cheapest' }
  | { type: 'ADD_CANDIDATE_OPTION'; option: CandidateOptionInput }
  | { type: 'SET_USER_TRIP'; userTrip: UserTripInput };

function buildInitialState(): RouteXState {
  const persisted = loadPersistedState();
  const tripId = persisted?.activeTripId || 'tokyo-symposium';
  const cfg = getPresetById(tripId);

  return {
    currentView: 'app',
    activeTripId: tripId,
    activePanelTab: 'options',
    isMobileSheetOpen: false,
    trip: cfg.trip,
    params: {
      delayMinutes: cfg.defaultDelay,
      mctBufferMinutes: cfg.mctBufferMinutes,
      budgetCeiling: cfg.trip.constraints.maxRecoveryBudget,
      arrivalDeadlineHours: cfg.trip.constraints.hardArrivalDeadlineNumber,
      visaAirsideOnly: !cfg.trip.constraints.allowsLandsideBorderEntry,
      riskProfile: persisted?.riskProfile || 'balanced',
    },
    approvalRecord: null,
    selectedOptionForReview: null,
    expenses: (persisted?.customExpenses && persisted.customExpenses.length > 0)
      ? (persisted.customExpenses as ExpenseItem[])
      : INITIAL_EXPENSES,
    notifications: INITIAL_NOTIFICATIONS.map((n) => ({
      ...n,
      read: persisted?.readNotificationIds.includes(n.id) ?? false,
    })),
    clockMode: persisted?.clockMode || 'demo',
    demoTimeIso: persisted?.demoTimeIso || DEFAULT_DEMO_INSTANT,
    filterStops: 'all',
    sortBy: 'best',
    customCandidateOptions: [],
    customUserTripInput: null,
  };
}

function routeXReducer(state: RouteXState, action: RouteXAction): RouteXState {
  switch (action.type) {
    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.view };

    case 'SET_ACTIVE_TRIP': {
      const cfg = getPresetById(action.tripId);
      return {
        ...state,
        activeTripId: action.tripId,
        trip: cfg.trip,
        params: {
          delayMinutes: cfg.defaultDelay,
          mctBufferMinutes: cfg.mctBufferMinutes,
          budgetCeiling: cfg.trip.constraints.maxRecoveryBudget,
          arrivalDeadlineHours: cfg.trip.constraints.hardArrivalDeadlineNumber,
          visaAirsideOnly: !cfg.trip.constraints.allowsLandsideBorderEntry,
          riskProfile: state.params.riskProfile ?? 'balanced',
        },
        approvalRecord: null,
        selectedOptionForReview: null,
      };
    }

    case 'SET_PANEL_TAB':
      return { ...state, activePanelTab: action.tab };

    case 'SET_MOBILE_SHEET_OPEN':
      return { ...state, isMobileSheetOpen: action.open };

    case 'UPDATE_PARAM':
      return {
        ...state,
        params: {
          ...state.params,
          [action.key]: action.value,
        },
      };

    case 'SET_RISK_PROFILE':
      return {
        ...state,
        params: {
          ...state.params,
          riskProfile: action.profile,
        },
      };

    case 'SELECT_OPTION_FOR_REVIEW':
      return { ...state, selectedOptionForReview: action.option };

    case 'CONFIRM_APPROVAL': {
      const record: ApprovalRecord = {
        optionId: action.option.id,
        optionTitle: action.option.title,
        approvedAt: globalClock.now().toISOString(),
        travelerName: state.trip.travelerName,
        costDelta: action.option.outOfPocketCost,
        timeDeltaHours: action.option.totalDelayHours,
        acknowledgedAssumptionsCount: action.option.assumptions.length,
      };

      // Auto-add recovery out-of-pocket expense if greater than zero
      const newExpenses = [...state.expenses];
      if (action.option.outOfPocketCost > 0) {
        newExpenses.push({
          id: `exp-recov-${Date.now()}`,
          tripId: state.activeTripId,
          category: 'flight',
          title: `Rebooking Surcharge: ${action.option.title}`,
          amount: action.option.outOfPocketCost,
          currency: 'USD',
          isRecoveryExpense: true,
          timestamp: record.approvedAt,
        });
      }

      // Add confirmed notification (Feature F8)
      const newNotif: AppNotification = {
        id: `notif-appr-${Date.now()}`,
        tripId: state.activeTripId,
        title: 'Recovery Itinerary Confirmed',
        message: `Rebooked to ${action.option.title}. Out-of-pocket: $${action.option.outOfPocketCost} USD. Revised itinerary locked in.`,
        category: 'recovery',
        severity: 'success',
        timestamp: record.approvedAt,
        read: false,
      };

      // Update itinerary segments with recovered segments
      const updatedItinerary = state.trip.itinerary.map((seg) => {
        if (seg.id === 'SEG-LH-716') {
          return {
            ...seg,
            status: 'recovered' as const,
            title: action.option.title,
            carrier: action.option.carrierSummary,
            notes: `Rebooked via RouteX (${action.option.title}). Arrives ${action.option.finalArrivalTime}.`,
          };
        }
        return seg;
      });

      return {
        ...state,
        approvalRecord: record,
        expenses: newExpenses,
        notifications: [newNotif, ...state.notifications],
        trip: {
          ...state.trip,
          itinerary: updatedItinerary,
        },
      };
    }

    case 'ADD_ITINERARY_ITEM': {
      const newItem: ItinerarySegment = {
        ...action.item,
        id: `seg-${Date.now()}`,
      };
      return {
        ...state,
        trip: {
          ...state.trip,
          itinerary: [...state.trip.itinerary, newItem],
        },
      };
    }

    case 'DELETE_ITINERARY_ITEM':
      return {
        ...state,
        trip: {
          ...state.trip,
          itinerary: state.trip.itinerary.filter((s) => s.id !== action.id),
        },
      };

    case 'ROLLBACK_APPROVAL':
      return {
        ...state,
        approvalRecord: null,
        expenses: state.expenses.filter((e) => !e.isRecoveryExpense),
      };

    case 'RESET_DEMO': {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      const cfg = getPresetById('tokyo-symposium');
      globalClock.setMode('demo');
      globalClock.setDemoInstant(DEFAULT_DEMO_INSTANT);

      return {
        ...buildInitialState(),
        activeTripId: 'tokyo-symposium',
        trip: cfg.trip,
        approvalRecord: null,
        selectedOptionForReview: null,
      };
    }

    case 'ADD_EXPENSE': {
      const item: ExpenseItem = {
        ...action.expense,
        id: `exp-${Date.now()}`,
        timestamp: globalClock.now().toISOString(),
      };
      return {
        ...state,
        expenses: [item, ...state.expenses],
      };
    }

    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.id),
      };

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, read: true } : n
        ),
      };

    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };

    case 'SET_CLOCK_MODE':
      globalClock.setMode(action.mode);
      return { ...state, clockMode: action.mode };

    case 'SET_DEMO_TIME':
      globalClock.setDemoInstant(action.iso);
      return { ...state, demoTimeIso: action.iso };

    case 'SET_FILTER_STOPS':
      return { ...state, filterStops: action.filter };

    case 'SET_SORT_BY':
      return { ...state, sortBy: action.sort };

    case 'ADD_CANDIDATE_OPTION':
      return {
        ...state,
        customCandidateOptions: [action.option, ...state.customCandidateOptions],
      };

    case 'SET_USER_TRIP': {
      const u = action.userTrip;
      const leg1 = u.legs[0];
      const leg2 = u.legs[1];
      const originStr = leg1 ? `${leg1.originIata} Terminal` : 'Departure Hub';
      const destStr = leg2
        ? `${leg2.destinationIata} Terminal`
        : leg1
        ? `${leg1.destinationIata} Terminal`
        : 'Destination Hub';

      const newItinerary: ItinerarySegment[] = u.legs.map((l, i) => ({
        id: l.id || `seg-${i}`,
        type: 'flight',
        code: l.flightNumber,
        title: `${l.carrier} ${l.flightNumber}`,
        carrier: l.carrier,
        departureLocation: l.originIata,
        arrivalLocation: l.destinationIata,
        departureTime: l.departureTimeLocal.split('T')[1] || l.departureTimeLocal,
        departureTimeZone: 'UTC',
        arrivalTime: l.arrivalTimeLocal.split('T')[1] || l.arrivalTimeLocal,
        arrivalTimeZone: 'UTC',
        duration: '2h 40m',
        dayNumber: 1,
        status:
          i === 0 && u.disruption.type === 'CANCELLATION'
            ? 'cancelled'
            : i === 0 && u.disruption.delayMinutes > 0
            ? 'delayed'
            : 'scheduled',
      }));

      const newTrip: Trip = {
        id: u.id,
        title: u.title,
        travelerName: u.travelerName,
        travelerTier: 'Executive Priority',
        startDate: '2027-03-10',
        endDate: '2027-03-12',
        origin: originStr,
        destination: destStr,
        status:
          u.disruption.type === 'CANCELLATION' || u.disruption.delayMinutes > 40
            ? 'disrupted'
            : 'on_schedule',
        constraints: {
          maxRecoveryBudget: u.budgetCeiling,
          budgetCurrency: 'USD',
          hardArrivalDeadline: `${u.deadlineTimeLocal} (${u.deadlineIanaZone})`,
          hardArrivalDeadlineNumber: 14.0,
          visaTransitStatus: u.hasSchengenVisa
            ? 'Schengen Border Permitted'
            : 'Strict Airside Transit Only',
          allowsLandsideBorderEntry: u.hasSchengenVisa,
          alliancePreference: 'Any Qualified Airline',
          preferredTravelClass: 'Economy-Flex',
          baggageTag: u.hasCheckedBaggage ? 'RX-BAGGAGE-TRACKED' : 'Cabin Carry-on Only',
        },
        itinerary: newItinerary,
      };

      return {
        ...state,
        trip: newTrip,
        customUserTripInput: u,
        params: {
          ...state.params,
          delayMinutes: u.disruption.type === 'CANCELLATION' ? 0 : u.disruption.delayMinutes,
          mctBufferMinutes: u.mctBufferMinutes,
          budgetCeiling: u.budgetCeiling,
          visaAirsideOnly: !u.hasSchengenVisa,
        },
        approvalRecord: null,
        selectedOptionForReview: null,
      };
    }

    default:
      return state;
  }
}

// =============================================================================
// React Context Provider
// =============================================================================

interface RouteXContextValue {
  state: RouteXState;
  dispatch: React.Dispatch<RouteXAction>;
  currentConfig: FullPresetConfig;
  disruptionCalc: DisruptionCalculation;
  evaluatedOptions: RecoveryOption[];
  rawFixtureOptions: MetaRecoveryResponse['rawOptions'];
  currentStep: RecoveryLifecycleStep;
}

const RouteXContext = createContext<RouteXContextValue | null>(null);

export function RouteXProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(routeXReducer, undefined, buildInitialState);

  // Sync clock singleton when state changes
  useEffect(() => {
    globalClock.setMode(state.clockMode);
    if (state.clockMode === 'demo') {
      globalClock.setDemoInstant(state.demoTimeIso);
    }
  }, [state.clockMode, state.demoTimeIso]);

  // Persist critical state to localStorage on changes
  useEffect(() => {
    savePersistedState({
      version: '1.0',
      activeTripId: state.activeTripId,
      approvedOptionId: state.approvalRecord?.optionId || null,
      readNotificationIds: state.notifications.filter((n) => n.read).map((n) => n.id),
      customExpenses: state.expenses,
      clockMode: state.clockMode,
      demoTimeIso: state.demoTimeIso,
      riskProfile: state.params.riskProfile,
    });
  }, [state.activeTripId, state.approvalRecord, state.notifications, state.expenses, state.clockMode, state.demoTimeIso, state.params.riskProfile]);

  const currentConfig = useMemo(() => getPresetById(state.activeTripId), [state.activeTripId]);

  // Calculate live disruption status using unified connection rule
  const disruptionCalc: DisruptionCalculation = useMemo(() => {
    const scheduledLayover = currentConfig.scheduledLayoverMinutes;
    const effectiveLayover = scheduledLayover - state.params.delayMinutes;
    const connectionMargin = effectiveLayover - state.params.mctBufferMinutes;
    const isMissed = connectionMargin < 0;

    let statusCategory: DisruptionCalculation['statusCategory'] = 'ON_SCHEDULE';
    let statusHeadline = 'Connection On Schedule';
    let statusExplanation = `Inbound delay of +${state.params.delayMinutes}m leaves ${effectiveLayover}m transfer time, safely meeting the ${state.params.mctBufferMinutes}m Minimum Connection Time.`;

    if (isMissed) {
      statusCategory = 'MISSED_CONNECTION';
      statusHeadline = 'Critical Disruption: Connection Missed';
      statusExplanation = `Inbound delay (+${state.params.delayMinutes}m) compresses ${scheduledLayover}m layover down to ${effectiveLayover}m. Fails airport MCT (${state.params.mctBufferMinutes}m) by ${Math.abs(connectionMargin)}m. Connection is physically breached.`;
    } else if (connectionMargin < 20) {
      statusCategory = 'TIGHT_BUFFER';
      statusHeadline = 'Tight Connection: Risk of In-Transit Delay';
      statusExplanation = `Transfer window is ${effectiveLayover}m (${connectionMargin}m above MCT). Baggage transfer and border queues present elevated risk.`;
    }

    return {
      isConnectionMissed: isMissed,
      scheduledLayoverMinutes: scheduledLayover,
      effectiveLayoverMinutes: effectiveLayover,
      connectionMarginMinutes: connectionMargin,
      statusCategory,
      statusHeadline,
      statusExplanation,
    };
  }, [currentConfig, state.params.delayMinutes, state.params.mctBufferMinutes]);

  // Evaluate candidate recovery options dynamically via DeterministicConstraintEngine
  const rawFixtureOptions = useMemo(() => {
    return MetaRecoveryTestFixture.getMockResponse({
      trip: state.trip,
      disruption: {
        ...SYNTHETIC_DISRUPTION_EVENT,
        delayMinutes: state.params.delayMinutes,
      },
      constraints: state.trip.constraints,
      currentLocation: SYNTHETIC_DISRUPTION_EVENT.location,
      currentTime: state.demoTimeIso,
    }).rawOptions;
  }, [state.trip, state.params.delayMinutes, state.demoTimeIso]);

  const evaluatedOptions: RecoveryOption[] = useMemo(() => {
    const result = DeterministicConstraintEngine.evaluateCandidates(
      rawFixtureOptions,
      state.trip,
      state.params,
      {
        scheduledTouchdownUtc: new Date('2027-03-10T11:15:00Z'),
        touchdownUtc: new Date(new Date('2027-03-10T11:15:00Z').getTime() + state.params.delayMinutes * 60_000),
        onwardDepartureUtc: new Date('2027-03-10T12:45:00Z'),
        referenceDate: '2027-03-10',
        airportIanaZone: 'Europe/Berlin',
      }
    );

    let allOptions = [...result.options];

    // Merge evaluated custom candidate options (labeled 'user-entered' or 'ai-proposed')
    if (state.customCandidateOptions.length > 0) {
      const tripInput: UserTripInput = state.customUserTripInput || {
        id: state.trip.id,
        title: state.trip.title,
        travelerName: state.trip.travelerName,
        legs: [
          {
            id: 'l1',
            originIata: 'LHR',
            destinationIata: 'FRA',
            flightNumber: 'LH 901',
            carrier: 'Lufthansa',
            departureTimeLocal: '2027-03-10T06:30',
            arrivalTimeLocal: '2027-03-10T09:10',
          },
          {
            id: 'l2',
            originIata: 'FRA',
            destinationIata: 'HND',
            flightNumber: 'NH 204',
            carrier: 'ANA',
            departureTimeLocal: '2027-03-10T11:30',
            arrivalTimeLocal: '2027-03-11T06:55',
          },
        ],
        commitmentTitle: 'Global Partner Keynote',
        deadlineTimeLocal: '2027-03-11T12:00',
        deadlineIanaZone: 'Asia/Tokyo',
        budgetCeiling: state.params.budgetCeiling,
        mctBufferMinutes: state.params.mctBufferMinutes,
        hasCheckedBaggage: true,
        hasSchengenVisa: !state.params.visaAirsideOnly,
        disruption: {
          disruptedLegIndex: 0,
          type: 'DELAY',
          delayMinutes: state.params.delayMinutes,
          reason: 'Inbound delay',
        },
      };

      const dynamicEval = DynamicTripEngine.evaluateTrip(tripInput, state.customCandidateOptions);
      allOptions = [...dynamicEval.evaluatedOptions, ...allOptions];
    }

    return allOptions;
  }, [rawFixtureOptions, state.trip, state.params, state.customCandidateOptions, state.customUserTripInput]);

  // Derived current lifecycle step for StepProgress
  const currentStep: RecoveryLifecycleStep = useMemo(() => {
    if (state.approvalRecord) return 'confirmed';
    if (state.selectedOptionForReview) return 'review';
    if (evaluatedOptions.length > 0) return 'options';
    return 'disruption';
  }, [state.approvalRecord, state.selectedOptionForReview, evaluatedOptions.length]);

  const value = {
    state,
    dispatch,
    currentConfig,
    disruptionCalc,
    evaluatedOptions,
    rawFixtureOptions,
    currentStep,
  };

  return <RouteXContext.Provider value={value}>{children}</RouteXContext.Provider>;
}

export function useRouteXStore() {
  const context = useContext(RouteXContext);
  if (!context) {
    throw new Error('useRouteXStore must be used within a RouteXProvider');
  }
  return context;
}
