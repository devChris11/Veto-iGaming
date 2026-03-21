"use client";

import { useState } from "react";
import { useBettingStore } from "@/lib/store";
import { useToast } from "@/components/shared";
import { ZeroStakeWarningModal } from "./ZeroStakeWarningModal";
import {
  calculateHedgeBets,
  calculateAccumulator,
  getHedgeCounts,
  type Selection as CalcSelection,
} from "@/lib/calculations";
import type { Selection as StoreSelection } from "@/types/betting";

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

interface StickyFooterProps {
  accStake: number;
  doublesStake: number;
  treblesStake: number;
  fourFoldsStake: number;
  resetStakes: () => void;
}

export function StickyFooter({
  accStake,
  doublesStake,
  treblesStake,
  fourFoldsStake,
  resetStakes,
}: StickyFooterProps) {
  const selections = useBettingStore((state) => state.selections);
  const clearSelections = useBettingStore((state) => state.clearSelections);
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showZeroStakeModal, setShowZeroStakeModal] = useState(false);

  // Calculate totals
  const counts = getHedgeCounts(selections.length);

  // Singles total
  const singlesTotal = selections.reduce((sum, s) => sum + (s.stake ?? 0), 0);

  // Total stake
  const totalStake = round2(
    singlesTotal +
      accStake +
      doublesStake * counts.doubles +
      treblesStake * counts.trebles +
      fourFoldsStake * counts.fourFolds
  );

  // Calculate potential win
  const calcPotentialWin = () => {
    // Singles potential
    const singlesPotential = selections.reduce(
      (sum, s) => sum + (s.stake ?? 0) * s.odds,
      0
    );

    // Accumulator potential
    let accPotential = 0;
    if (accStake > 0 && selections.length >= 2) {
      const calcSelections = selections.map((s) =>
        mapToCalcSelection(s, accStake)
      );
      const accResult = calculateAccumulator(calcSelections, accStake);
      accPotential = accResult?.potentialWin ?? 0;
    }

    // Hedge potential (max)
    let hedgePotential = 0;
    if (selections.length >= 2) {
      const calcSelections = selections.map((s) => mapToCalcSelection(s, 0));
      const hedgeResult = calculateHedgeBets(
        calcSelections,
        doublesStake,
        treblesStake,
        fourFoldsStake
      );
      hedgePotential = hedgeResult?.grandMaxWin ?? 0;
    }

    return round2(singlesPotential + accPotential + hedgePotential);
  };

  const potentialWin = calcPotentialWin();

  // Selections with no single stake set
  const zeroStakeSelections = selections
    .filter((s) => !s.stake || s.stake === 0)
    .map((s) => ({
      outcomeLabel: s.outcomeLabel,
      event: s.event.awayTeam
        ? `${s.event.homeTeam} vs ${s.event.awayTeam}`
        : s.event.homeTeam,
    }));

  // Warn only when SOME (not all) singles are zero-staked
  const hasZeroStakeSingles =
    zeroStakeSelections.length > 0 &&
    zeroStakeSelections.length < selections.length;

  // Button states
  const isDisabled = selections.length === 0 || totalStake === 0;
  const isWarning = totalStake > 65;

  const executePlaceBet = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    clearSelections();
    resetStakes();
    setIsLoading(false);
    showToast("Bet placed successfully! Good luck!", "success");
  };

  const handlePlaceBet = async () => {
    if (isDisabled || isLoading) return;

    if (hasZeroStakeSingles) {
      setShowZeroStakeModal(true);
      return;
    }

    await executePlaceBet();
  };

  const handleConfirmPlaceAnyway = async () => {
    setShowZeroStakeModal(false);
    await executePlaceBet();
  };

  // Determine button styles
  const getButtonClasses = () => {
    if (isLoading) {
      return "bg-primary-600 opacity-80 cursor-not-allowed";
    }
    if (isDisabled) {
      return "bg-gray-200 cursor-not-allowed";
    }
    if (isWarning) {
      return "bg-warning-500 hover:bg-warning-600 active:bg-warning-700";
    }
    return "bg-primary-600 hover:bg-primary-700 active:bg-primary-800";
  };

  const getTextClasses = () => {
    if (isDisabled) {
      return "text-gray-500";
    }
    return "text-white";
  };

  return (
    <div className="sticky bottom-0 border-t border-gray-200 bg-white p-4 shadow-xl">
      {/* Stake + potential row above the button */}
      {!isLoading && selections.length > 0 && totalStake > 0 && (
        <div className="mb-2 flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold tabular-nums text-gray-900">
            Total stake: €{totalStake.toFixed(2)}
          </span>
          <span className="text-sm font-medium tabular-nums text-success-700">
            Potential win: €{potentialWin.toFixed(2)}
          </span>
        </div>
      )}

      <button
        onClick={handlePlaceBet}
        disabled={isDisabled || isLoading}
        className={`w-full rounded-lg py-4 text-sm font-semibold transition-colors ${getButtonClasses()} ${getTextClasses()}`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            PLACING BET...
          </span>
        ) : (
          "PLACE BETS"
        )}
      </button>

      <ZeroStakeWarningModal
        isOpen={showZeroStakeModal}
        onClose={() => setShowZeroStakeModal(false)}
        onConfirm={handleConfirmPlaceAnyway}
        zeroStakeSelections={zeroStakeSelections}
      />
    </div>
  );
}
