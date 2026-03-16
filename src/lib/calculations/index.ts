/**
 * Betting calculation functions for singles, accumulators, and hedge bets.
 */

/**
 * Calculate potential winnings for a single bet.
 * @param stake - The amount wagered
 * @param odds - Decimal odds for the selection
 * @returns Potential winnings (stake × odds)
 */
export function calculateSingleWin(stake: number, odds: number): number {
  return stake * odds;
}

/**
 * Calculate combined odds for an accumulator by multiplying all individual odds.
 * @param odds - Array of decimal odds for each leg
 * @returns Combined accumulator odds
 */
export function calculateAccumulatorOdds(odds: number[]): number {
  return odds.reduce((acc, od) => acc * od, 1);
}

/**
 * Calculate potential winnings for an accumulator bet.
 * @param stake - The amount wagered
 * @param combinedOdds - Combined odds from calculateAccumulatorOdds
 * @returns Potential winnings (stake × combinedOdds)
 */
export function calculateAccumulatorWin(
  stake: number,
  combinedOdds: number
): number {
  return stake * combinedOdds;
}

// Additional calculation functions will be added in Milestone 2B
