// ============================================================
// VETO — Betting Calculations
// src/lib/calculations/index.ts
// ============================================================

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface Selection {
  id: string;
  event: string;
  sport: string;
  market: string;
  outcomeSelected: string;
  odds: number;
  stake: number;
}

export interface SingleResult {
  selectionId: string;
  stake: number;
  odds: number;
  potentialWin: number;
  profit: number;
}

export interface AccumulatorResult {
  accumulatorOdds: number;
  oddsChain: number[]; // e.g. [2.10, 1.65, 1.70] for display
  stake: number;
  potentialWin: number;
  profit: number;
  profitPercentage: number;
  label: string; // "Double" | "Treble" | "4-Fold" etc.
}

export interface Combination {
  selections: Selection[];
  odds: number; // product of all selection odds in this combo
  potentialWin: number;
}

export interface HedgeGroup {
  type: "doubles" | "trebles" | "fourFolds";
  label: string; // "Doubles" | "Trebles" | "4-Folds"
  count: number;
  combinations: Combination[];
  stakePerBet: number;
  totalStake: number;
  minWin: number;
  maxWin: number;
}

export interface HedgeResult {
  doubles: HedgeGroup | null;
  trebles: HedgeGroup | null;
  fourFolds: HedgeGroup | null;
  totalStake: number;
  grandMinWin: number;
  grandMaxWin: number;
}

// ------------------------------------------------------------
// 1. Singles
// ------------------------------------------------------------

export function calculateSingle(
  stake: number,
  odds: number
): {
  potentialWin: number;
  profit: number;
} {
  if (stake <= 0 || odds <= 0) return { potentialWin: 0, profit: 0 };

  const potentialWin = round2(stake * odds);
  const profit = round2(potentialWin - stake);

  return { potentialWin, profit };
}

export function calculateAllSingles(selections: Selection[]): SingleResult[] {
  return selections.map((sel) => {
    const { potentialWin, profit } = calculateSingle(sel.stake, sel.odds);
    return {
      selectionId: sel.id,
      stake: sel.stake,
      odds: sel.odds,
      potentialWin,
      profit,
    };
  });
}

export function calculateSinglesTotalStake(selections: Selection[]): number {
  return round2(selections.reduce((sum, sel) => sum + sel.stake, 0));
}

export function calculateSinglesTotalPotentialWin(
  selections: Selection[]
): number {
  return round2(
    selections.reduce((sum, sel) => sum + round2(sel.stake * sel.odds), 0)
  );
}

// ------------------------------------------------------------
// 2. Accumulator
// ------------------------------------------------------------

export function getAccumulatorLabel(count: number): string {
  if (count === 2) return "Double";
  if (count === 3) return "Treble";
  return `${count}-Fold`;
}

export function calculateAccumulator(
  selections: Selection[],
  stake: number
): AccumulatorResult | null {
  if (selections.length < 2 || stake <= 0) return null;

  const oddsChain = selections.map((s) => s.odds);
  const accumulatorOdds = round2(
    oddsChain.reduce((total, odds) => total * odds, 1)
  );
  const potentialWin = round2(stake * accumulatorOdds);
  const profit = round2(potentialWin - stake);
  const profitPercentage = stake > 0 ? Math.round((profit / stake) * 100) : 0;
  const label = getAccumulatorLabel(selections.length);

  return {
    accumulatorOdds,
    oddsChain,
    stake,
    potentialWin,
    profit,
    profitPercentage,
    label,
  };
}

// ------------------------------------------------------------
// 3. Hedge Bets (System Bets)
// ------------------------------------------------------------

// --- Helpers ---

function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

function nCr(n: number, r: number): number {
  if (r > n) return 0;
  return factorial(n) / (factorial(r) * factorial(n - r));
}

function getCombinations(selections: Selection[], r: number): Selection[][] {
  const results: Selection[][] = [];

  const combine = (start: number, current: Selection[]) => {
    if (current.length === r) {
      results.push([...current]);
      return;
    }
    for (let i = start; i < selections.length; i++) {
      combine(i + 1, [...current, selections[i]]);
    }
  };

  combine(0, []);
  return results;
}

function comboOdds(combo: Selection[]): number {
  return round2(combo.reduce((total, sel) => total * sel.odds, 1));
}

