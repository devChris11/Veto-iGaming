// ============================================================
// VETO — Metrics Calculations
// src/lib/metrics/index.ts
// ============================================================

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface Bet {
  id: string;
  timestamp: string;
  event: string;
  sport: string;
  market: string;
  outcome_selected: string;
  odds: number;
  stake: number;
  outcome: "won" | "lost" | "pending";
  winnings: number | null;
  profit: number | null;
}

export interface WinRateResult {
  winRate: number; // percentage, e.g. 56.8
  totalWins: number;
  totalBets: number;
  hasData: boolean;
}

export interface ROIResult {
  roi: number; // percentage, e.g. -14.0
  totalStaked: number;
  totalReturns: number;
  netResult: number;
  hasData: boolean;
}

export interface BestMarketResult {
  sport: string;
  winRate: number;
  totalBets: number;
  totalWins: number;
  hasData: boolean;
}

export interface RecentFormResult {
  form: ("W" | "L")[]; // last 5 settled bets, newest first
  winsInLast5: number;
  hasStreak: boolean;
  streakType: "W" | "L" | null;
  streakLength: number;
  hasData: boolean;
}

export interface LossLimitResult {
  // Daily
  dailyLimit: number;
  dailyLoss: number;
  dailyRemaining: number;
  dailyUsedPercentage: number;

  // Weekly
  weeklyLimit: number;
  weeklyLoss: number;
  weeklyRemaining: number;
  weeklyUsedPercentage: number;
  weeklyDaysGambled: number;
  weeklyDaysNotGambled: number;
  weeklySaved: number;

  // Monthly
  monthlyLimit: number;
  monthlyLoss: number;
  monthlyRemaining: number;
  monthlyUsedPercentage: number;
  monthlyDaysGambled: number;
  monthlyDaysNotGambled: number;
  monthlySaved: number;

