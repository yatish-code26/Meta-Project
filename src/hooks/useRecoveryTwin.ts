import { useState, useEffect, useMemo, useCallback } from 'react';
import { Trip, RecoveryOption, ApprovalRecord } from '../types/travel';
import { TwinSimulationParams, DisruptionCalculation } from '../types/twin';
import {
  ALL_PRESETS,
  getPresetById,
  FullPresetConfig,
} from '../data/syntheticTrips';
import {
  fetchRecoveryEvaluation,
  fetchProviderTelemetry,
  ProviderTelemetry,
  RecoveryApiEvaluationResponse,
} from '../services/recoveryApiClient';
import { DeterministicConstraintEngine } from '../services/validation/DeterministicConstraintEngine';
import { SYNTHETIC_DISRUPTION_EVENT } from '../data/syntheticDisruptionScenario';

export function useRecoveryTwin() {
  // Preset selection
  const [selectedPresetId, setSelectedPresetId] = useState<string>('tokyo-symposium');
  const currentConfig: FullPresetConfig = useMemo(
    () => getPresetById(selectedPresetId),
    [selectedPresetId]
  );

  // Active trip data
  const [trip, setTrip] = useState<Trip>(currentConfig.trip);

  // Simulation Parameters
  const [params, setParams] = useState<TwinSimulationParams>({
    delayMinutes: currentConfig.defaultDelay,
    mctBufferMinutes: currentConfig.mctBufferMinutes,
    budgetCeiling: currentConfig.trip.constraints.maxRecoveryBudget,
    arrivalDeadlineHours: currentConfig.trip.constraints.hardArrivalDeadlineNumber,
    visaAirsideOnly: !currentConfig.trip.constraints.allowsLandsideBorderEntry,
  });

  // AI Provider & Telemetry
  const [requestedProvider, setRequestedProvider] = useState<'groq' | 'meta' | 'muse' | 'fixture'>('groq');
  const [telemetry, setTelemetry] = useState<ProviderTelemetry>({
    groq: { configured: false, model: 'llama-3.3-70b-versatile' },
    meta: { configured: false, model: 'meta-llama/Llama-3.3-70B-Instruct' },
    muse: { configured: false, model: 'meta-muse-travel-v1' },
    fixture: { configured: true, model: 'calibrated-deterministic-fixture' },
  });

  // Evaluation & Processing State
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [rawResponse, setRawResponse] = useState<RecoveryApiEvaluationResponse | null>(null);

  // Approval state & sovereign audit record
  const [approvalRecord, setApprovalRecord] = useState<ApprovalRecord | null>(null);
  const [selectedOptionForReview, setSelectedOptionForReview] = useState<RecoveryOption | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState<boolean>(false);

  // Fetch telemetry once on mount
  useEffect(() => {
    let mounted = true;
    fetchProviderTelemetry().then((t) => {
      if (mounted) setTelemetry(t);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Update trip and params when preset changes
  useEffect(() => {
    const cfg = getPresetById(selectedPresetId);
    setTrip(cfg.trip);
    setParams({
      delayMinutes: cfg.defaultDelay,
      mctBufferMinutes: cfg.mctBufferMinutes,
      budgetCeiling: cfg.trip.constraints.maxRecoveryBudget,
      arrivalDeadlineHours: cfg.trip.constraints.hardArrivalDeadlineNumber,
      visaAirsideOnly: !cfg.trip.constraints.allowsLandsideBorderEntry,
    });
    setApprovalRecord(null);
    setSelectedOptionForReview(null);
  }, [selectedPresetId]);

  // Real-time Disruption Mathematical Calculation
  const disruptionCalc: DisruptionCalculation = useMemo(() => {
    const scheduledLayover = currentConfig.scheduledLayoverMinutes;
    const effectiveLayover = scheduledLayover - params.delayMinutes;
    const connectionMargin = effectiveLayover - params.mctBufferMinutes;
    const isMissed = connectionMargin < 0;

    let statusCategory: DisruptionCalculation['statusCategory'] = 'ON_SCHEDULE';
    let statusHeadline = 'Connection On Schedule';
    let statusExplanation = `Inbound delay of +${params.delayMinutes}m leaves ${effectiveLayover}m transfer time, safely meeting the ${params.mctBufferMinutes}m Minimum Connection Time.`;

    if (isMissed) {
      statusCategory = 'MISSED_CONNECTION';
      statusHeadline = 'Critical Disruption: Connection Missed';
      statusExplanation = `Inbound delay (+${params.delayMinutes}m) compresses ${scheduledLayover}m layover down to ${effectiveLayover}m. Fails airport MCT (${params.mctBufferMinutes}m) by ${Math.abs(connectionMargin)}m. Connection is physically breached.`;
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
  }, [currentConfig, params.delayMinutes, params.mctBufferMinutes]);

  // Trigger evaluation from server or fixture
  const runEvaluation = useCallback(async () => {
    setIsEvaluating(true);
    try {
      const response = await fetchRecoveryEvaluation({
        trip,
        disruption: {
          ...SYNTHETIC_DISRUPTION_EVENT,
          delayMinutes: params.delayMinutes,
        },
        constraints: {
          ...trip.constraints,
          maxRecoveryBudget: params.budgetCeiling,
          hardArrivalDeadlineNumber: params.arrivalDeadlineHours,
          allowsLandsideBorderEntry: !params.visaAirsideOnly,
        },
        currentLocation: trip.itinerary[1]?.departureLocation || 'Frankfurt Airport (FRA) Terminal 1',
        currentTime: '2026-10-28T13:30:00+01:00',
        requestedProvider,
        simulationParams: params,
      });

      setRawResponse(response);
    } catch (err) {
      console.error('Failed to run recovery evaluation:', err);
    } finally {
      setIsEvaluating(false);
    }
  }, [trip, params, requestedProvider]);

  // Auto-run evaluation once on initial load or provider switch
  useEffect(() => {
    runEvaluation();
  }, [requestedProvider, selectedPresetId]); // re-evaluate when preset or provider switches

  // Dynamic deterministic evaluation against live parameters (re-evaluated in <1ms)
  const evaluatedOptions: RecoveryOption[] = useMemo(() => {
    if (!rawResponse || !rawResponse.rawOptions || rawResponse.rawOptions.length === 0) {
      return [];
    }
    return DeterministicConstraintEngine.evaluateCandidates(
      rawResponse.rawOptions,
      trip,
      params
    );
  }, [rawResponse, trip, params]);

  // Parameter update helpers
  const updateParam = useCallback(<K extends keyof TwinSimulationParams>(
    key: K,
    val: TwinSimulationParams[K]
  ) => {
    setParams((prev) => ({ ...prev, [key]: val }));
  }, []);

  // Sovereign Traveler Approval
  const confirmApproval = useCallback((option: RecoveryOption) => {
    const record: ApprovalRecord = {
      optionId: option.id,
      optionTitle: option.title,
      approvedAt: new Date().toISOString(),
      travelerName: trip.travelerName,
      costDelta: option.outOfPocketCost,
      timeDeltaHours: option.totalDelayHours,
      acknowledgedAssumptionsCount: option.assumptions.length,
    };
    setApprovalRecord(record);
    setIsApprovalDialogOpen(false);
  }, [trip.travelerName]);

  // Rollback approval
  const rollbackApproval = useCallback(() => {
    setApprovalRecord(null);
  }, []);

  // Reset entire twin back to calibrated default
  const resetTwin = useCallback(() => {
    const cfg = getPresetById(selectedPresetId);
    setTrip(cfg.trip);
    setParams({
      delayMinutes: cfg.defaultDelay,
      mctBufferMinutes: cfg.mctBufferMinutes,
      budgetCeiling: cfg.trip.constraints.maxRecoveryBudget,
      arrivalDeadlineHours: cfg.trip.constraints.hardArrivalDeadlineNumber,
      visaAirsideOnly: !cfg.trip.constraints.allowsLandsideBorderEntry,
    });
    setApprovalRecord(null);
    setSelectedOptionForReview(null);
    setIsApprovalDialogOpen(false);
    runEvaluation();
  }, [selectedPresetId, runEvaluation]);

  return {
    presets: ALL_PRESETS,
    selectedPresetId,
    setSelectedPresetId,
    trip,
    params,
    updateParam,
    requestedProvider,
    setRequestedProvider,
    telemetry,
    isEvaluating,
    rawResponse,
    disruptionCalc,
    evaluatedOptions,
    selectedOptionForReview,
    setSelectedOptionForReview,
    isApprovalDialogOpen,
    setIsApprovalDialogOpen,
    approvalRecord,
    confirmApproval,
    rollbackApproval,
    resetTwin,
    runEvaluation,
  };
}

