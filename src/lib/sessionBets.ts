import historyData from "@/data/history.json";
import { getRebasedBets } from "@/lib/dateRebase";
import type { Bet } from "@/lib/metrics";

/** Computed once per JS runtime (page load); stable until full refresh. */
let sessionBets: Bet[] | null = null;

/**
 * Rebases history.json timestamps for metrics and UI.
 * Use from Server Components and non-React code.
 * Client components should prefer `useRebasedBets` from `./useRebasedBets`.
 */
export function getSessionBets(): Bet[] {
  if (!sessionBets) {
    sessionBets = getRebasedBets(
      historyData as Parameters<typeof getRebasedBets>[0]
    );
  }
  return sessionBets;
}