  daysInMonth: number;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function toDate(timestamp: string): Date {
  return new Date(timestamp);
}

function getSettled(bets: Bet[]): Bet[] {
  return bets.filter((b) => b.outcome !== "pending");
}

function getLast30Days(bets: Bet[]): Bet[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  cutoff.setHours(0, 0, 0, 0);
  return getSettled(bets).filter((b) => toDate(b.timestamp) >= cutoff);
}

function getLast7Days(bets: Bet[]): Bet[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  cutoff.setHours(0, 0, 0, 0);
  return getSettled(bets).filter((b) => toDate(b.timestamp) >= cutoff);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Net loss for a single settled bet (positive = money lost, negative = money gained)
function netLoss(bet: Bet): number {
  if (bet.outcome === "lost") return bet.stake;
  if (bet.outcome === "won") return round2(bet.stake - (bet.winnings ?? 0));
  return 0;
}

// ------------------------------------------------------------
// 4. Win Rate  (last 30 days)
// ------------------------------------------------------------

export function calculateWinRate(bets: Bet[]): WinRateResult {
  const recent = getLast30Days(bets);

  if (recent.length === 0) {
    return { winRate: 0, totalWins: 0, totalBets: 0, hasData: false };
  }

  const totalBets = recent.length;
  const totalWins = recent.filter((b) => b.outcome === "won").length;
  const winRate = round1((totalWins / totalBets) * 100);

  return { winRate, totalWins, totalBets, hasData: true };
}

// ------------------------------------------------------------
// 5. ROI  (last 30 days)
// ------------------------------------------------------------

export function calculateROI(bets: Bet[]): ROIResult {
  const recent = getLast30Days(bets);

  if (recent.length === 0) {
    return {
      roi: 0,
      totalStaked: 0,
      totalReturns: 0,
      netResult: 0,
      hasData: false,
    };
  }

  const totalStaked = round2(recent.reduce((sum, b) => sum + b.stake, 0));
  const totalReturns = round2(
    recent
      .filter((b) => b.outcome === "won")
      .reduce((sum, b) => sum + (b.winnings ?? 0), 0)
  );

  if (totalStaked === 0) {
    return {
      roi: 0,
      totalStaked: 0,
      totalReturns: 0,
      netResult: 0,
      hasData: false,
    };
  }

  const netResult = round2(totalReturns - totalStaked);
  const roi = round1(((totalReturns - totalStaked) / totalStaked) * 100);

  return { roi, totalStaked, totalReturns, netResult, hasData: true };
}

// ------------------------------------------------------------
// 6. Best Market  (last 7 days, min 5 bets)
// ------------------------------------------------------------

const BEST_MARKET_MIN_BETS = 5;

export function calculateBestMarket(bets: Bet[]): BestMarketResult {
  const recent = getLast7Days(bets);

  if (recent.length === 0) {
    return {
      sport: "",
      winRate: 0,
      totalBets: 0,
      totalWins: 0,
      hasData: false,
    };
  }

  // Group by sport
  const bySport = recent.reduce<
    Record<string, { wins: number; total: number }>
  >((acc, bet) => {
    if (!acc[bet.sport]) acc[bet.sport] = { wins: 0, total: 0 };
    acc[bet.sport].total++;
    if (bet.outcome === "won") acc[bet.sport].wins++;
    return acc;
  }, {});

  const qualified = Object.entries(bySport)
    .map(([sport, data]) => ({
      sport,
      winRate: round1((data.wins / data.total) * 100),
      totalBets: data.total,
      totalWins: data.wins,
    }))
    .filter((s) => s.totalBets >= BEST_MARKET_MIN_BETS)
    .sort((a, b) => {
      // Primary: win rate descending. Tiebreak: more bets wins.
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.totalBets - a.totalBets;
    });

  if (qualified.length === 0) {
    return {
      sport: "",
      winRate: 0,
      totalBets: 0,
      totalWins: 0,
      hasData: false,
    };
  }

  const best = qualified[0];
  return { ...best, hasData: true };
}

// ------------------------------------------------------------
// Recent Form  (last 5 settled bets)
// ------------------------------------------------------------

const STREAK_THRESHOLD = 3;

export function calculateRecentForm(bets: Bet[]): RecentFormResult {
  const settled = getSettled(bets)
    .slice()
    .sort(
      (a, b) => toDate(b.timestamp).getTime() - toDate(a.timestamp).getTime()
    )
    .slice(0, 5);

  if (settled.length === 0) {
    return {
      form: [],
      winsInLast5: 0,
      hasStreak: false,
      streakType: null,
      streakLength: 0,
      hasData: false,
    };
  }

  const form: ("W" | "L")[] = settled.map((b) =>
    b.outcome === "won" ? "W" : "L"
  );
  const winsInLast5 = form.filter((f) => f === "W").length;

  // Detect current streak from most recent bet
  let streakLength = 1;
  const streakType = form[0];
  for (let i = 1; i < form.length; i++) {
    if (form[i] === streakType) streakLength++;
    else break;
  }

  const hasStreak = streakLength >= STREAK_THRESHOLD;

  return {
    form,
    winsInLast5,
    hasStreak,
    streakType: hasStreak ? streakType : null,
    streakLength: hasStreak ? streakLength : 0,
    hasData: true,
  };
}

// ------------------------------------------------------------
// 7. Loss Limits Savings
// ------------------------------------------------------------

export function calculateLossLimits(
  bets: Bet[],
  dailyLimit: number
): LossLimitResult {
  const weeklyLimit = round2(dailyLimit * 7);
  const monthlyLimit = round2(dailyLimit * 30);

  const now = new Date();

  // --- Daily ---
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const todayBets = getSettled(bets).filter(
    (b) => toDate(b.timestamp) >= todayStart
  );
  const dailyLoss = round2(todayBets.reduce((sum, b) => sum + netLoss(b), 0));
  const dailyRemaining = round2(Math.max(0, dailyLimit - dailyLoss));
  const dailyUsedPercentage =
    dailyLimit > 0
      ? Math.min(100, Math.round((dailyLoss / dailyLimit) * 100))
      : 0;

  // --- Weekly (Mon–Sun calendar week) ---
  const weekStart = new Date(now);
  const dayOfWeek = weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1; // Mon = 0
  weekStart.setDate(weekStart.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  const weekBets = getSettled(bets).filter(
    (b) => toDate(b.timestamp) >= weekStart
  );
  const weeklyLoss = round2(weekBets.reduce((sum, b) => sum + netLoss(b), 0));
  const weeklyRemaining = round2(Math.max(0, weeklyLimit - weeklyLoss));
  const weeklyUsedPercentage =
    weeklyLimit > 0
      ? Math.min(100, Math.round((weeklyLoss / weeklyLimit) * 100))
      : 0;
  const weeklyDaysGambled = new Set(
    weekBets.map((b) => toDate(b.timestamp).toDateString())
  ).size;
  const weeklyDaysNotGambled = 7 - weeklyDaysGambled;
  const weeklySaved = round2(Math.max(0, weeklyLimit - weeklyLoss));

  // --- Monthly (calendar month) ---
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();

  const monthBets = getSettled(bets).filter(
    (b) => toDate(b.timestamp) >= monthStart
  );
  const monthlyLoss = round2(monthBets.reduce((sum, b) => sum + netLoss(b), 0));
  const monthlyRemaining = round2(Math.max(0, monthlyLimit - monthlyLoss));
  const monthlyUsedPercentage =
    monthlyLimit > 0
      ? Math.min(100, Math.round((monthlyLoss / monthlyLimit) * 100))
      : 0;
  const monthlyDaysGambled = new Set(
    monthBets.map((b) => toDate(b.timestamp).toDateString())
  ).size;
  const monthlyDaysNotGambled = daysInMonth - monthlyDaysGambled;
  const monthlySaved = round2(Math.max(0, monthlyLimit - monthlyLoss));

  return {
    dailyLimit,
    dailyLoss,
    dailyRemaining,
    dailyUsedPercentage,

    weeklyLimit,
    weeklyLoss,
    weeklyRemaining,
    weeklyUsedPercentage,
    weeklyDaysGambled,
    weeklyDaysNotGambled,
    weeklySaved,

    monthlyLimit,
    monthlyLoss,
    monthlyRemaining,
    monthlyUsedPercentage,
    monthlyDaysGambled,
    monthlyDaysNotGambled,
    monthlySaved,

    daysInMonth,
  };
}

// ------------------------------------------------------------
// Convenience: run all metrics at once
// ------------------------------------------------------------

export interface AllMetrics {
  winRate: WinRateResult;
  roi: ROIResult;
  bestMarket: BestMarketResult;
  recentForm: RecentFormResult;
  lossLimits: LossLimitResult;
}

export function calculateAllMetrics(
  bets: Bet[],
  dailyLimit: number
): AllMetrics {
  return {
    winRate: calculateWinRate(bets),
    roi: calculateROI(bets),
    bestMarket: calculateBestMarket(bets),
    recentForm: calculateRecentForm(bets),
    lossLimits: calculateLossLimits(bets, dailyLimit),
  };
}
