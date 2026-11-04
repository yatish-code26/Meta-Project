import { describe, it, expect } from 'vitest';
import {
  RecoveryCertificateEngine,
  FullRecoveryCertificate,
} from '../services/certificate/RecoveryCertificateEngine';
import { DeterministicConstraintEngine } from '../services/validation/DeterministicConstraintEngine';
import { MetaRecoveryTestFixture } from '../services/meta/MetaRecoveryTestFixture';
import { INITIAL_TRIP_DATA, SYNTHETIC_DISRUPTION_EVENT } from '../data/syntheticDisruptionScenario';

describe('RecoveryCertificateEngine - Canonical JSON & SHA-256 Hash Chain', () => {
  const trip = INITIAL_TRIP_DATA;

  const mockResponse = MetaRecoveryTestFixture.getMockResponse({
    trip,
    disruption: SYNTHETIC_DISRUPTION_EVENT,
    constraints: trip.constraints,
    currentLocation: 'Frankfurt Airport (FRA) Terminal 1',
    currentTime: '2027-03-10T13:30:00Z',
  });

  const evalResult = DeterministicConstraintEngine.evaluateCandidates(
    mockResponse.rawOptions,
    trip,
    {
      delayMinutes: 75,
      mctBufferMinutes: 45,
      budgetCeiling: trip.constraints.maxRecoveryBudget,
      arrivalDeadlineHours: trip.constraints.hardArrivalDeadlineNumber,
      visaAirsideOnly: true,
      riskProfile: 'balanced',
    }
  );

  const sampleOption = evalResult.options[0];

  it('generates canonical JSON and deterministic SHA-256 hash', async () => {
    const cert = await RecoveryCertificateEngine.generateCertificate({
      trip,
      option: sampleOption,
      aiLog: {
        modelId: 'llama-3.3-70b-versatile',
        schemaValidated: true,
        offlineFallback: false,
      },
    });

    expect(cert.payload.schemaVersion).toBe('1.0.0');
    expect(cert.certificateHash).toMatch(/^[a-f0-9]{64}$/);
    expect(cert.payload.prevHash).toMatch(/^[a-f0-9]{64}$/);
    expect(cert.payload.tripId).toBe(trip.id);
    expect(cert.payload.selectedOption.id).toBe(sampleOption.id);
  });

  it('incorporates required EU261 disclaimer in claimDraft', async () => {
    const cert = await RecoveryCertificateEngine.generateCertificate({
      trip,
      option: sampleOption,
    });

    expect(cert.payload.claimDraft).toContain('EU261 may apply, eligibility not verified');
  });

  it('validates round-trip import & verify: returns MATCH on unaltered certificate', async () => {
    const cert = await RecoveryCertificateEngine.generateCertificate({
      trip,
      option: sampleOption,
    });

    const verification = await RecoveryCertificateEngine.importAndVerify(JSON.stringify(cert));
    expect(verification.status).toBe('MATCH');
    expect(verification.mismatchFields).toEqual([]);
    expect(verification.computedHash).toBe(cert.certificateHash);
  });

  it('detects tampering: returns MISMATCH and pinpointed mismatch fields when certificate is altered', async () => {
    const cert = await RecoveryCertificateEngine.generateCertificate({
      trip,
      option: sampleOption,
    });

    // Tamper with cost
    const tamperedCert: FullRecoveryCertificate = JSON.parse(JSON.stringify(cert));
    tamperedCert.payload.selectedOption.outOfPocketCost = 999; // traveler forged cost
    tamperedCert.payload.selectedOption.title = 'Tampered Flight Route';

    const verification = await RecoveryCertificateEngine.importAndVerify(JSON.stringify(tamperedCert));
    expect(verification.status).toBe('MISMATCH');
    expect(verification.computedHash).not.toBe(tamperedCert.certificateHash);
    expect(verification.mismatchFields.some((f) => f.includes('Hash mismatch'))).toBe(true);
  });

  it('generates reproducible canonical hash regardless of object key ordering', async () => {
    const cert = await RecoveryCertificateEngine.generateCertificate({
      trip,
      option: sampleOption,
    });

    // Reorder payload keys
    const p = cert.payload;
    const reorderedPayload = {
      selectedOption: p.selectedOption,
      schemaVersion: p.schemaVersion,
      engineVersion: p.engineVersion,
      certificateId: p.certificateId,
      prevHash: p.prevHash,
      timestampIso: p.timestampIso,
      tripId: p.tripId,
      travelerName: p.travelerName,
      inputs: p.inputs,
      assumptions: p.assumptions,
      perConstraintResults: p.perConstraintResults,
      twin: p.twin,
      optionProvenance: p.optionProvenance,
      aiInvolvementLog: p.aiInvolvementLog,
      claimDraft: p.claimDraft,
    };

    const reorderedCert = {
      certificateHash: cert.certificateHash,
      payload: reorderedPayload,
    };

    const verification = await RecoveryCertificateEngine.importAndVerify(JSON.stringify(reorderedCert));
    expect(verification.status).toBe('MATCH');
  });
});
