// ============================================================
// VETO — Dynamic Date Rebase Utility
// src/lib/dateRebase.ts
// ============================================================
//
// WHY THIS EXISTS:
// history.json contains static timestamps. Without rebasing,
// the "last 7 days" and "last 30 days" calculation windows
// drift away from the data as real time passes — causing
// metrics to return hasData: false and the test suite to fail.
//
// HOW IT WORKS:
// At runtime, we find the latest timestamp in the raw data
// and compute an offset so that bet lands on yesterday.
// Every other timestamp shifts by the same offset, preserving
// all relative spacing between bets (streaks, clusters, etc).
//
// RESULT:
// - Yesterday always has the most recent bets
// - Last 7 days always has ~12-15 settled bets
// - Last 30 days always has ~40-50 settled bets
// - All patterns (escalating stakes, rapid cluster, etc) intact
// ============================================================

import type { Bet } from "@/lib/metrics";

// ---- types ----

interface RawBet {
  id: string;
  timestamp: string;
  event: string;
  sport: string;
  market: string;
  outcome_selected: string;
  odds: number;
  stake: number;
  outcome: "won" | "lost";
  winnings: number;
  profit: number;
}

interface HistoryJSON {
  bets: RawBet[];
  summary: {
    total_staked: number;
    total_won: number;
    net_result: number;
    return_rate: number;
  };
}

// ---- core rebase ----

/**
 * Shifts all bet timestamps so the most recent bet lands on yesterday.
 * All relative spacing between bets is preserved exactly.
 */
export function rebaseBetDates(rawBets: RawBet[]): Bet[] {
  if (rawBets.length === 0) return [];

  // Find the latest timestamp in the static data
  const latestMs = Math.max(
    ...rawBets.map((b) => new Date(b.timestamp).getTime())
  );

  // Target: yesterday at the same time-of-day as the latest static bet
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Offset in milliseconds to apply to every timestamp
  const offsetMs = yesterday.getTime() - latestMs;

  return rawBets.map((b) => {
    const originalMs = new Date(b.timestamp).getTime();
    const rebased = new Date(originalMs + offsetMs);

    return {
      id: b.id,
      timestamp: rebased.toISOString(),
      event: b.event,
      sport: b.sport,
      market: b.market,
      outcome_selected: b.outcome_selected,
      odds: b.odds,
      stake: b.stake,
      outcome: b.outcome,
      winnings: b.winnings,
      profit: b.profit,
    };
  });
}

/**
 * Loads history.json and returns bets with dynamically rebased timestamps.
 * Call this once per session — the result is stable for the lifetime of
 * the session since yesterday doesn't change mid-session.
 */
export function getRebasedBets(historyData: HistoryJSON): Bet[] {
  return rebaseBetDates(historyData.bets as RawBet[]);
}

// ---- debug helper (dev only) ----

/**
 * Returns a summary of the rebased date distribution.
 * Useful for verifying windows in the test page.
 */
export function getRebaseDebugInfo(bets: Bet[]): {
  earliestBet: string;
  latestBet: string;
  spanDays: number;
  last7DaysCount: number;
  last30DaysCount: number;
  totalBets: number;
} {
  if (bets.length === 0) {
    return {
      earliestBet: "—",
      latestBet: "—",
      spanDays: 0,
      last7DaysCount: 0,
      last30DaysCount: 0,
      totalBets: 0,
    };
  }

  const sorted = [...bets].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const earliest = new Date(sorted[0].timestamp);
  const latest = new Date(sorted[sorted.length - 1].timestamp);
  const spanDays = Math.round(
    (latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24)
  );

  const now = new Date();

  const cutoff7 = new Date(now);
  cutoff7.setDate(cutoff7.getDate() - 7);
  cutoff7.setHours(0, 0, 0, 0);

  const cutoff30 = new Date(now);
  cutoff30.setDate(cutoff30.getDate() - 30);
  cutoff30.setHours(0, 0, 0, 0);

  const last7DaysCount = bets.filter(
    (b) => new Date(b.timestamp) >= cutoff7
  ).length;

  const last30DaysCount = bets.filter(
    (b) => new Date(b.timestamp) >= cutoff30
  ).length;

  return {
    earliestBet: earliest.toISOString().slice(0, 10),
    latestBet: latest.toISOString().slice(0, 10),
    spanDays,
    last7DaysCount,
    last30DaysCount,
    totalBets: bets.length,
  };
}
