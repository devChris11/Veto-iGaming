"use client";

import { useBettingStore } from "@/lib/store";

interface MobileTabBarProps {
  activeTab: "browse" | "coupon";
  onTabChange: (tab: "browse" | "coupon") => void;
}

export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  const { selections } = useBettingStore();

  const selectionCount = selections.length;
  const totalStake = selections.reduce((sum, s) => sum + (s.stake ?? 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fi-FI", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <div className="border-t border-gray-200 bg-white shadow-lg">
      <div className="flex">
        {/* Browse Tab */}
        <button
          onClick={() => onTabChange("browse")}
          className={`flex flex-1 items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
            activeTab === "browse"
              ? "text-primary-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {activeTab === "browse" && (
            <span className="h-2 w-2 rounded-full bg-primary-600" />
          )}
          <span>Browse</span>
        </button>

        {/* Coupon Tab */}
        <button
          onClick={() => onTabChange("coupon")}
          className={`flex flex-1 items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
            activeTab === "coupon"
              ? "text-primary-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {activeTab === "coupon" && (
            <span className="h-2 w-2 rounded-full bg-primary-600" />
          )}
          <span>
            Coupon
            {selectionCount > 0 && (
              <span className="ml-1 tabular-nums">
                ({selectionCount}) {"\u2022"} {formatCurrency(totalStake)}
              </span>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
