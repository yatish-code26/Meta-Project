/**
 * connectionRule.ts
 * =================
 * THE ONE connection rule used everywhere in RouteX.
 *
 * DEFINITION:
 *   A connection is MISSED when the physical transfer window
 *   (onwardDeparture_utc - actualTouchdown_utc) < airportMCT_minutes.
 *
 *   Gate closure = MCT minutes before scheduled departure. Passengers who
 *   touch down with less than mctMinutes available before the next departure
 *   cannot reach the gate before boarding locks. Both times MUST be UTC
 *   Date objects (or equivalent numeric millisecond values) — never local
 *   clock strings with hardcoded offsets.
 *
 * WHY ONE RULE:
 *   Previously the engine (DeterministicConstraintEngine Gate 4) and the
 *   hook (useRecoveryTwin disruptionCalc) each computed feasibility with
 *   slightly different formulas and different inputs. This caused the engine
 *   to show Option A as QUALIFIED even when the delay scrubber had pushed
 *   the actual touchdown past LH 714's departure time. This file is the
 *   single source of truth imported by both.
 */

/**
 * Returns true when the traveller physically CANNOT make the connection.
 *
 * @param touchdownUtc   UTC instant the inbound aircraft wheels touch runway
 * @param departureUtc   UTC instant the onward flight departs (doors close mctMinutes before this)
 * @param mctMinutes     Airport minimum connection time in minutes (includes deplaning + transit + gate)
 */
export function isConnectionMissed(
  touchdownUtc: Date,
  departureUtc: Date,
  mctMinutes: number
): boolean {
  return connectionMarginMinutes(touchdownUtc, departureUtc, mctMinutes) < 0;
}

/**
 * Returns the margin in minutes above (+) or below (-) MCT.
 * Negative means the connection is physically impossible.
 *
 * margin = (departure - touchdown) - mct
 *
 * @param touchdownUtc   UTC instant the inbound aircraft touches down
 * @param departureUtc   UTC instant the onward flight departs
 * @param mctMinutes     Airport MCT in minutes
 */
export function connectionMarginMinutes(
  touchdownUtc: Date,
  departureUtc: Date,
  mctMinutes: number
): number {
  const windowMs = departureUtc.getTime() - touchdownUtc.getTime();
  return Math.floor(windowMs / 60_000) - mctMinutes;
}

