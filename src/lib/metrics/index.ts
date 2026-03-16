/**
 * Metrics calculation functions for win rate, ROI, best market, and recent form.
 */

import type { Bet } from "@/types/betting";

/**
 * Calculate win rate percentage over the last N days.
 * @param bets - Array of settled bets
 * @param periodDays - Number of days to consider
 * @returns Win rate as a percentage (0-100)
 */
export function calculateWinRate(bets: Bet[], periodDays: number): number {
  // TODO: Implement in Milestone 2B
  return 0;
}

/**
 * Calculate Return on Investment percentage over the last N days.
 * @param bets - Array of settled bets
 * @param periodDays - Number of days to consider
 * @returns ROI as a percentage
 */
export function calculateROI(bets: Bet[], periodDays: number): number {
  // TODO: Implement in Milestone 2B
  return 0;
}

// Additional metric functions (Best Market, Recent Form) will be added in Milestone 2B
