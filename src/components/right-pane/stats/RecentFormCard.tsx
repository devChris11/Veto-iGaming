"use client";

import { useMemo } from "react";
import { Activity } from "lucide-react";
import { useRebasedBets } from "@/lib/useRebasedBets";
import { calculateRecentForm } from "@/lib/metrics";

export function RecentFormCard() {
  const bets = useRebasedBets();
  const result = useMemo(() => calculateRecentForm(bets), [bets]);

  const getSecondaryText = () => {
    if (result.hasStreak && result.streakType === "W") {
      return (
        <span className="text-success-600">
          🔥 {result.streakLength}-game win streak
        </span>
      );
    }
    if (result.hasStreak && result.streakType === "L") {
      return (
        <span className="text-warning-600">
          ⚠️ {result.streakLength}-game losing streak
        </span>
      );
    }
    return (
      <span className="text-gray-600">
        {result.winsInLast5} of {result.form.length} won
      </span>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-purple-50 p-4">
      {/* Watermark */}
      <div className="absolute -right-3 -top-3 text-purple-300 opacity-20">
        <Activity className="h-24 w-24" />
      </div>

      {/* Label */}
      <div className="relative mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-purple-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-purple-600">
            Recent Form
          </span>
        </div>
        <span className="text-xs text-gray-500">Last 5 bets</span>
      </div>

      {result.hasData ? (
        <>
          {/* Form pills */}
          <div className="relative flex gap-1.5">
            {result.form.map((outcome, idx) => (
              <div
                key={idx}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold ${
                  outcome === "W"
                    ? "bg-success-100 text-success-700"
                    : "bg-error-100 text-error-700"
                }`}
              >
                {outcome}
              </div>
            ))}
            {Array.from({ length: 5 - result.form.length }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-purple-200 text-sm text-purple-300"
              >
                -
              </div>
            ))}
          </div>
          <p className="relative mt-2 text-sm">{getSecondaryText()}</p>
        </>
      ) : (
        <p className="relative text-sm text-gray-500">No settled bets yet</p>
      )}
    </div>
  );
}
