"use client";

import { useBettingStore } from "@/lib/store";
import {
  calculateAccumulator,
  getAccumulatorLabel,
  type Selection as CalcSelection,
} from "@/lib/calculations";
import type { Selection as StoreSelection } from "@/types/betting";

// Quick-add amounts for accumulator
const QUICK_ADD_AMOUNTS = [5, 10, 25, 50, 100];

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

interface AccumulatorSectionProps {
  accStake: number;
  setAccStake: (value: number) => void;
}

export function AccumulatorSection({
  accStake,
  setAccStake,
}: AccumulatorSectionProps) {
  const selections = useBettingStore((state) => state.selections);

  // Map selections to calculation format
  const calcSelections = selections.map((s) => mapToCalcSelection(s, accStake));

  // Calculate accumulator
  const result = calculateAccumulator(calcSelections, accStake);

  // Get accumulator label (Double, Treble, N-Fold)
  const accLabel = getAccumulatorLabel(selections.length);

  const handleStakeChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setAccStake(round2(numValue));
    } else if (value === "") {
      setAccStake(0);
    }
  };

  const handleQuickAdd = (amount: number) => {
    setAccStake(round2(accStake + amount));
  };

  // Calculate combined odds
  const combinedOdds = selections.reduce((total, s) => total * s.odds, 1);
  const oddsChain = selections.map((s) => s.odds.toFixed(2)).join(" × ");

  return (
    <div>
      {/* Only the heading sits outside the card */}
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Accumulator
      </h3>

      {/* Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        {/* Card header: sub-label left, combined odds right */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            {accLabel}
          </span>
          <div className="text-right">
            <p className="text-xs text-gray-400">Combined odds</p>
            <p className="font-semibold tabular-nums text-primary-600">
              {combinedOdds.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="mb-3 flex items-start gap-2 rounded-md bg-warning-50 px-3 py-2">
          <span className="text-warning-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mt-0.5 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </span>
          <p className="text-xs text-warning-700">
            All {selections.length} selections must win
          </p>
        </div>

        {/* Formula */}
        <div className="mb-4 rounded-md bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">Formula</p>
          <p className="text-sm tabular-nums text-gray-700">
            {oddsChain} ={" "}
            <span className="font-semibold">{combinedOdds.toFixed(2)}</span>
          </p>
        </div>

        {/* Stake Input + Quick Add */}
        <div>
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
                value={accStake || ""}
                onChange={(e) => handleStakeChange(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-sm text-gray-900 tabular-nums placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>
            <div className="flex shrink-0 gap-1">
              {QUICK_ADD_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleQuickAdd(amount)}
                  className="rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-primary-300 hover:bg-primary-50"
                >
                  +{amount}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        {accStake > 0 && result && (
          <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Potential Win</span>
              <span className="font-semibold tabular-nums text-success-700">
                €{result.potentialWin.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Profit</span>
              <span className="font-semibold tabular-nums text-success-700">
                €{result.profit.toFixed(2)}{" "}
                <span className="text-xs">(+{result.profitPercentage}%)</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
