"use client";

import { WinRateCard } from "./WinRateCard";
import { ROICard } from "./ROICard";
import { BestMarketCard } from "./BestMarketCard";
import { RecentFormCard } from "./RecentFormCard";

export function TrendCards() {
  return (
    <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">
      <WinRateCard />
      <ROICard />
      <BestMarketCard />
      <RecentFormCard />
    </div>
  );
}
