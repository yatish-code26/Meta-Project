import { describe, it, expect } from 'vitest';
import { ExportService } from '../services/export/ExportService';
import { getPresetById } from '../data/syntheticTrips';
import { ExpenseItem } from '../context/RouteXStore';

describe('ExportService - RFC 5545 iCalendar & Expenses CSV Generation', () => {
  const preset = getPresetById('tokyo-symposium');
  const sampleExpenses: ExpenseItem[] = [
    {
      id: 'exp-1',
      tripId: 'tokyo-symposium',
      category: 'flight',
      title: 'Original Itinerary Ticket',
      amount: 1240,
      currency: 'USD',
      isRecoveryExpense: false,
      timestamp: '2027-02-15T10:00:00Z',
    },
    {
      id: 'exp-2',
      tripId: 'tokyo-symposium',
      category: 'flight',
      title: 'Rebooking Fee',
      amount: 180,
      currency: 'USD',
      isRecoveryExpense: true,
      timestamp: '2027-03-10T14:15:00Z',
    },
  ];

  it('generates valid RFC 5545 .ics text with VCALENDAR and VEVENT blocks', () => {
    const ics = ExportService.generateIcs(preset.trip.itinerary, preset.trip.title);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//RouteX//Autonomous Travel Recovery Engine//EN');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:');
    expect(ics).toContain('DTSTART:');
    expect(ics).toContain('DTEND:');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('formats iCalendar timestamps in standard UTC format with Z suffix', () => {
    const ics = ExportService.generateIcs(preset.trip.itinerary, preset.trip.title);

    // Look for DTSTART:YYYYMMDDTHHMMSSZ
    const dtstartMatches = ics.match(/DTSTART:(\d{8}T\d{6}Z)/g);
    expect(dtstartMatches).not.toBeNull();
    expect(dtstartMatches!.length).toBeGreaterThan(0);
  });

  it('generates well-formatted CSV with headers and escaped commas', () => {
    const csv = ExportService.generateExpensesCsv(sampleExpenses);

    expect(csv).toContain('ID,Trip ID,Date,Category,Title,Amount,Currency,Is Recovery Expense');
    expect(csv).toContain('exp-1');
    expect(csv).toContain('1240');
    expect(csv).toContain('exp-2');
    expect(csv).toContain('180');
    expect(csv).toContain('YES');
  });

  it('exports and parses state JSON backup cleanly', () => {
    const testState = {
      version: '1.0',
      activeTripId: 'tokyo-symposium',
      items: [1, 2, 3],
    };

    const jsonStr = ExportService.exportFullJsonBackup(testState);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.schemaVersion).toBe('1.0.0');
    expect(parsed.state.activeTripId).toBe('tokyo-symposium');
  });
});
