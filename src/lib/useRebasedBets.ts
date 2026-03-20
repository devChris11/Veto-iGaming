"use client";

import { useMemo } from "react";
import type { Bet } from "@/lib/metrics";
import { getSessionBets } from "@/lib/sessionBets";

/**
 * Rebased betting history, stable for the browser session after first read.
 * For Server Components, RSC routes, or non-React code, use
 * `getSessionBets` from `@/lib/sessionBets` (same cache in a given runtime).
 */
export function useRebasedBets(): Bet[] {
  return useMemo(() => getSessionBets(), []);
}
