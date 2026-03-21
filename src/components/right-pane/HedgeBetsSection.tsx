"use client";

import { useState } from "react";
import { useBettingStore } from "@/lib/store";
import { InfoModal } from "@/components/shared";
import {
  calculateHedgeBets,
  getHedgeCounts,
  type Selection as CalcSelection,
} from "@/lib/calculations";
import type { Selection as StoreSelection } from "@/types/betting";

// Quick-add amounts for hedge bets (smaller amounts)
const QUICK_ADD_AMOUNTS = [1, 2, 5, 10];

// Round to 2 decimal places
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Map store selection to calculations selection format
function mapToCalcSelection(
  selection: StoreSelection,
  stake: number
): CalcSelection {
  return {
    id: selection.id,
    event: `${selection.event.homeTeam} vs ${selection.event.awayTeam}`,
    sport: selection.event.sport,
    market: selection.market,
    outcomeSelected: selection.outcomeLabel,
    odds: selection.odds,
    stake: stake,
  };
}

interface HedgeBetsSectionProps {
  doublesStake: number;
  setDoublesStake: (value: number) => void;
  treblesStake: number;
  setTreblesStake: (value: number) => void;
  fourFoldsStake: number;
  setFourFoldsStake: (value: number) => void;
}

export function HedgeBetsSection({
  doublesStake,
  setDoublesStake,
  treblesStake,
  setTreblesStake,
  fourFoldsStake,
  setFourFoldsStake,
}: HedgeBetsSectionProps) {
  const selections = useBettingStore((state) => state.selections);
  const updateStake = useBettingStore((state) => state.updateStake);

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [singlesSetStake, setSinglesSetStake] = useState(0);
  const [showSinglesPopover, setShowSinglesPopover] = useState(false);

  // Get counts for each hedge type
  const counts = getHedgeCounts(selections.length);

  // Map selections to calculation format
  const calcSelections = selections.map((s) => mapToCalcSelection(s, 0));

  // Calculate hedge bets
  const hedgeResult = calculateHedgeBets(
    calcSelections,
    doublesStake,
    treblesStake,
    fourFoldsStake
  );

  const handleStakeChange = (
    setter: (value: number) => void,
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setter(round2(numValue));
    } else if (value === "") {
      setter(0);
    }
  };

  const handleQuickAdd = (
    currentStake: number,
    setter: (value: number) => void,
    amount: number
  ) => {
    setter(round2(currentStake + amount));
  };

  const handleApplyToAllSingles = () => {
    if (singlesSetStake > 0) {
      selections.forEach((selection) => {
        updateStake(selection.id, singlesSetStake);
      });
    }
  };

  // Calculate total hedge stake
  const totalHedgeStake = hedgeResult?.totalStake ?? 0;
  const hasAnyHedgeStake =
    doublesStake > 0 || treblesStake > 0 || fourFoldsStake > 0;

  return (
    <div>
      {/* Heading outside the card */}
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Hedge Bets
          </h3>
          <p className="mt-0.5 text-xs text-gray-400">
            Insurance against losses — win even if some selections lose
          </p>
        </div>
        <button
          onClick={() => setShowInfoModal(true)}
          className="mt-0.5 flex shrink-0 items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
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
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Why use hedge bets?
        </button>
      </div>

      {/* Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        {/* Singles Bulk Setter */}
        <div className="mb-4 rounded-md bg-gray-50 p-3">
          <div className="mb-2 flex items-center gap-1">
            <span className="text-xs font-medium text-gray-700">
              Singles (×{selections.length})
            </span>
            <div className="relative inline-block">
              <button
                onClick={() => setShowSinglesPopover((v) => !v)}
                className="text-gray-400 transition-colors hover:text-primary-600"
                aria-label="More information"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
              {showSinglesPopover && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSinglesPopover(false)}
                  />
                  <div className="absolute bottom-6 left-0 z-20 w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                    <p className="mb-1 text-xs font-medium text-gray-700">
                      Singles (×{selections.length})
                    </p>
                    <p className="text-xs leading-relaxed text-gray-500">
                      Set the same stake across all your single bets at once.
                      Changes apply immediately to all selections.
                    </p>
                    <p className="mt-2 border-t border-gray-100 pt-2 text-xs leading-relaxed text-gray-500">
                      Why hedge? Insurance against losses. Even if some games
                      lose, you can still win money from winning combinations.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="mb-2 text-xs text-gray-500">
            Set the same stake across all your single bets at once.
          </p>
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
                value={singlesSetStake || ""}
                onChange={(e) => {
                  const numValue = parseFloat(e.target.value);
                  if (!isNaN(numValue) && numValue >= 0) {
                    setSinglesSetStake(round2(numValue));
                  } else if (e.target.value === "") {
                    setSinglesSetStake(0);
                  }
                }}
                placeholder="0.00"
                className="w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-sm text-gray-900 tabular-nums placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>
            <button
              onClick={handleApplyToAllSingles}
              disabled={singlesSetStake <= 0}
              className="whitespace-nowrap rounded-md bg-primary-600 px-3 py-2 text-xs font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
            >
              Apply to all singles
            </button>
          </div>
          {singlesSetStake > 0 && (
            <p className="mt-2 text-xs tabular-nums text-gray-500">
              Total: €{(singlesSetStake * selections.length).toFixed(2)} (
              {selections.length} bets)
            </p>
          )}
        </div>

        {/* Hedge Groups */}
        <div className="space-y-4">
          {/* Doubles - always shown with 2+ selections */}
          {counts.doubles > 0 && (
            <HedgeGroupCard
              label="Doubles"
              count={counts.doubles}
              stake={doublesStake}
              setStake={setDoublesStake}
              minWin={hedgeResult?.doubles?.minWin ?? 0}
              maxWin={hedgeResult?.doubles?.maxWin ?? 0}
              popoverTitle="Doubles"
              popoverDescription="Every possible 2-game combination. Win if at least 2 selections win."
              onQuickAdd={(amount) =>
                handleQuickAdd(doublesStake, setDoublesStake, amount)
              }
              onStakeChange={(value) =>
                handleStakeChange(setDoublesStake, value)
              }
            />
          )}

          {/* Trebles - shown with 3+ selections */}
          {counts.trebles > 0 && (
            <HedgeGroupCard
              label="Trebles"
              count={counts.trebles}
              stake={treblesStake}
              setStake={setTreblesStake}
              minWin={hedgeResult?.trebles?.minWin ?? 0}
              maxWin={hedgeResult?.trebles?.maxWin ?? 0}
              popoverTitle="Trebles"
              popoverDescription="Every possible 3-game combination. Win if at least 3 selections win."
              onQuickAdd={(amount) =>
                handleQuickAdd(treblesStake, setTreblesStake, amount)
              }
              onStakeChange={(value) =>
                handleStakeChange(setTreblesStake, value)
              }
            />
          )}

          {/* 4-Folds - shown with 4+ selections */}
          {counts.fourFolds > 0 && (
            <HedgeGroupCard
              label="4-Folds"
              count={counts.fourFolds}
              stake={fourFoldsStake}
              setStake={setFourFoldsStake}
              minWin={hedgeResult?.fourFolds?.minWin ?? 0}
              maxWin={hedgeResult?.fourFolds?.maxWin ?? 0}
              popoverTitle="4-Folds"
              popoverDescription="Every possible 4-game combination. Win if at least 4 selections win."
              onQuickAdd={(amount) =>
                handleQuickAdd(fourFoldsStake, setFourFoldsStake, amount)
              }
              onStakeChange={(value) =>
                handleStakeChange(setFourFoldsStake, value)
              }
            />
          )}
        </div>

        {/* Grand Totals */}
        {hasAnyHedgeStake && hedgeResult && (
          <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Total hedge stake</span>
              <span className="font-semibold tabular-nums text-gray-900">
                €{totalHedgeStake.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Grand potential</span>
              <span className="font-semibold tabular-nums text-success-700">
                €{hedgeResult.grandMinWin.toFixed(2)} — €
                {hedgeResult.grandMaxWin.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Info Modal */}
        <InfoModal
          isOpen={showInfoModal}
          onClose={() => setShowInfoModal(false)}
          title="Why Use Hedge Bets?"
          description="Hedge bets are system-generated combinations that provide insurance against partial losses. Instead of needing all selections to win (like an accumulator), you bet on multiple combinations. If some selections lose, you can still win money from the combinations that include your winning selections. They cost more overall but reduce the all-or-nothing risk."
          prototypeNote="This is a prototype feature. In a production environment, hedge bet calculations would be verified with the backend before placing."
        />
      </div>
    </div>
  );
}

// Hedge Group Card Component
interface HedgeGroupCardProps {
  label: string;
  count: number;
  stake: number;
  setStake: (value: number) => void;
  minWin: number;
  maxWin: number;
  popoverTitle: string;
  popoverDescription: string;
  onQuickAdd: (amount: number) => void;
  onStakeChange: (value: string) => void;
}

function HedgeGroupCard({
  label,
  count,
  stake,
  minWin,
  maxWin,
  popoverTitle,
  popoverDescription,
  onQuickAdd,
  onStakeChange,
}: HedgeGroupCardProps) {
  const [showPopover, setShowPopover] = useState(false);

  return (
    <div className="rounded-md border border-gray-100 bg-gray-50/50 p-3">
      {/* Header */}
      <div className="mb-2 flex items-center gap-1">
        <span className="text-xs font-medium text-gray-700">
          {label} (×{count})
        </span>
        <div className="relative inline-block">
          <button
            onClick={() => setShowPopover((v) => !v)}
            className="text-gray-400 transition-colors hover:text-primary-600"
            aria-label="More information"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
          {showPopover && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowPopover(false)}
              />
              <div className="absolute bottom-6 left-0 z-20 w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                <p className="mb-1 text-xs font-medium text-gray-700">
                  {popoverTitle}
                </p>
                <p className="text-xs leading-relaxed text-gray-500">
                  {popoverDescription}
                </p>
                <p className="mt-2 border-t border-gray-100 pt-2 text-xs leading-relaxed text-gray-500">
                  Why hedge? Insurance against losses. Even if some games lose,
                  you can still win money from winning combinations.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stake Input */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">
          Stake per bet
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            €
          </span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.50"
            value={stake || ""}
            onChange={(e) => onStakeChange(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-md border border-gray-200 py-1.5 pl-6 pr-2 text-xs text-gray-900 tabular-nums placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
          />
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="mt-2 flex flex-wrap gap-1">
        {QUICK_ADD_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => onQuickAdd(amount)}
            className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-600 hover:border-primary-300 hover:bg-primary-50"
          >
            +{amount}
          </button>
        ))}
      </div>

      {/* Results */}
      {stake > 0 && (
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Total: €{(stake * count).toFixed(2)}
          </span>
          <span className="tabular-nums text-success-600">
            €{minWin.toFixed(2)} — €{maxWin.toFixed(2)}
          </span>
        </div>
      )}
      {stake <= 0 && (
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-gray-400">Total: €0.00</span>
          <span className="text-gray-400">—</span>
        </div>
      )}
    </div>
  );
}
