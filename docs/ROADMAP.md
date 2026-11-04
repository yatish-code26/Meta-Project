# RouteX — Future Integration Roadmap

This document outlines the architectural roadmap for transitioning RouteX from calibrated test fixtures and isolated server adapters to production-grade enterprise travel integrations.

---

## Phase 1: Real Telemetry & GDS Reservation Feeds
- **Flight Status Telemetry**: Connect to live OAG and FlightAware Firehose APIs using webhook event streaming for gate changes, tarmac delays, and diversion telemetry.
- **Global Distribution System (GDS) Connector**: Integrate with Amadeus for Developers or Sabre REST APIs to query real-time PNR availability, seat maps, and airline interline e-ticket exchange waivers.
- **Corporate Booking Integration**: Sync with Concur Travel and Navan APIs to automatically check travel policy compliance (per-diem limits, preferred carriers) before presenting options.

---

## Phase 2: Mobile Passkey & Cryptographic Signing
- **Passkey Identity**: Replace traveler name tags with W3C WebAuthn / Passkey signatures to cryptographically bind traveler approval records to biometric hardware tokens (Face ID / Touch ID).
- **Direct Ledger Publication**: Anchor certificate SHA-256 root hashes into public timestamping ledgers (RFC 3161 or Ethereum L2) to enable instant auditability for corporate insurance claims and airline reimbursement arbitration.

---

## Phase 3: Autonomous Claim Settlement
- **Automated Claim Filing**: One-click dispatch of structured claim packages directly to airline customer relations endpoints for EU261 / UK261 compensation.
- **Corporate Virtual Card Provisioning**: Issue single-use virtual cards (via Stripe Treasury or Ramp API) pre-funded with the exact authorized out-of-pocket delta upon traveler confirmation.

