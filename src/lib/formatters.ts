/**
 * Standard duration and label formatters for RouteX.
 * Enforces rule: "Format durations as '50 min' / '1 h 20 min', never '0.83h'."
 */

export function formatDurationMinutes(totalMinutes: number): string {
  const rounded = Math.round(totalMinutes);
  if (rounded < 60) {
    return `${rounded} min`;
  }
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  if (mins === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${mins} min`;
}

export function formatDurationHours(decimalHours: number): string {
  const totalMinutes = Math.round(decimalHours * 60);
  return formatDurationMinutes(totalMinutes);
}

/**
 * Format timestamp into 12-hour or 24-hour time based on preference
 */
export function formatTimeDisplay(isoString: string, use24Hour: boolean = true): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !use24Hour,
    });
  } catch {
    return isoString;
  }
}

