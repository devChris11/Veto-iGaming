import type { ReactNode } from "react";
import historyData from "@/data/history.json";
import eventsData from "@/data/events.json";
import { getRebaseDebugInfo } from "@/lib/dateRebase";
import { getSessionBets } from "@/lib/sessionBets";
import {
  calculateSingle,
  calculateAllSingles,
  calculateAccumulator,
  calculateHedgeBets,
  getHedgeCounts,
  getAccumulatorLabel,
  calculateSlipTotals,
  type Selection,
} from "@/lib/calculations";
import {
  calculateWinRate,
  calculateROI,
  calculateBestMarket,
  calculateRecentForm,
  calculateLossLimits,
  calculateAllMetrics,
  type Bet,
} from "@/lib/metrics";

const EXPECT_EVENT_COUNT = 60;
const EXPECT_BET_COUNT = 102;
const EXPECT_LIVE_EVENTS = 6;
const EXPECT_PENDING_BETS = 0;

function PassBadge({ pass }: { pass: boolean }) {
  return pass ? (
    <span className="rounded bg-green-900 px-2 py-0.5 font-mono text-xs text-green-300">
      PASS
    </span>
  ) : (
    <span className="rounded bg-red-900 px-2 py-0.5 font-mono text-xs text-red-300">
      FAIL
    </span>
  );
}

function TestRow({
  label,
  left,
  middle,
  pass,
}: {
  label: string;
  left: ReactNode;
  middle: ReactNode;
  pass: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-gray-800 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-gray-400 sm:w-1/4">{label}</div>
      <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
        <div className="text-sm text-blue-400 font-mono">{left}</div>
        <div className="text-sm text-gray-500">{middle}</div>
      </div>
      <div className="shrink-0">
        <PassBadge pass={pass} />
      </div>
    </div>
  );
}

function selection(odds: number, id: string): Selection {
  return {
    id,
    event: `event_${id}`,
    sport: "Test",
    market: "1X2",
    outcomeSelected: "Home",
    odds,
    stake: 0,
  };
}

function approxEq(a: number, b: number, tol: number): boolean {
  return Math.abs(a - b) <= tol;
}

function isLossLimitsFinite(
  r: ReturnType<typeof calculateLossLimits>
): boolean {
  const nums: number[] = [
    r.dailyLimit,
    r.dailyLoss,
    r.dailyRemaining,
    r.dailyUsedPercentage,
    r.weeklyLimit,
    r.weeklyLoss,
    r.weeklyRemaining,
    r.weeklyUsedPercentage,
    r.weeklyDaysGambled,
    r.weeklyDaysNotGambled,
    r.weeklySaved,
    r.monthlyLimit,
    r.monthlyLoss,
    r.monthlyRemaining,
    r.monthlyUsedPercentage,
    r.monthlyDaysGambled,
    r.monthlyDaysNotGambled,
    r.monthlySaved,
    r.daysInMonth,
  ];
  return nums.every((n) => Number.isFinite(n));
}

function getLast7DaysSettled(bets: Bet[]): Bet[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  cutoff.setHours(0, 0, 0, 0);
  return bets.filter(
    (b) => b.outcome !== "pending" && new Date(b.timestamp) >= cutoff
  );
}

