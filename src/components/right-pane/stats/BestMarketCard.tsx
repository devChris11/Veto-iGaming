"use client";

import { useMemo } from "react";
import { Trophy } from "lucide-react";
import { useRebasedBets } from "@/lib/useRebasedBets";
import { calculateBestMarket } from "@/lib/metrics";

export function BestMarketCard() {
  const bets = useRebasedBets();
  const result = useMemo(() => calculateBestMarket(bets), [bets]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-amber-50 p-4">
      {/* Watermark */}
      <div className="absolute -right-3 -top-3 text-amber-300 opacity-20">
        <Trophy className="h-24 w-24" />
      </div>

      {/* Label */}
      <div className="relative mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
            Best Market
          </span>
        </div>
        <span className="text-xs text-gray-500">Last 7 days</span>
      </div>

      {result.hasData ? (
        <>
          <p className="relative text-2xl font-bold text-gray-900">
            {result.sport}
          </p>
          <p className="relative mt-0.5 text-xs text-gray-600">
            {result.winRate.toFixed(1)}% win rate · {result.totalBets} bets
          </p>
        </>
      ) : (
        <>
          <p className="relative text-sm text-gray-500">Not enough data</p>
          <p className="relative text-xs text-gray-500">
            Need 5+ bets in one sport (last 7 days)
          </p>
        </>
      )}
    </div>
  );
}
