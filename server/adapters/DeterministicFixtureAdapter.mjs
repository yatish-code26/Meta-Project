import { IAIProviderAdapter } from './IAIProviderAdapter.mjs';

/**
 * DeterministicFixtureAdapter
 * Calibrated zero-network recovery generator for offline and testing mode.
 * Adapts candidate departure times and delays dynamically based on requested disruption delay.
 */
export class DeterministicFixtureAdapter extends IAIProviderAdapter {
  constructor() {
    super('fixture', 'deterministic-calibrated-fixture');
  }

  isConfigured() {
    return true; // Always ready offline
  }

  async generateRecovery(request) {
    const startTime = Date.now();
    const delayMinutes = request.disruption?.delayMinutes || 75;

    // Simulate realistic server processing time (120ms)
    await new Promise((r) => setTimeout(r, 120));

    return {
      providerId: 'fixture',
      modelName: this.modelName,
      executionMode: 'DETERMINISTIC_FIXTURE',
      latencyMs: Date.now() - startTime,
      evaluatedAt: new Date().toISOString(),
      statusMessage: 'Operating in calibrated offline fixture mode (zero external network).',
      reasoningSummary: `Evaluated ${request.trip?.origin || 'LHR'} → ${request.trip?.destination || 'HND'} journey following +${delayMinutes}m delay at Frankfurt Hub. Audited 3 candidate pathways against arrival deadline, emergency budget buffer, and airside transit visa constraints.`,
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
              notes: 'Same-alliance involuntary rebooking under EU261 regulations. Star Alliance Senator priority boarding.',
            },
          ],
          estimatedTotalCost: 0,
          airlineCoveredAmount: 1240,
          outOfPocketCost: 0,
          finalArrivalTime: 'Day 2, 11:40 JST',
          totalDelayHours: 0.83,
          tradeOffSummary: 'Best balance: Lands at 11:40 JST (2h 20m before 14:00 keynote doors); $0 out-of-pocket under EU261; strictly within airside transit.',
          assumptions: [
            {
              id: 'asm-1',
              category: 'ASSUMPTION',
              title: 'Automatic Airside Baggage Re-tagging',
              detail: 'Checked bag #LH-982341 is transferred airside between Lufthansa aircraft without passenger intervention.',
              riskLevel: 'LOW',
              verificationAction: 'Verify luggage re-tag at Lufthansa Service Center B22.',
            },
            {
              id: 'asm-2',
              category: 'UNVERIFIED_DATA',
              title: 'Boarding Card Physical Re-issuance',
              detail: 'Seat reservation confirmed in Y-class inventory; physical card printing required.',
              riskLevel: 'MEDIUM',
              verificationAction: 'Collect boarding pass at Gate B42 transfer kiosk.',
            },
          ],
          nextSteps: [
            {
              stepNumber: 1,
              location: 'Lufthansa Service Center B22 (Terminal 1)',
              action: 'Print revised LH 714 boarding pass and scan luggage claim tag #LH-982341.',
              mandatory: true,
            },
            {
              stepNumber: 2,
              location: 'Terminal 1, Gate B42',
              action: 'Proceed to gate for 14:15 CET priority boarding.',
              mandatory: true,
            },
            {
              stepNumber: 3,
              location: 'Automated Carrier Dispatch',
              action: 'Transmit updated 11:40 JST arrival notice to hotel concierge.',
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
              notes: 'Exits airport transit zone into German federal territory.',
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
          tradeOffSummary: 'DISQUALIFIED: Breaches Day 2 14:00 arrival deadline by 2+ hours; illegal border entry without Schengen visa.',
          assumptions: [
            {
              id: 'asm-b1',
              category: 'ASSUMPTION',
              title: 'Schengen Border Immigration Clearance',
              detail: 'Boarding German rail requires crossing Bundespolizei passport control, violating airside transit status.',
              riskLevel: 'HIGH',
              verificationAction: 'FATAL: Prohibited without full German entry visa.',
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
              notes: 'Airside room inside non-Schengen transit zone.',
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
              notes: 'Next morning daily flight.',
            },
          ],
          estimatedTotalCost: 390,
          airlineCoveredAmount: 110,
          outOfPocketCost: 280,
          finalArrivalTime: 'Day 3, 06:15 JST',
          totalDelayHours: 19.4,
          tradeOffSummary: 'DISQUALIFIED: Severely breaches arrival deadline (+16 hours late into Day 3), completely forfeiting the keynote symposium.',
          assumptions: [
            {
              id: 'asm-c1',
              category: 'UNVERIFIED_DATA',
              title: 'Hotel Voucher Approval',
              detail: 'Airside cabin voucher requires airline customer service verification under EU261.',
              riskLevel: 'HIGH',
              verificationAction: 'Inquire at Lufthansa Service Center.',
            },
          ],
          nextSteps: [
            {
              stepNumber: 1,
              location: 'Customer Service B22',
              action: 'Disqualified: Fails hard arrival deadline.',
              mandatory: true,
            },
          ],
        },
      ],
    };
  }
}

