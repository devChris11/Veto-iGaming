"use client";

import { useRef } from "react";
import { useBettingStore } from "@/lib/store";
import { useToast } from "@/components/shared";
import type { Selection } from "@/types/betting";

// Quick-add amounts
const QUICK_ADD_AMOUNTS = [5, 10, 25, 50, 100];

// Round to 2 decimal places
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Format time in Finnish locale
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("fi-FI", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SinglesSection() {
  const selections = useBettingStore((state) => state.selections);
  const removeSelection = useBettingStore((state) => state.removeSelection);
  const addSelection = useBettingStore((state) => state.addSelection);
  const updateStake = useBettingStore((state) => state.updateStake);
  const { showToast } = useToast();

  // Store removed selection for undo
  const removedSelectionRef = useRef<Selection | null>(null);

  const handleRemove = (selection: Selection) => {
    // Store the selection for undo
    removedSelectionRef.current = selection;

    // Remove immediately
    removeSelection(selection.id);

    // Show toast with undo action
    showToast(`${selection.outcomeLabel} removed`, "info", {
      label: "Undo",
      onClick: () => {
        if (removedSelectionRef.current) {
          addSelection(removedSelectionRef.current);
          removedSelectionRef.current = null;
        }
      },
    });
  };

  const handleStakeChange = (id: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      updateStake(id, round2(numValue));
    } else if (value === "") {
      updateStake(id, 0);
    }
  };

  const handleQuickAdd = (id: string, currentStake: number, amount: number) => {
    updateStake(id, round2(currentStake + amount));
  };

  return (
    <div>
      {/* Section Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Singles
        </h3>
        <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
          {selections.length}
        </span>
      </div>

      {/* Selection Cards */}
      <div className="space-y-3">
        {selections.map((selection) => {
          const stake = selection.stake ?? 0;
          const potentialReturn =
            stake > 0 ? round2(stake * selection.odds) : 0;

          return (
            <div
              key={selection.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              {/* Header Row: League + Remove */}
              <div className="mb-2 flex items-start justify-between">
                <span className="text-xs font-medium text-gray-500">
                  {selection.event.league}
                </span>
                <button
                  onClick={() => handleRemove(selection)}
                  className="text-gray-400 hover:text-error-600"
                  aria-label={`Remove ${selection.outcomeLabel}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Teams + Time */}
              <p className="text-sm font-medium text-gray-900">
                {selection.event.homeTeam} vs {selection.event.awayTeam}{" "}
                <span className="text-gray-400">
                  • {formatTime(selection.event.startTime)}
                </span>
              </p>

              {/* Outcome + Market + Odds */}
              <div className="mt-1 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selection.outcomeLabel}{" "}
                  <span className="text-gray-400">• {selection.market}</span>
                </p>
                <span className="font-semibold tabular-nums text-primary-600">
                  {selection.odds.toFixed(2)}
                </span>
              </div>

              {/* Stake Input + Quick Add */}
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Stake
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      €
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.50"
                      value={stake || ""}
                      onChange={(e) =>
                        handleStakeChange(selection.id, e.target.value)
                      }
                      placeholder="0.00"
                      className="w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-sm text-gray-900 tabular-nums placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                    />
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {QUICK_ADD_AMOUNTS.map((amount) => (
                      <button
                        key={amount}
                        onClick={() =>
                          handleQuickAdd(selection.id, stake, amount)
                        }
                        className="rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-primary-300 hover:bg-primary-50"
                      >
                        +{amount}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Returns */}
              {stake > 0 && (
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-sm text-gray-500">Returns</span>
                  <span className="font-semibold tabular-nums text-success-700">
                    €{potentialReturn.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
