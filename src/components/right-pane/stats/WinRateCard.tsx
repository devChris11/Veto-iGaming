"use client";

import { useMemo } from "react";
import { BarChart2, TrendingUp, TrendingDown } from "lucide-react";
import { useRebasedBets } from "@/lib/useRebasedBets";
import { calculateWinRate } from "@/lib/metrics";

export function WinRateCard() {
  const bets = useRebasedBets();
  const result = useMemo(() => calculateWinRate(bets), [bets]);

  const deltaData = useMemo(() => {
    const now = new Date();

    const last7Start = new Date(now);
    last7Start.setDate(last7Start.getDate() - 7);
    last7Start.setHours(0, 0, 0, 0);

    const prev7Start = new Date(now);
    prev7Start.setDate(prev7Start.getDate() - 14);
    prev7Start.setHours(0, 0, 0, 0);

    const settled = bets.filter((b) => b.outcome !== "pending");

    const last7 = settled.filter((b) => new Date(b.timestamp) >= last7Start);
    const prev7 = settled.filter(
      (b) =>
        new Date(b.timestamp) >= prev7Start &&
        new Date(b.timestamp) < last7Start
    );

    const last7Rate =
      last7.length > 0
        ? (last7.filter((b) => b.outcome === "won").length / last7.length) * 100
        : null;

    const prev7Rate =
      prev7.length > 0
        ? (prev7.filter((b) => b.outcome === "won").length / prev7.length) * 100
        : null;

    if (last7Rate === null || prev7Rate === null) return null;

    return {
      delta: Math.round((last7Rate - prev7Rate) * 10) / 10,
      direction: last7Rate >= prev7Rate ? "up" : "down",
    };
  }, [bets]);

  if (!result.hasData) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-blue-50 p-4">
        <div className="absolute -right-3 -top-3 text-blue-300 opacity-20">
          <BarChart2 className="h-24 w-24" />
        </div>
        <div className="relative mb-2 flex items-center gap-1.5">
          <BarChart2 className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Win Rate
          </span>
        </div>
        <p className="relative text-sm text-gray-500">No data yet</p>
        <p className="relative text-xs text-gray-500">
          Place bets to see your win rate
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl bg-blue-50 p-4">
      {/* Watermark icon */}
      <div className="absolute -right-3 -top-3 text-blue-300 opacity-20">
        <BarChart2 className="h-24 w-24" />
      </div>

      {/* Label row */}
      <div className="relative mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BarChart2 className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Win Rate
          </span>
        </div>
        <span className="text-xs text-gray-500">Last 30 days</span>
      </div>

      {/* Big number */}
      <p className="relative text-3xl font-bold tabular-nums text-gray-900">
        {result.winRate.toFixed(1)}%
      </p>

      {/* Secondary */}
      <p className="relative mt-0.5 text-xs text-gray-600">
        {result.totalWins} wins / {result.totalBets} bets
      </p>

      {/* Week-over-week delta */}
      {deltaData !== null && (
        <div
          className={`mt-2 flex items-center gap-1 text-xs font-medium ${
            deltaData.direction === "up" ? "text-success-600" : "text-error-600"
          }`}
        >
          {deltaData.direction === "up" ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          <span>
            {deltaData.direction === "up" ? "+" : ""}
            {deltaData.delta.toFixed(1)}% vs last week
          </span>
        </div>
      )}
    </div>
  );
}
