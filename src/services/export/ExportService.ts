import { ItinerarySegment } from '../../types/travel';
import { ExpenseItem } from '../../context/RouteXStore';

export class ExportService {
  /**
   * Format a Date into iCalendar UTC format (e.g. 20270310T063000Z)
   */
  public static toIcsUtc(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      date.getUTCFullYear() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) +
      'T' +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) +
      'Z'
    );
  }

  /**
   * Generate RFC 5545 compliant iCalendar string (.ics) with true UTC instants.
   */
  public static generateIcs(itinerary: ItinerarySegment[], tripTitle: string): string {
    const nowUtc = this.toIcsUtc(new Date());
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//RouteX//Autonomous Travel Recovery Engine//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:RouteX — ${tripTitle.replace(/[\\;,]/g, ' ')}`,
    ];

    itinerary.forEach((seg, idx) => {
      // Default to 2027-03-10 base date if only time provided
      const depHourMin = seg.departureTime.includes(':') ? seg.departureTime : '08:00';
      const arrHourMin = seg.arrivalTime.includes(':') ? seg.arrivalTime : '11:00';

      const [dHour, dMin] = depHourMin.split(':').map((n) => parseInt(n, 10) || 0);
      const [aHour, aMin] = arrHourMin.split(':').map((n) => parseInt(n, 10) || 0);

      const baseDay = 10 + (seg.dayNumber || 1) - 1;
      const startDate = new Date(Date.UTC(2027, 2, baseDay, dHour, dMin, 0));
      const endDate = new Date(Date.UTC(2027, 2, baseDay, aHour, aMin, 0));
      if (endDate < startDate) {
        endDate.setUTCDate(endDate.getUTCDate() + 1);
      }

      const uid = `routex-event-${seg.id || idx}-${Date.now()}@routex.travel`;
      const cleanSummary = `${seg.code ? seg.code + ': ' : ''}${seg.title || 'Travel Segment'}`.replace(/[\\;,]/g, ' ');
      const cleanLocation = `${seg.departureLocation || 'Origin'} to ${seg.arrivalLocation || 'Destination'}`.replace(/[\\;,]/g, ' ');
      const cleanNotes = (seg.notes || `Carrier: ${seg.carrier || 'N/A'}, Duration: ${seg.duration || 'N/A'}, Status: ${seg.status || 'scheduled'}`).replace(/[\\;,]/g, ' ');

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${nowUtc}`);
      lines.push(`DTSTART:${this.toIcsUtc(startDate)}`);
      lines.push(`DTEND:${this.toIcsUtc(endDate)}`);
      lines.push(`SUMMARY:${cleanSummary}`);
      lines.push(`LOCATION:${cleanLocation}`);
      lines.push(`DESCRIPTION:${cleanNotes}`);
      lines.push(`STATUS:${seg.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`);
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  /**
   * Generate CSV representation of travel and recovery expenses.
   */
  public static generateExpensesCsv(expenses: ExpenseItem[]): string {
    const headers = ['ID', 'Trip ID', 'Date', 'Category', 'Title', 'Amount', 'Currency', 'Is Recovery Expense'];
    const escapeCsv = (str: any) => `"${String(str ?? '').replace(/"/g, '""')}"`;

    const rows = expenses.map((e) => [
      escapeCsv(e.id),
      escapeCsv(e.tripId),
      escapeCsv(e.timestamp),
      escapeCsv(e.category),
      escapeCsv(e.title),
      escapeCsv(e.amount.toFixed(2)),
      escapeCsv(e.currency),
      escapeCsv(e.isRecoveryExpense ? 'YES' : 'NO'),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  /**
   * Export complete application state backup.
   */
  public static exportFullJsonBackup(state: any): string {
    const backup = {
      schemaVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      appName: 'RouteX',
      state,
    };
    return JSON.stringify(backup, null, 2);
  }

  /**
   * Client-side trigger file download.
   */
  public static downloadFile(content: string, filename: string, mimeType: string): void {
    if (typeof document === 'undefined') return;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