export default function TestPage() {
  const rawBets = (historyData as { bets: Bet[] }).bets;
  const bets = getSessionBets();
  const rebaseInfo = getRebaseDebugInfo(bets);
  const todayIsoDate = new Date().toISOString().slice(0, 10);

  const passRebaseRawCount = rawBets.length === EXPECT_BET_COUNT;
  const passRebaseBetsCount = bets.length === EXPECT_BET_COUNT;
  const passRebaseLatest = rebaseInfo.latestBet === todayIsoDate;
  const passRebaseSpan =
    rebaseInfo.spanDays >= 90 && rebaseInfo.spanDays <= 110;
  const passRebaseLast7 = rebaseInfo.last7DaysCount >= 5;
  const passRebaseLast30 = rebaseInfo.last30DaysCount >= 20;

  const events = (
    eventsData as { events: { sport: string; isLive?: boolean }[] }
  ).events;

  const suite: boolean[] = [];

  suite.push(
    passRebaseRawCount,
    passRebaseBetsCount,
    passRebaseLatest,
    passRebaseSpan,
    passRebaseLast7,
    passRebaseLast30
  );

  const eventsLoaded = Array.isArray(events) && events.length > 0;
  const historyLoaded = Array.isArray(bets) && bets.length > 0;
  const eventCountOk = events.length === EXPECT_EVENT_COUNT;
  const betCountOk = bets.length === EXPECT_BET_COUNT;
  const liveCount = events.filter((e) => e.isLive === true).length;
  const liveOk = liveCount === EXPECT_LIVE_EVENTS;
  const pendingBets = bets.filter((b) => b.outcome === "pending").length;
  const pendingOk = pendingBets === EXPECT_PENDING_BETS;

  suite.push(
    eventsLoaded,
    historyLoaded,
    eventCountOk,
    betCountOk,
    liveOk,
    pendingOk
  );

  const sportsSet = new Set(events.map((e) => e.sport));
  const sportsList = [...sportsSet].sort().join(", ");
  const won = bets.filter((b) => b.outcome === "won").length;
  const lost = bets.filter((b) => b.outcome === "lost").length;
  const pending = bets.filter((b) => b.outcome === "pending").length;
  const distSumOk = won + lost + pending === bets.length;
  suite.push(distSumOk);

  // --- Singles ---
  const sA = calculateSingle(10, 2.1);
  const passA = sA.potentialWin === 21 && sA.profit === 11;
  suite.push(passA);

  const sB = calculateSingle(25, 1.5);
  const passB = sB.potentialWin === 37.5 && sB.profit === 12.5;
  suite.push(passB);

  const sC = calculateSingle(5, 5.5);
  const passC = sC.potentialWin === 27.5 && sC.profit === 22.5;
  suite.push(passC);

  const sD = calculateSingle(0, 2.1);
  const passD = sD.potentialWin === 0 && sD.profit === 0;
  suite.push(passD);

  // calculateAllSingles smoke (logic unchanged if singles map correctly)
  const singlesSmoke = calculateAllSingles([
    { ...selection(2, "a"), stake: 10 },
  ]);
  const passSinglesAll =
    singlesSmoke.length === 1 && singlesSmoke[0].potentialWin === 20;
  suite.push(passSinglesAll);

  // --- Accumulator ---
  const accDouble = calculateAccumulator(
    [selection(2.1, "a"), selection(1.65, "b")],
    10
  );
  const passAccDouble =
    accDouble !== null &&
    approxEq(accDouble.accumulatorOdds, 3.47, 0.01) &&
    approxEq(accDouble.potentialWin, 34.7, 0.05) &&
    accDouble.label === "Double";
  suite.push(passAccDouble);

  const accTreble = calculateAccumulator(
    [selection(2.1, "a"), selection(1.65, "b"), selection(1.7, "c")],
    10
  );
  const passAccTreble =
    accTreble !== null &&
    approxEq(accTreble.accumulatorOdds, 5.89, 0.05) &&
    approxEq(accTreble.potentialWin, 58.9, 0.05) &&
    accTreble.label === "Treble";
  suite.push(passAccTreble);

  const odds5 = [2.1, 1.5, 1.4, 3.85, 1.93];
  const acc5 = calculateAccumulator(
    odds5.map((o, i) => selection(o, `f${i}`)),
    10
  );
  const product5 = odds5.reduce((a, b) => a * b, 1);
  const roundedProduct = Math.round(product5 * 100) / 100;
  const passAcc5 =
    acc5 !== null &&
    acc5.label === "5-Fold" &&
    approxEq(acc5.accumulatorOdds, roundedProduct, 0.05);
  suite.push(passAcc5);

  const accSingle = calculateAccumulator([selection(2.1, "only")], 10);
  const passAccSingleNull = accSingle === null;
  suite.push(passAccSingleNull);

  const accEmpty = calculateAccumulator([], 10);
  const passAccEmpty = accEmpty === null;
  suite.push(passAccEmpty);

  const labelDouble = getAccumulatorLabel(2) === "Double";
  const labelTreble = getAccumulatorLabel(3) === "Treble";
  const label5 = getAccumulatorLabel(5) === "5-Fold";
  const passLabels = labelDouble && labelTreble && label5;
  suite.push(passLabels);

  // --- Hedge ---
  const hedgeSels = [
    selection(2.1, "h1"),
    selection(1.65, "h2"),
    selection(1.7, "h3"),
    selection(3.2, "h4"),
  ];
  const hedge = calculateHedgeBets(hedgeSels, 2, 2, 2);
  const counts = getHedgeCounts(4);
  const passHedgeCounts =
    counts.doubles === 6 && counts.trebles === 4 && counts.fourFolds === 1;
  suite.push(passHedgeCounts);

  const passHedgeStake = hedge !== null && hedge.totalStake === 22;
  suite.push(passHedgeStake);

  const passHedgeDoubles =
    hedge?.doubles != null &&
    hedge.doubles.minWin > 0 &&
    hedge.doubles.maxWin > hedge.doubles.minWin;
  suite.push(!!passHedgeDoubles);

  const passHedgeTrebles =
    hedge?.trebles != null &&
    hedge.trebles.minWin > 0 &&
    hedge.trebles.maxWin > hedge.trebles.minWin;
  suite.push(!!passHedgeTrebles);

  const passHedgeFour = hedge?.fourFolds != null && hedge.fourFolds.minWin > 0;
  suite.push(!!passHedgeFour);

  const hedge2 = calculateHedgeBets(
    [selection(2.1, "a"), selection(1.5, "b")],
    2,
    2,
    2
  );
  const passHedge2 =
    hedge2 !== null && hedge2.trebles === null && hedge2.fourFolds === null;
  suite.push(passHedge2);

  const hedgeZero = calculateHedgeBets(hedgeSels, 0, 0, 0);
  const passHedgeZero =
    hedgeZero !== null &&
    hedgeZero.doubles?.minWin === 0 &&
    hedgeZero.doubles?.maxWin === 0 &&
    hedgeZero.trebles?.minWin === 0 &&
    hedgeZero.trebles?.maxWin === 0 &&
    hedgeZero.fourFolds?.minWin === 0 &&
    hedgeZero.fourFolds?.maxWin === 0;
  suite.push(!!passHedgeZero);

  // --- Win rate ---
  const wr = calculateWinRate(bets);
  const passWr = wr.hasData && wr.winRate >= 0 && wr.winRate <= 100;
  suite.push(passWr);

  const wrEmpty = calculateWinRate([]);
  const passWrEmpty = wrEmpty.hasData === false;
  suite.push(passWrEmpty);

  // --- ROI ---
  const roi = calculateROI(bets);
  const passRoi = roi.hasData && Number.isFinite(roi.roi);
  suite.push(passRoi);

  const roiEmpty = calculateROI([]);
  const passRoiEmpty = roiEmpty.hasData === false;
  suite.push(passRoiEmpty);

  // --- Best market ---
  const bm = calculateBestMarket(bets);
  const passBm = bm.hasData && bm.totalBets >= 5;
  suite.push(passBm);

  const bmEmpty = calculateBestMarket([]);
  const passBmEmpty = bmEmpty.hasData === false;
  suite.push(passBmEmpty);

  // --- Recent form ---
  const rf = calculateRecentForm(bets);
  const passRf = rf.hasData && rf.form.length >= 1;
  suite.push(passRf);

  // --- Loss limits ---
  const ll = calculateLossLimits(bets, 20);
  const passLl =
    ll.dailyRemaining >= 0 &&
    ll.weeklySaved >= 0 &&
    ll.monthlySaved >= 0 &&
    isLossLimitsFinite(ll);
  suite.push(passLl);

  const llEmpty = calculateLossLimits([], 20);
  const passLlEmpty =
    llEmpty.dailyLoss === 0 &&
    llEmpty.weeklyLoss === 0 &&
    llEmpty.monthlyLoss === 0 &&
    isLossLimitsFinite(llEmpty);
  suite.push(passLlEmpty);

  // --- Edge cases (numbered); avoid double-counting checks already in suite above ---
  const passSingleZeroOdds = calculateSingle(10, 0).potentialWin === 0;
  suite.push(passSingleZeroOdds);

  const passHedgeEmptyList = calculateHedgeBets([], 2, 2, 2) === null;
  const passHedgeOneSel =
    calculateHedgeBets([selection(2.1, "solo")], 2, 2, 2) === null;
  suite.push(passHedgeEmptyList, passHedgeOneSel);

  const slip = calculateSlipTotals([], 0, null);
  const passSlip = slip.totalStake === 0 && slip.totalPotentialWin === 0;
  suite.push(passSlip);

  const allM = calculateAllMetrics(bets, 20);
  const passAllMetrics =
    allM.winRate.totalBets === wr.totalBets &&
    allM.roi.totalStaked === roi.totalStaked;
  suite.push(passAllMetrics);

  const passed = suite.filter(Boolean).length;
  const total = suite.length;
  const allPass = passed === total;

  const last7 = getLast7DaysSettled(bets);
  const bySport = last7.reduce<Record<string, { wins: number; total: number }>>(
    (acc, bet) => {
      if (!acc[bet.sport]) acc[bet.sport] = { wins: 0, total: 0 };
      acc[bet.sport].total++;
      if (bet.outcome === "won") acc[bet.sport].wins++;
      return acc;
    },
    {}
  );
  const sportRows = Object.entries(bySport)
    .map(([sport, d]) => ({
      sport,
      total: d.total,
      winRate: d.total > 0 ? (d.wins / d.total) * 100 : 0,
    }))
    .sort((a, b) => a.sport.localeCompare(b.sport));

  const chain5Str = `${odds5.map((o) => o.toFixed(2)).join(" × ")} = ${roundedProduct.toFixed(2)}`;

  return (
    <div className="relative min-h-screen bg-gray-950 px-4 pb-16 pt-6 text-gray-200">
      <div
        className={`fixed right-4 top-12 z-40 rounded-lg border px-3 py-1.5 font-mono text-xs ${
          allPass
            ? "border-green-800 bg-green-950 text-green-300"
            : "border-red-800 bg-red-950 text-red-300"
        }`}
      >
        {passed}/{total} passing
      </div>

      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-col gap-3 border-b border-gray-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">
              Dev Test Suite
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Milestone 2B — rebased history + events.json (see Section 0)
            </p>
          </div>
          <div
            className={`w-fit rounded-lg px-3 py-2 font-mono text-sm ${
              allPass
                ? "bg-green-900 text-green-300"
                : "bg-red-900 text-red-300"
            }`}
          >
            {passed}/{total} passing — {allPass ? "ALL PASS" : "SOME FAIL"}
          </div>
        </header>

        {/* Section 0 */}
        <section className="mb-6 rounded-xl bg-gray-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Section 0: Date rebase
          </h2>
          <TestRow
            label="Raw bet count"
            left={String(rawBets.length)}
            middle={`expected ${EXPECT_BET_COUNT}`}
            pass={passRebaseRawCount}
          />
          <TestRow
            label="Rebased bet count"
            left={String(bets.length)}
            middle={`expected ${EXPECT_BET_COUNT}`}
            pass={passRebaseBetsCount}
          />
          <TestRow
            label="Latest rebased bet"
            left={rebaseInfo.latestBet}
            middle={`expected today (UTC): ${todayIsoDate}`}
            pass={passRebaseLatest}
          />
          <TestRow
            label="Span (days)"
            left={`${rebaseInfo.spanDays} days`}
            middle="expected ~95–100 days"
            pass={passRebaseSpan}
          />
          <TestRow
            label="Last 7 days count"
            left={String(rebaseInfo.last7DaysCount)}
            middle="expected ≥ 5 bets in window"
            pass={passRebaseLast7}
          />
          <TestRow
            label="Last 30 days count"
            left={String(rebaseInfo.last30DaysCount)}
            middle="expected ≥ 20 bets in window"
            pass={passRebaseLast30}
          />
        </section>

        {/* Section 1 */}
        <section className="mb-6 rounded-xl bg-gray-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Section 1: Data loading
          </h2>
          <TestRow
            label="events.json loaded"
            left={`length=${events.length}`}
            middle="array exists, length &gt; 0"
            pass={eventsLoaded}
          />
          <TestRow
            label="history.json loaded"
            left={`length=${bets.length}`}
            middle="bets array exists, length &gt; 0"
            pass={historyLoaded}
          />
          <TestRow
            label="Event count"
            left={String(events.length)}
            middle={`expected ${EXPECT_EVENT_COUNT}`}
            pass={eventCountOk}
          />
          <TestRow
            label="Bet count"
            left={String(bets.length)}
            middle={`expected ${EXPECT_BET_COUNT}`}
            pass={betCountOk}
          />
          <TestRow
            label="Live events (isLive)"
            left={String(liveCount)}
            middle={`expected ${EXPECT_LIVE_EVENTS}`}
            pass={liveOk}
          />
          <TestRow
            label="Pending bets"
            left={String(pendingBets)}
            middle={`expected ${EXPECT_PENDING_BETS}`}
            pass={pendingOk}
          />
          <div className="border-t border-gray-800 py-3">
            <div className="text-sm text-gray-400">Sports in events</div>
            <div className="mt-1 font-mono text-sm text-blue-400">
              {sportsList || "—"}
            </div>
          </div>
          <div className="border-t border-gray-800 py-3">
            <div className="text-sm text-gray-400">Outcome distribution</div>
            <div className="mt-1 font-mono text-sm text-blue-400">
              won: {won}, lost: {lost}, pending: {pending} (sum=
              {won + lost + pending} / bets={bets.length})
            </div>
            <div className="mt-2 flex justify-end">
              <PassBadge pass={distSumOk} />
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-6 rounded-xl bg-gray-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Section 2: Singles calculations
          </h2>
          <TestRow
            label="Test A — basic"
            left={`calc: pw=${sA.potentialWin.toFixed(2)} profit=${sA.profit.toFixed(2)}`}
            middle="expected pw=21.00 profit=11.00 · stake=10 odds=2.10"
            pass={passA}
          />
          <TestRow
            label="Test B — low odds"
            left={`calc: pw=${sB.potentialWin.toFixed(2)} profit=${sB.profit.toFixed(2)}`}
            middle="expected pw=37.50 profit=12.50 · stake=25 odds=1.50"
            pass={passB}
          />
          <TestRow
            label="Test C — high odds"
            left={`calc: pw=${sC.potentialWin.toFixed(2)} profit=${sC.profit.toFixed(2)}`}
            middle="expected pw=27.50 profit=22.50 · stake=5 odds=5.50"
            pass={passC}
          />
          <TestRow
            label="Test D — zero stake"
            left={`calc: pw=${sD.potentialWin.toFixed(2)} profit=${sD.profit.toFixed(2)}`}
            middle="expected pw=0 profit=0"
            pass={passD}
          />
          <TestRow
            label="calculateAllSingles smoke"
            left={`rows=${singlesSmoke.length} pw=${singlesSmoke[0]?.potentialWin.toFixed(2)}`}
            middle="one selection stake 10 @ 2.00 → pw 20.00"
            pass={passSinglesAll}
          />
        </section>

        {/* Section 3 */}
        <section className="mb-6 rounded-xl bg-gray-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Section 3: Accumulator calculations
          </h2>
          <TestRow
            label="Test A — Double"
            left={
              accDouble
                ? `odds=${accDouble.accumulatorOdds.toFixed(2)} pw=${accDouble.potentialWin.toFixed(2)} label=${accDouble.label}`
                : "null"
            }
            middle="expected odds≈3.47 pw≈34.70 (±0.05) label Double"
            pass={passAccDouble}
          />
          <TestRow
            label="Test B — Treble"
            left={
              accTreble
                ? `odds=${accTreble.accumulatorOdds.toFixed(2)} pw=${accTreble.potentialWin.toFixed(2)} label=${accTreble.label}`
                : "null"
            }
            middle="expected odds≈5.89 pw≈58.90 (±0.05) label Treble"
            pass={passAccTreble}
          />
          <TestRow
            label="Test C — 5-Fold"
            left={
              acc5
                ? `odds=${acc5.accumulatorOdds.toFixed(2)} pw=${acc5.potentialWin.toFixed(2)} label=${acc5.label}`
                : "null"
            }
            middle={
              <span className="font-mono text-blue-400">{chain5Str}</span>
            }
            pass={passAcc5}
          />
          <TestRow
            label="Test D — single selection"
            left={accSingle === null ? "null" : "non-null (unexpected)"}
            middle="expected null"
            pass={passAccSingleNull}
          />
          <TestRow
            label="getAccumulatorLabel"
            left={`2→${getAccumulatorLabel(2)} 3→${getAccumulatorLabel(3)} 5→${getAccumulatorLabel(5)}`}
            middle='expected "Double", "Treble", "5-Fold"'
            pass={passLabels}
          />
        </section>

        {/* Section 4 */}
        <section className="mb-6 rounded-xl bg-gray-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Section 4: Hedge bets
          </h2>
          <TestRow
            label="getHedgeCounts(4)"
            left={`doubles=${counts.doubles} trebles=${counts.trebles} fourFolds=${counts.fourFolds}`}
            middle="expected 6, 4, 1"
            pass={passHedgeCounts}
          />
          <TestRow
            label="Total hedge stake"
            left={hedge ? `€${hedge.totalStake.toFixed(2)}` : "—"}
            middle="expected 6×2 + 4×2 + 1×2 = €22.00"
            pass={passHedgeStake}
          />
          <TestRow
            label="Doubles min / max win"
            left={
              hedge?.doubles
                ? `min=${hedge.doubles.minWin.toFixed(2)} max=${hedge.doubles.maxWin.toFixed(2)}`
                : "—"
            }
            middle="min &gt; 0 and max &gt; min"
            pass={!!passHedgeDoubles}
          />
          <TestRow
            label="Trebles min / max win"
            left={
              hedge?.trebles
                ? `min=${hedge.trebles.minWin.toFixed(2)} max=${hedge.trebles.maxWin.toFixed(2)}`
                : "—"
            }
            middle="min &gt; 0 and max &gt; min"
            pass={!!passHedgeTrebles}
          />
          <TestRow
            label="Four-folds win (min)"
            left={
              hedge?.fourFolds
                ? `min=${hedge.fourFolds.minWin.toFixed(2)} max=${hedge.fourFolds.maxWin.toFixed(2)}`
                : "—"
            }
            middle="single combo → min equals max"
            pass={!!passHedgeFour}
          />
          <TestRow
            label="2 selections → trebles / fourFolds null"
            left={`trebles=${hedge2?.trebles === null ? "null" : "set"} fourFolds=${hedge2?.fourFolds === null ? "null" : "set"}`}
            middle="expected both null"
            pass={passHedge2}
          />
          <TestRow
            label="Stake €0 per group"
            left="min/max all 0 for doubles, trebles, four-folds"
            middle="expected"
            pass={!!passHedgeZero}
          />
          <TestRow
            label="calculateSlipTotals smoke"
            left={`stake=${slip.totalStake.toFixed(2)} potential=${slip.totalPotentialWin.toFixed(2)}`}
            middle="empty singles, acc 0, no hedge"
            pass={passSlip}
          />
        </section>

        {/* Section 5 */}
        <section className="mb-6 rounded-xl bg-gray-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Section 5: Win rate (last 30 days, settled)
          </h2>
          <div className="mb-3 text-sm text-gray-500">
            Window: last 30 days · only settled bets (same as{" "}
            <code className="text-blue-400">calculateWinRate</code>)
          </div>
          <TestRow
            label="Full history"
            left={`bets=${wr.totalBets} wins=${wr.totalWins} rate=${wr.winRate.toFixed(1)}% hasData=${String(wr.hasData)}`}
            middle="PASS if hasData and 0% ≤ rate ≤ 100%"
            pass={passWr}
          />
          <TestRow
            label="Empty array"
            left={`hasData=${String(wrEmpty.hasData)}`}
            middle="expected hasData false"
            pass={passWrEmpty}
          />
        </section>

        {/* Section 6 */}
        <section className="mb-6 rounded-xl bg-gray-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Section 6: ROI (last 30 days, settled)
          </h2>
          <TestRow
            label="Full history"
            left={`staked=${roi.totalStaked.toFixed(2)} returns=${roi.totalReturns.toFixed(2)} net=${roi.netResult >= 0 ? "+" : ""}${roi.netResult.toFixed(2)} ROI=${roi.roi.toFixed(1)}% hasData=${String(roi.hasData)}`}
            middle="PASS if hasData and finite ROI %"
            pass={passRoi}
          />
          <TestRow
            label="Empty array"
            left={`hasData=${String(roiEmpty.hasData)}`}
            middle="expected hasData false"
            pass={passRoiEmpty}
          />
        </section>

        {/* Section 7 */}
        <section className="mb-6 rounded-xl bg-gray-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Section 7: Best market (last 7 days)
          </h2>
          <TestRow
            label="Winner"
            left={`sport=${bm.sport || "—"} rate=${bm.winRate.toFixed(1)}% bets=${bm.totalBets} hasData=${String(bm.hasData)}`}
            middle="PASS if hasData and totalBets ≥ 5"
            pass={passBm}
          />
          <TestRow
            label="Empty array"
            left={`hasData=${String(bmEmpty.hasData)}`}
            middle="expected hasData false"
            pass={passBmEmpty}
          />
          <div className="border-t border-gray-800 pt-4">
            <div className="mb-2 text-sm text-gray-400">
              Breakdown — every sport (last 7 days, settled)
            </div>
            <table className="w-full text-left font-mono text-sm text-blue-400">
              <thead>
                <tr className="text-gray-500">
                  <th className="py-1 pr-4">Sport</th>
                  <th className="py-1 pr-4">Bets</th>
                  <th className="py-1">Win rate %</th>
                </tr>
              </thead>
              <tbody>
                {sportRows.map((row) => (
                  <tr key={row.sport} className="border-t border-gray-800">
                    <td className="py-2 pr-4">{row.sport}</td>
                    <td className="py-2 pr-4">{row.total}</td>
                    <td className="py-2">{row.winRate.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 8 */}
        <section className="mb-6 rounded-xl bg-gray-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Section 8: Recent form
          </h2>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-400">Form (newest first):</span>
            {rf.form.map((f, i) => (
              <span
                key={`${f}-${i}`}
                className={`rounded px-2 py-0.5 font-mono text-xs ${
                  f === "W"
                    ? "bg-green-900 text-green-300"
                    : "bg-red-900 text-red-300"
                }`}
              >
                {f}
              </span>
            ))}
          </div>
          <TestRow
            label="Summary"
            left={`winsInLast5=${rf.winsInLast5} hasStreak=${String(rf.hasStreak)} type=${rf.streakType ?? "—"} len=${rf.streakLength}`}
            middle="PASS if hasData and form length ≥ 1"
            pass={passRf}
          />
        </section>

        {/* Section 9 */}
        <section className="mb-6 rounded-xl bg-gray-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Section 9: Loss limits (dailyLimit=20)
          </h2>
          <div className="overflow-x-auto border-t border-gray-800">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="text-gray-500">
                  <th className="py-2 pr-3">Period</th>
                  <th className="py-2 pr-3">Limit</th>
                  <th className="py-2 pr-3">Loss</th>
                  <th className="py-2 pr-3">Remaining</th>
                  <th className="py-2 pr-3">Used %</th>
                  <th className="py-2 pr-3">Saved</th>
                  <th className="py-2 pr-3">Days gambled</th>
                  <th className="py-2">Days not</th>
                </tr>
              </thead>
              <tbody className="font-mono text-blue-400">
                <tr className="border-t border-gray-800">
                  <td className="py-2 pr-3 text-gray-400">Daily</td>
                  <td className="py-2 pr-3">{ll.dailyLimit.toFixed(2)}</td>
                  <td className="py-2 pr-3">{ll.dailyLoss.toFixed(2)}</td>
                  <td className="py-2 pr-3">{ll.dailyRemaining.toFixed(2)}</td>
                  <td className="py-2 pr-3">{ll.dailyUsedPercentage}%</td>
                  <td className="py-2 pr-3">—</td>
                  <td className="py-2 pr-3">—</td>
                  <td className="py-2">—</td>
                </tr>
                <tr className="border-t border-gray-800">
                  <td className="py-2 pr-3 text-gray-400">Weekly</td>
                  <td className="py-2 pr-3">{ll.weeklyLimit.toFixed(2)}</td>
                  <td className="py-2 pr-3">{ll.weeklyLoss.toFixed(2)}</td>
                  <td className="py-2 pr-3">{ll.weeklyRemaining.toFixed(2)}</td>
                  <td className="py-2 pr-3">{ll.weeklyUsedPercentage}%</td>
                  <td className="py-2 pr-3">{ll.weeklySaved.toFixed(2)}</td>
                  <td className="py-2 pr-3">{ll.weeklyDaysGambled}</td>
                  <td className="py-2">{ll.weeklyDaysNotGambled}</td>
                </tr>
                <tr className="border-t border-gray-800">
                  <td className="py-2 pr-3 text-gray-400">Monthly</td>
                  <td className="py-2 pr-3">{ll.monthlyLimit.toFixed(2)}</td>
                  <td className="py-2 pr-3">{ll.monthlyLoss.toFixed(2)}</td>
                  <td className="py-2 pr-3">
                    {ll.monthlyRemaining.toFixed(2)}
                  </td>
                  <td className="py-2 pr-3">{ll.monthlyUsedPercentage}%</td>
                  <td className="py-2 pr-3">{ll.monthlySaved.toFixed(2)}</td>
                  <td className="py-2 pr-3">{ll.monthlyDaysGambled}</td>
                  <td className="py-2">{ll.monthlyDaysNotGambled}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-2 font-mono text-xs text-gray-500">
            daysInMonth={ll.daysInMonth}
          </div>
          <div className="mt-4">
            <TestRow
              label="PASS conditions"
              left="dailyRemaining≥0, weeklySaved≥0, monthlySaved≥0, all finite"
              middle="—"
              pass={passLl}
            />
          </div>
        </section>

        {/* Section 10 */}
        <section className="mb-6 rounded-xl bg-gray-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Section 10: Edge cases
          </h2>
          <TestRow
            label="1. calculateSingle(0, 2.10)"
            left={`potentialWin=${calculateSingle(0, 2.1).potentialWin.toFixed(2)}`}
            middle="expected 0 (aligned with Section 2 Test D)"
            pass={passD}
          />
          <TestRow
            label="2. calculateSingle(10, 0)"
            left={`potentialWin=${calculateSingle(10, 0).potentialWin.toFixed(2)}`}
            middle="expected 0"
            pass={passSingleZeroOdds}
          />
          <TestRow
            label="3. calculateAccumulator([], 10)"
            left={accEmpty === null ? "null" : "not null"}
            middle="expected null"
            pass={passAccEmpty}
          />
          <TestRow
            label="4. calculateAccumulator(1 selection)"
            left={accSingle === null ? "null" : "not null"}
            middle="expected null"
            pass={passAccSingleNull}
          />
          <TestRow
            label="5. calculateHedgeBets([], 2,2,2)"
            left={passHedgeEmptyList ? "null" : "not null"}
            middle="expected null"
            pass={passHedgeEmptyList}
          />
          <TestRow
            label="6. calculateHedgeBets(1 selection)"
            left={passHedgeOneSel ? "null" : "not null"}
            middle="expected null"
            pass={passHedgeOneSel}
          />
          <TestRow
            label="7. calculateWinRate([])"
            left={`hasData=${String(wrEmpty.hasData)}`}
            middle="false"
            pass={passWrEmpty}
          />
          <TestRow
            label="8. calculateROI([])"
            left={`hasData=${String(roiEmpty.hasData)}`}
            middle="false"
            pass={passRoiEmpty}
          />
          <TestRow
            label="9. calculateBestMarket([])"
            left={`hasData=${String(bmEmpty.hasData)}`}
            middle="false"
            pass={passBmEmpty}
          />
          <TestRow
            label="10. calculateLossLimits([], 20)"
            left={`dailyLoss=${llEmpty.dailyLoss.toFixed(2)} weeklyLoss=${llEmpty.weeklyLoss.toFixed(2)} monthlyLoss=${llEmpty.monthlyLoss.toFixed(2)}`}
            middle="losses 0, no NaN"
            pass={passLlEmpty}
          />
          <TestRow
            label="calculateAllMetrics consistency"
            left={`winRate.totalBets=${allM.winRate.totalBets} roi.totalStaked=${allM.roi.totalStaked.toFixed(2)}`}
            middle="matches standalone calculators"
            pass={passAllMetrics}
          />
        </section>
      </div>
    </div>
  );
}
