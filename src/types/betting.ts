/**
 * TypeScript interfaces for a Finnish iGaming betting slip application.
 * Defines core data structures for events, selections, bets, and betting history.
 */

/**
 * Represents the score of a match with home and away team goals.
 */
export interface Score {
  home: number;
  away: number;
  /** Match clock (e.g. football) — present on live events in data */
  time?: string;
  /** Game period (e.g. ice hockey) — present on live events in data */
  period?: string;
}

/**
 * Represents the 1X2 market odds (1 = home win, X = draw, 2 = away win).
 */
export interface Odds1X2 {
  "1": number;
  X: number;
  "2": number;
}

/** Two-way winner odds (e.g. ice hockey / US sports). */
export interface MoneylineOdds {
  home: number;
  away: number;
}

/** Over / under 2.5 goals (or equivalent) totals market. */
export interface OverUnderOdds {
  over25: number;
  under25: number;
}

/**
 * Maps market identifiers to their odds structure.
 * Events may include any combination present in feed / seed data.
 */
export interface Markets {
  "1X2"?: Odds1X2;
  moneyline?: MoneylineOdds;
  OverUnder?: OverUnderOdds;
}

/**
 * Represents a sporting event available for betting.
 * Contains event details, timing, live status, and available markets with odds.
 */
export interface Event {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string; // ISO 8601 date string
  isLive: boolean;
  score?: Score;
  markets: Markets;
}

/**
 * Represents a single outcome within a market (e.g., "Arsenal to win" at 2.10 odds).
 */
export interface Outcome {
  id: string;
  name: string;
  odds: number;
}

/**
 * Represents a betting market with its outcomes and odds.
 */
export interface Market {
  id: string;
  name: string;
  outcomes: Outcome[];
}

/**
 * Represents a user's bet selection on the betting slip.
 * Links an event, market, and chosen outcome with stake and odds.
 */
export interface Selection {
  id: string;
  event: Event;
  market: string; // e.g. "1X2"
  outcome: string; // e.g. "1"
  outcomeLabel: string; // e.g. "Arsenal to win"
  odds: number;
  stake?: number;
}

/**
 * Represents the result status of a settled or unsettled bet.
 */
export type BetOutcome = "won" | "lost" | "pending";

/**
 * Represents a single bet in the betting history.
 * Records the bet details and its outcome after settlement.
 */
export interface Bet {
  id: string;
  timestamp: string; // ISO 8601 date string
  event: string;
  sport: string;
  market: string;
  outcome_selected: string;
  odds: number;
  stake: number;
  outcome: BetOutcome;
  winnings?: number;
  profit?: number;
}

/**
 * Summary statistics for a user's betting history.
 * Provides aggregate totals and performance metrics.
 */
export interface BettingHistorySummary {
  total_staked: number;
  total_won: number;
  net_result: number;
  return_rate: number;
}

/**
 * Represents the user's complete betting history with all settled bets and summary statistics.
 */
export interface BettingHistory {
  bets: Bet[];
  summary: BettingHistorySummary;
}

/**
 * Represents the current betting slip with all selections before placing a bet.
 */
export interface BetSlip {
  selections: Selection[];
}
