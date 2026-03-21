"use client";

import { useEffect } from "react";
import { useBettingStore } from "@/lib/store";
import { SinglesSection } from "./SinglesSection";
import { AccumulatorSection } from "./AccumulatorSection";
import { HedgeBetsSection } from "./HedgeBetsSection";

interface BettingSlipProps {
  accStake: number;
  setAccStake: (value: number) => void;
  doublesStake: number;
  setDoublesStake: (value: number) => void;
  treblesStake: number;
  setTreblesStake: (value: number) => void;
  fourFoldsStake: number;
  setFourFoldsStake: (value: number) => void;
}

export function BettingSlip({
  accStake,
  setAccStake,
  doublesStake,
  setDoublesStake,
  treblesStake,
  setTreblesStake,
  fourFoldsStake,
  setFourFoldsStake,
}: BettingSlipProps) {
  const selections = useBettingStore((state) => state.selections);

  useEffect(() => {
    if (selections.length === 0) {
      setAccStake(0);
      setDoublesStake(0);
      setTreblesStake(0);
      setFourFoldsStake(0);
    }
  }, [
    selections.length,
    setAccStake,
    setDoublesStake,
    setTreblesStake,
    setFourFoldsStake,
  ]);

  // Empty state
  if (selections.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-12 text-center">
        {/* Empty slip icon */}
        <div className="mb-4 text-gray-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-base font-medium text-gray-500">
          Your slip is empty
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Add events from the left to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Singles Section - always shown if selections exist */}
      <SinglesSection />

      {/* Accumulator Section - only if 2+ selections */}
      {selections.length >= 2 && (
        <AccumulatorSection accStake={accStake} setAccStake={setAccStake} />
      )}

      {/* Hedge Bets Section - only if 2+ selections */}
      {selections.length >= 2 && (
        <HedgeBetsSection
          doublesStake={doublesStake}
          setDoublesStake={setDoublesStake}
          treblesStake={treblesStake}
          setTreblesStake={setTreblesStake}
          fourFoldsStake={fourFoldsStake}
          setFourFoldsStake={setFourFoldsStake}
        />
      )}
    </div>
  );
}