function buildHedgeGroup(
  type: HedgeGroup["type"],
  label: string,
  combos: Selection[][],
  stakePerBet: number
): HedgeGroup {
  const count = combos.length;
  const combinations: Combination[] = combos.map((combo) => {
    const odds = comboOdds(combo);
    return {
      selections: combo,
      odds,
      potentialWin: round2(odds * stakePerBet),
    };
  });

  const totalStake = round2(count * stakePerBet);

  if (stakePerBet <= 0 || combinations.length === 0) {
    return {
      type,
      label,
      count,
      combinations,
      stakePerBet,
      totalStake,
      minWin: 0,
      maxWin: 0,
    };
  }

  const allWins = combinations.map((c) => c.potentialWin);
  const minWin = round2(Math.min(...allWins));
  const maxWin = round2(allWins.reduce((sum, w) => sum + w, 0));

  return {
    type,
    label,
    count,
    combinations,
    stakePerBet,
    totalStake,
    minWin,
    maxWin,
  };
}

export function calculateHedgeBets(
  selections: Selection[],
  doublesStake: number,
  treblesStake: number,
  fourFoldsStake: number
): HedgeResult | null {
  if (selections.length < 2) return null;

  const n = selections.length;

  const doublesGroup =
    n >= 2
      ? buildHedgeGroup(
          "doubles",
          "Doubles",
          getCombinations(selections, 2),
          doublesStake
        )
      : null;

  const treblesGroup =
    n >= 3
      ? buildHedgeGroup(
          "trebles",
          "Trebles",
          getCombinations(selections, 3),
          treblesStake
        )
      : null;

  const fourFoldsGroup =
    n >= 4
      ? buildHedgeGroup(
          "fourFolds",
          "4-Folds",
          getCombinations(selections, 4),
          fourFoldsStake
        )
      : null;

  const totalStake = round2(
    (doublesGroup?.totalStake ?? 0) +
      (treblesGroup?.totalStake ?? 0) +
      (fourFoldsGroup?.totalStake ?? 0)
  );

  // Grand min: smallest single winning combination across all group types
  const allMins = [doublesGroup, treblesGroup, fourFoldsGroup]
    .filter((g): g is HedgeGroup => g !== null && g.stakePerBet > 0)
    .map((g) => g.minWin);

  const grandMinWin = allMins.length > 0 ? round2(Math.min(...allMins)) : 0;

  // Grand max: all combinations across all groups win
  const grandMaxWin = round2(
    (doublesGroup?.maxWin ?? 0) +
      (treblesGroup?.maxWin ?? 0) +
      (fourFoldsGroup?.maxWin ?? 0)
  );

  return {
    doubles: doublesGroup,
    trebles: treblesGroup,
    fourFolds: fourFoldsGroup,
    totalStake,
    grandMinWin,
    grandMaxWin,
  };
}

// Convenience: count only (no stake needed)
export function getHedgeCounts(selectionCount: number): {
  doubles: number;
  trebles: number;
  fourFolds: number;
} {
  return {
    doubles: selectionCount >= 2 ? nCr(selectionCount, 2) : 0,
    trebles: selectionCount >= 3 ? nCr(selectionCount, 3) : 0,
    fourFolds: selectionCount >= 4 ? nCr(selectionCount, 4) : 0,
  };
}

// ------------------------------------------------------------
// 4. Betting Slip Totals
// ------------------------------------------------------------

export interface SlipTotals {
  totalStake: number;
  totalPotentialWin: number;
  isHighStake: boolean; // true if totalStake > €65
}

export function calculateSlipTotals(
  singles: Selection[],
  accumulatorStake: number,
  hedgeResult: HedgeResult | null
): SlipTotals {
  const singlesStake = calculateSinglesTotalStake(singles);
  const hedgeStake = hedgeResult?.totalStake ?? 0;

  const totalStake = round2(singlesStake + accumulatorStake + hedgeStake);

  const singlesPotential = calculateSinglesTotalPotentialWin(singles);
  const accPotential =
    accumulatorStake > 0 && singles.length >= 2
      ? (calculateAccumulator(singles, accumulatorStake)?.potentialWin ?? 0)
      : 0;
  const hedgePotential = hedgeResult?.grandMaxWin ?? 0;

  const totalPotentialWin = round2(
    singlesPotential + accPotential + hedgePotential
  );

  return {
    totalStake,
    totalPotentialWin,
    isHighStake: totalStake > 65,
  };
}

// ------------------------------------------------------------
// Utility
// ------------------------------------------------------------

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
