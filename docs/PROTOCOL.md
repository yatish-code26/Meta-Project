# Open Recovery Protocol (ORP) — Specification v1.0

The **Open Recovery Protocol (ORP)** defines interoperable JSON Schemas for air travel disruption telemetry, candidate recovery options, deterministic operational constraints, and tamper-evident cryptographic recovery certificates.

---

## 1. Disruption Event Schema (`orp.disruption.v1.json`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "DisruptionEvent",
  "type": "object",
  "required": ["id", "type", "detectedAt", "location", "delayedSegmentId", "delayMinutes", "rootCause"],
  "properties": {
    "id": { "type": "string" },
    "type": { "type": "string", "enum": ["MISSED_CONNECTION", "FLIGHT_CANCELLATION", "TERMINAL_LOCKOUT"] },
    "detectedAt": { "type": "string", "format": "date-time" },
    "location": { "type": "string" },
    "delayedSegmentId": { "type": "string" },
    "delayMinutes": { "type": "integer", "minimum": 0 },
    "rootCause": { "type": "string" },
    "isSyntheticSimulation": { "type": "boolean" }
  }
}
```

---

## 2. Recovery Candidate Option Schema (`orp.option.v1.json`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "RecoveryOption",
  "type": "object",
  "required": [
    "id",
    "title",
    "recoveryMode",
    "carrierSummary",
    "outOfPocketCost",
    "finalArrivalTime",
    "totalDelayHours",
    "hardGatePassed",
    "eligibilityStatus"
  ],
  "properties": {
    "id": { "type": "string" },
    "title": { "type": "string" },
    "subtitle": { "type": "string" },
    "recoveryMode": { "type": "string", "enum": ["DIRECT_REBOOK", "MULTIMODAL_RAIL_AIR", "OVERNIGHT_REST"] },
    "carrierSummary": { "type": "string" },
    "outOfPocketCost": { "type": "number", "minimum": 0 },
    "finalArrivalTime": { "type": "string" },
    "totalDelayHours": { "type": "number" },
    "hardGatePassed": { "type": "boolean" },
    "gateBreaches": { "type": "array", "items": { "type": "string" } },
    "feasibilityScore": { "type": "number", "minimum": 0, "maximum": 100 },
    "eligibilityStatus": { "type": "string", "enum": ["QUALIFIED_RECOMMENDED", "DISQUALIFIED_GATE_FAILED"] },
    "tradeOffSummary": { "type": "string" },
    "isRecommended": { "type": "boolean" }
  }
}
```

---

## 3. Operational Hard Constraint Schema (`orp.constraint.v1.json`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "TripConstraints",
  "type": "object",
  "required": ["maxRecoveryBudget", "budgetCurrency", "hardArrivalDeadline", "hardArrivalDeadlineNumber", "allowsLandsideBorderEntry"],
  "properties": {
    "maxRecoveryBudget": { "type": "number", "minimum": 0 },
    "budgetCurrency": { "type": "string", "default": "USD" },
    "hardArrivalDeadline": { "type": "string" },
    "hardArrivalDeadlineNumber": { "type": "number" },
    "visaTransitStatus": { "type": "string" },
    "allowsLandsideBorderEntry": { "type": "boolean" },
    "alliancePreference": { "type": "string" },
    "baggageTag": { "type": "string" }
  }
}
```

---

## 4. Recovery Evidence Certificate Schema (`orp.certificate.v1.json`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "RecoveryCertificate",
  "type": "object",
  "required": [
    "certificateHash",
    "payload"
  ],
  "properties": {
    "certificateHash": { "type": "string", "pattern": "^[a-f0-9]{64}$" },
    "payload": {
      "type": "object",
      "required": [
        "schemaVersion",
        "engineVersion",
        "certificateId",
        "prevHash",
        "timestampIso",
        "tripId",
        "travelerName",
        "inputs",
        "assumptions",
        "perConstraintResults",
        "twin",
        "optionProvenance",
        "selectedOption",
        "aiInvolvementLog"
      ],
      "properties": {
        "schemaVersion": { "type": "string", "enum": ["1.0.0"] },
        "engineVersion": { "type": "string" },
        "certificateId": { "type": "string" },
        "prevHash": { "type": "string" },
        "timestampIso": { "type": "string", "format": "date-time" },
        "tripId": { "type": "string" },
        "travelerName": { "type": "string" },
        "optionProvenance": { "type": "string", "enum": ["user-entered", "ai-proposed", "offline-example"] },
        "claimDraft": { "type": "string" }
      }
    }
  }
}
```

