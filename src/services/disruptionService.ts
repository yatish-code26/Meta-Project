import { z } from 'zod';

export const ParsedDisruptionSchema = z.object({
  flightCode: z.string().default('LH 901'),
  delayMinutes: z.number().int().min(0).max(1440),
  disruptionType: z.enum(['DELAY', 'CANCELLATION', 'GATE_CHANGE', 'MISSED_CONNECTION']).default('DELAY'),
  rootCause: z.string().default('Operational Delay'),
  location: z.string().default('Frankfurt Airport (FRA)'),
  actionAdvice: z.string().default('Proceed to service desk.'),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('HIGH'),
  rawExtractedText: z.string().default(''),
});

export type ParsedDisruption = z.infer<typeof ParsedDisruptionSchema>;

export interface ParseResult {
  success: boolean;
  disruption?: ParsedDisruption;
  executionMode: 'LIVE_LLAMA' | 'OFFLINE_SIMULATION';
  error?: string;
}

/**
 * Client-side fallback extractor for full offline resilience.
 */
function localOfflineExtract(text: string): ParsedDisruption {
  const clean = text.trim();
  const flightMatch = clean.match(/\b([A-Z0-9]{2,3})\s?([0-9]{1,4})\b/i);
  const flightCode = flightMatch ? `${flightMatch[1].toUpperCase()} ${flightMatch[2]}` : 'LH 901';

  let delayMinutes = 75;
  const minsMatch = clean.match(/(\d+)\s*(?:m|min|mins|minutes)\b/i);
  const hoursMatch = clean.match(/(\d+)\s*(?:h|hr|hrs|hours)\b/i);

  if (minsMatch) {
    delayMinutes = parseInt(minsMatch[1], 10);
    if (hoursMatch) delayMinutes += parseInt(hoursMatch[1], 10) * 60;
  } else if (hoursMatch) {
    delayMinutes = parseInt(hoursMatch[1], 10) * 60;
  }

  let rootCause = 'Operational Delay';
  if (/weather|fog|snow|storm|wind/i.test(clean)) {
    rootCause = 'Severe Weather / De-icing Hold';
  } else if (/air traffic|atc|slot/i.test(clean)) {
    rootCause = 'Air Traffic Control (ATC) Flow Restriction';
  } else if (/mechanical|maintenance|aircraft/i.test(clean)) {
    rootCause = 'Aircraft Mechanical Inspection';
  }

  return {
    flightCode,
    delayMinutes: Math.min(1440, Math.max(0, delayMinutes)),
    disruptionType: delayMinutes > 45 ? 'MISSED_CONNECTION' : 'DELAY',
    rootCause,
    location: 'Frankfurt Airport (FRA)',
    actionAdvice: 'Report to transit service counter B22.',
    confidence: flightMatch && (minsMatch || hoursMatch) ? 'HIGH' : 'MEDIUM',
    rawExtractedText: clean.slice(0, 300),
  };
}

export async function parseDisruptionText(text: string): Promise<ParseResult> {
  if (!text || !text.trim()) {
    return {
      success: false,
      error: 'Please paste the disruption message text.',
      executionMode: 'OFFLINE_SIMULATION',
    };
  }

  // 1. Try calling the backend server
  try {
    const res = await fetch('/api/disruption/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.disruption) {
        const validated = ParsedDisruptionSchema.safeParse(data.disruption);
        if (validated.success) {
          return {
            success: true,
            disruption: validated.data,
            executionMode: data.executionMode || 'LIVE_LLAMA',
          };
        }
      }
      return {
        success: false,
        error: data.error || 'Server could not validate disruption schema.',
        executionMode: 'OFFLINE_SIMULATION',
      };
    }
  } catch {
    // Backend server offline or fetch blocked; fallback to client-side extractor
  }

  // 2. Client-side deterministic fallback
  try {
    const fallback = localOfflineExtract(text);
    return {
      success: true,
      disruption: fallback,
      executionMode: 'OFFLINE_SIMULATION',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to parse disruption text.',
      executionMode: 'OFFLINE_SIMULATION',
    };
  }
}

