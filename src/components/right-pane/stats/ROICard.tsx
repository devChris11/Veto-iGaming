"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useRebasedBets } from "@/lib/useRebasedBets";
import { calculateROI } from "@/lib/metrics";

const getSecondaryText = (netResult: number) => {
  if (netResult > 0) return `Gained €${netResult.toFixed(2)}`;
  if (netResult < 0) return `Lost €${Math.abs(netResult).toFixed(2)}`;
  return "Break even";
};

export function ROICard() {
  const bets = useRebasedBets();
  const result = useMemo(() => calculateROI(bets), [bets]);

  if (!result.hasData) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-gray-50 p-4">
        <div className="absolute -right-3 -top-3 text-gray-300 opacity-20">
          <TrendingUp className="h-24 w-24" />
        </div>
        <div className="relative mb-2 flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            ROI
          </span>
        </div>
        <p className="relative text-sm text-gray-500">No data yet</p>
        <p className="relative text-xs text-gray-500">
          Place bets to see your ROI
        </p>
      </div>
    );
  }

  const isPositive = result.roi > 0;
  const isNegative = result.roi < 0;

  const cardBg = isPositive
    ? "bg-green-50"
    : isNegative
      ? "bg-red-50"
      : "bg-gray-50";
  const labelColor = isPositive
    ? "text-success-600"
    : isNegative
      ? "text-error-600"
      : "text-gray-500";
  const iconColor = isPositive
    ? "text-green-200"
    : isNegative
      ? "text-red-200"
      : "text-gray-200";
  const bigNumberColor = isPositive
    ? "text-success-600"
    : isNegative
      ? "text-error-600"
      : "text-gray-600";

  const WatermarkIcon = isNegative ? TrendingDown : TrendingUp;
  const SmallIcon = isNegative ? TrendingDown : TrendingUp;

  return (
    <div className={`relative overflow-hidden rounded-xl ${cardBg} p-4`}>
      {/* Watermark */}
      <div className={`absolute -right-3 -top-3 ${iconColor} opacity-20`}>
        <WatermarkIcon className="h-24 w-24" />
      </div>

      {/* Label */}
      <div className="relative mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <SmallIcon className={`h-3.5 w-3.5 ${labelColor}`} />
          <span
            className={`text-xs font-semibold uppercase tracking-wide ${labelColor}`}
          >
            ROI
          </span>
        </div>
        <span className="text-xs text-gray-500">Last 30 days</span>
      </div>

      {/* Big number */}
      <p
        className={`relative text-3xl font-bold tabular-nums ${bigNumberColor}`}
      >
        {isPositive ? "+" : ""}
        {result.roi.toFixed(1)}%
      </p>

      {/* Secondary */}
      <p className={`relative mt-0.5 text-sm ${bigNumberColor}`}>
        {getSecondaryText(result.netResult)}
      </p>
    </div>
  );
}
