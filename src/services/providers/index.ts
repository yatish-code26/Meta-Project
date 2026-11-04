/**
 * Open Recovery Protocol — Standard Provider Interfaces
 * Offline and test-fixture implementations only. Live external API integrations are out of scope.
 */

import { ItinerarySegment, RecoveryOption, Trip } from '../../types/travel';
import { ExpenseItem } from '../../context/RouteXStore';
import { FullRecoveryCertificate } from '../certificate/RecoveryCertificateEngine';

export interface FlightStatusQuery {
  carrierCode: string;
  flightNumber: string;
  departureDateLocal: string;
  originIata: string;
}

export interface FlightStatusResult {
  carrier: string;
  flightNumber: string;
  status: 'ON_TIME' | 'DELAYED' | 'CANCELLED';
  delayMinutes: number;
  estimatedTouchdownUtc?: Date;
  gate?: string;
  source: 'offline-fixture' | 'live-feed';
}

export interface IFlightStatusProvider {
  name: string;
  checkStatus(query: FlightStatusQuery): Promise<FlightStatusResult>;
}

export interface IBookingProvider {
  name: string;
  checkSeatAvailability(flightNumber: string, date: string): Promise<{ available: boolean; seatsRemaining: number; fareClass: string }>;
  holdReservation(flightNumber: string, travelerName: string): Promise<{ pnr: string; expiresAtUtc: Date }>;
}

export interface ICalendarProvider {
  name: string;
  exportIcs(itinerary: ItinerarySegment[], tripTitle: string): Promise<string>;
  syncToCalendar(itinerary: ItinerarySegment[]): Promise<{ syncedEventsCount: number }>;
}

export interface IExpenseProvider {
  name: string;
  exportCsv(expenses: ExpenseItem[]): Promise<string>;
  submitCorporateClaim(certificate: FullRecoveryCertificate): Promise<{ claimId: string; status: 'PENDING_AUDIT' }>;
}

export interface IAIProvider {
  name: string;
  modelId: string;
  proposeRecoveryRoutes(context: any): Promise<{ rawOptions: any[]; reasoning: string }>;
}

/**
 * Offline Mock Implementations
 */
export class OfflineMockFlightStatusProvider implements IFlightStatusProvider {
  name = 'Offline Calibrated Flight Telemetry Provider';
  async checkStatus(query: FlightStatusQuery): Promise<FlightStatusResult> {
    return {
      carrier: query.carrierCode,
      flightNumber: query.flightNumber,
      status: 'DELAYED',
      delayMinutes: 75,
      source: 'offline-fixture',
    };
  }
}

export class OfflineMockBookingProvider implements IBookingProvider {
  name = 'Offline Simulated GDS Reservation Provider';
  async checkSeatAvailability(): Promise<{ available: boolean; seatsRemaining: number; fareClass: string }> {
    return { available: true, seatsRemaining: 4, fareClass: 'Y' };
  }
  async holdReservation(flightNumber: string, travelerName: string): Promise<{ pnr: string; expiresAtUtc: Date }> {
    return {
      pnr: `RX${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      expiresAtUtc: new Date(Date.now() + 45 * 60_000),
    };
  }
}

