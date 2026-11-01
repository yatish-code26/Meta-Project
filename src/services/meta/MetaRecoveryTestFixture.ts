import { MetaRecoveryRequest, MetaRecoveryResponse } from './IMetaTravelModelService';

/**
 * ==============================================================================
 * TEMPORARY TEST FIXTURE — ROUTEX AUTONOMOUS RECOVERY
 * ==============================================================================
 * 
 * ARCHITECTURAL INTEGRITY:
 * - This fixture provides deterministic, structured candidate recovery routes
 *   matching the exact Meta Llama JSON schema.
 * - Used while awaiting Meta API credit disbursement for the Startup Track.
 * - NO THIRD-PARTY LLM SUBSTITUTION: We strictly DO NOT substitute Groq, Gemini,
 *   or OpenAI to simulate Meta's model.
 * - All candidates are piped directly into the independent deterministic
 *   RecoveryConstraintValidator to enforce hard arrival, budget, and visa gates.
 * ==============================================================================
 */

export const META_TEST_FIXTURE_DISCLAIMER =
  'DEVELOPER TRANSPARENCY: Awaiting Meta API credit grant. Output generated from calibrated deterministic fixture. Zero third-party LLM substitution.';

export const MetaRecoveryTestFixture = {
  getMockResponse(request: MetaRecoveryRequest): MetaRecoveryResponse {
    return {
      modelMetadata: {
        modelName: 'meta-llama/Llama-3.3-70B-Instruct (Target Architecture)',
        provider: 'Temporary Test Fixture',
        isLiveApiCall: false,
        creditsStatus: 'AWAITING_CREDITS',
        statusMessage: 'Awaiting Meta Llama API credits. Operating in verified deterministic fixture mode.',
        disclaimer: META_TEST_FIXTURE_DISCLAIMER,
        evaluatedAt: new Date().toISOString(),
      },
      reasoningSummary:
        'Analyzed passenger location at Frankfurt (FRA) Terminal 1 following 75m inbound delay on LH 901. Evaluated 3 candidate pathways against hard constraints: Day 2 14:00 JST arrival deadline, $450 USD budget limit, and Airside Schengen Transit visa restriction. Only Option A satisfies all hard gates.',
      recommendedOptionId: 'OPT-RECOVER-A',
      rawOptions: [
        {
          id: 'OPT-RECOVER-A',
          title: 'Direct Airside Rebook — Next Available Star Alliance Flight',
          subtitle: 'Lufthansa LH 714 (FRA → HND) • Non-Stop Polar Corridor',
          recoveryMode: 'DIRECT_REBOOK',
          carrierSummary: 'Lufthansa (LH 714) • Airbus A350-900',
          newSegments: [
            {
              id: 'seg-recov-a1',
              type: 'flight',
              code: 'LH 714',
              title: 'Flight FRA → HND (Tokyo Haneda)',
              carrier: 'Lufthansa',
              departureLocation: 'Frankfurt Airport (FRA) - Terminal 1, Gate B42',
              arrivalLocation: 'Tokyo Haneda (HND) - Terminal 3',
              departureTime: '14:55',
              departureTimeZone: 'CET (UTC+1)',
              arrivalTime: '11:40 (Day 2)',
              arrivalTimeZone: 'JST (UTC+9)',
              duration: '12h 45m',
              dayNumber: 1,
              terminalGate: 'Gate B42',
              status: 'scheduled',
              notes: 'Same-alliance involuntary rebooking under EU261 regulations. Priority Star Alliance Senator boarding.',
            },
          ],
          estimatedTotalCost: 0,
          airlineCoveredAmount: 1240,
          outOfPocketCost: 0,
          finalArrivalTime: 'Day 2, 11:40 JST',
          totalDelayHours: 0.83, // 50 mins after original 10:50 JST scheduled arrival
          tradeOffSummary:
            'Clears all hard gates: Arrives 2h 20m before symposium doors (14:00 JST); 100% airline covered ($0 out-of-pocket); remains strictly inside international airside transit.',
          assumptions: [
            {
              id: 'asm-1',
              category: 'ASSUMPTION',
              title: 'Automatic Airside Baggage Re-tagging',
              detail: 'Checked bag #LH-982341 will be re-routed airside by Lufthansa ground handlers to LH 714 without passenger intervention.',
              riskLevel: 'LOW',
              verificationAction: 'Confirm baggage re-tagging at Lufthansa Service Center B22.',
            },
            {
              id: 'asm-2',
              category: 'UNVERIFIED_DATA',
              title: 'E-Ticket Seat Reissuance Required',
              detail: 'Seat availability is verified via synthetic GDS inventory (Y-class), but requires physical boarding pass re-print.',
              riskLevel: 'MEDIUM',
              verificationAction: 'Proceed to Gate B42 or transfer kiosk with passport for boarding card.',
            },
            {
              id: 'asm-3',
              category: 'SYNTHETIC_FALLBACK',
              title: 'Airside Visa Boundary Compliance',
              detail: 'Passenger does not cross German passport control; compliant with airside transit visa waiver.',
              riskLevel: 'LOW',
              verificationAction: 'Remain in Terminal 1 Non-Schengen transit zone.',
            },
          ],
          nextSteps: [
            {
              stepNumber: 1,
              location: 'Lufthansa Service Center B22 (Terminal 1)',
              action: 'Present passport to print revised LH 714 boarding pass and scan baggage tag #LH-982341.',
              mandatory: true,
            },
            {
              stepNumber: 2,
              location: 'Terminal 1, Gate B42',
              action: 'Proceed to Gate B42 for 14:15 CET priority boarding.',
              mandatory: true,
            },
            {
              stepNumber: 3,
              location: 'Automated Carrier Dispatch',
              action: 'Transmit updated arrival notice (11:40 JST) to The Capitol Hotel Tokyu concierge.',
              mandatory: false,
            },
          ],
        },
        {
          id: 'OPT-RECOVER-B',
          title: 'Multimodal High-Speed Rail + Secondary Hub Flight',
          subtitle: 'ICE 623 to Munich (MUC) + ANA NH 218 to Tokyo',
          recoveryMode: 'MULTIMODAL_RAIL_AIR',
          carrierSummary: 'Deutsche Bahn ICE 623 + All Nippon Airways (NH 218)',
          newSegments: [
            {
              id: 'seg-recov-b1',
              type: 'train',
              code: 'ICE 623',
              title: 'ICE High-Speed Rail FRA Airport → Munich Hbf',
              carrier: 'Deutsche Bahn',
              departureLocation: 'Frankfurt Airport Fernbahnhof - Track 4 (Landside)',
              arrivalLocation: 'Munich Central Station (München Hbf)',
              departureTime: '14:35',
              departureTimeZone: 'CET (UTC+1)',
              arrivalTime: '17:42',
              arrivalTimeZone: 'CET (UTC+1)',
              duration: '3h 07m',
              dayNumber: 1,
              status: 'scheduled',
              notes: 'Requires exiting airport transit area into German territory.',
            },
            {
              id: 'seg-recov-b2',
              type: 'flight',
              code: 'NH 218',
              title: 'Flight MUC → HND (Tokyo Haneda)',
              carrier: 'All Nippon Airways (ANA)',
              departureLocation: 'Munich Airport (MUC) - Terminal 2',
              arrivalLocation: 'Tokyo Haneda (HND) - Terminal 3',
              departureTime: '21:10',
              departureTimeZone: 'CET (UTC+1)',
              arrivalTime: '16:05 (Day 2)',
              arrivalTimeZone: 'JST (UTC+9)',
              duration: '11h 55m',
              dayNumber: 1,
              status: 'scheduled',
              notes: 'Star Alliance partner flight.',
            },
          ],
          estimatedTotalCost: 320,
          airlineCoveredAmount: 180,
          outOfPocketCost: 140,
          finalArrivalTime: 'Day 2, 16:05 JST',
          totalDelayHours: 5.25,
          tradeOffSummary:
            'DISQUALIFIED: Breaches Day 2 14:00 arrival deadline by 2+ hours; legally prohibited because passenger lacks a Schengen border entry permit.',
          assumptions: [
            {
              id: 'asm-b1',
              category: 'ASSUMPTION',
              title: 'Border Police Clearance Required',
              detail: 'Boarding the German rail network requires clearing Bundespolizei passport control, violating airside-only transit restriction.',
              riskLevel: 'HIGH',
              verificationAction: 'FATAL: Cannot be verified without a full German entry visa.',
            },
            {
              id: 'asm-b2',
              category: 'UNVERIFIED_DATA',
              title: 'Checked Luggage Rail Exclusion',
              detail: 'Luggage cannot be checked onto Deutsche Bahn; passenger would have to claim bag landside.',
              riskLevel: 'HIGH',
              verificationAction: 'Cannot interline luggage to rail.',
            },
          ],
          nextSteps: [
            {
              stepNumber: 1,
              location: 'Federal Border Control',
              action: 'Disqualified: Do not proceed to German passport control.',
              mandatory: true,
            },
          ],
        },
        {
          id: 'OPT-RECOVER-C',
          title: 'Airside Transit Rest + Morning Priority Departure',
          subtitle: 'Frankfurt Airside Transit Hotel + Tomorrow Morning LH 716',
          recoveryMode: 'OVERNIGHT_REST',
          carrierSummary: 'MyCloud Transit Hotel FRA + Lufthansa LH 716',
          newSegments: [
            {
              id: 'seg-recov-c1',
              type: 'hotel',
              code: 'HTL-TRANSIT',
              title: 'MyCloud Airside Transit Hotel Frankfurt',
              carrier: 'MyCloud Transit Hotel',
              departureLocation: 'Terminal 1, Gate Z25 (Airside)',
              arrivalLocation: 'Terminal 1, Gate Z25 (Airside)',
              departureTime: '15:00',
              departureTimeZone: 'CET (UTC+1)',
              arrivalTime: '07:30 (Day 2)',
              arrivalTimeZone: 'CET (UTC+1)',
              duration: '16h 30m layover',
              dayNumber: 1,
              status: 'scheduled',
              notes: 'Airside cabin inside non-Schengen transit zone.',
            },
            {
              id: 'seg-recov-c2',
              type: 'flight',
              code: 'LH 716 (Next Day)',
              title: 'Flight FRA → HND (Next Morning Departure)',
              carrier: 'Lufthansa',
              departureLocation: 'Frankfurt Airport (FRA) - Terminal 1',
              arrivalLocation: 'Tokyo Haneda (HND) - Terminal 3',
              departureTime: '09:30 (Day 2)',
              departureTimeZone: 'CET (UTC+1)',
              arrivalTime: '06:15 (Day 3)',
              arrivalTimeZone: 'JST (UTC+9)',
              duration: '12h 45m',
              dayNumber: 2,
              status: 'scheduled',
              notes: 'Next morning direct flight.',
            },
          ],
          estimatedTotalCost: 390,
          airlineCoveredAmount: 110,
          outOfPocketCost: 280,
          finalArrivalTime: 'Day 3, 06:15 JST',
          totalDelayHours: 19.4,
          tradeOffSummary:
            'DISQUALIFIED: Severely breaches arrival deadline (+16 hours late into Day 3), forfeiting the mandatory Keynote Symposium.',
          assumptions: [
            {
              id: 'asm-c1',
              category: 'UNVERIFIED_DATA',
              title: 'Hotel Room Voucher Availability',
              detail: 'Airside cabin availability is synthetic placeholder; room voucher requires customer desk validation.',
              riskLevel: 'HIGH',
              verificationAction: 'Inquire at Lufthansa Service Center.',
            },
          ],
          nextSteps: [
            {
              stepNumber: 1,
              location: 'Customer Service B22',
              action: 'Disqualified: Option fails hard arrival deadline.',
              mandatory: true,
            },
          ],
        },
      ],
    };
  },
};
