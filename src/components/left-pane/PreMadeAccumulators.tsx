"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBettingStore } from "@/lib/store";
import { useToast } from "@/components/shared/Toast";
import type { Selection, Event } from "@/types/betting";

interface AccumulatorSelection {
  team: string;
  odds: number;
}

interface Accumulator {
  id: string;
  title: string;
  selections: AccumulatorSelection[];
  winRate: number;
}

const ACCUMULATORS: Accumulator[] = [
  {
    id: "weekend-winners",
    title: "Weekend Winners",
    selections: [
      { team: "Arsenal to Win", odds: 2.1 },
      { team: "Man City to Win", odds: 1.95 },
      { team: "HIFK to Win", odds: 1.9 },
    ],
    winRate: 38,
  },
  {
    id: "ice-hockey-special",
    title: "Ice Hockey Special",
    selections: [
      { team: "Tappara to Win", odds: 1.75 },
      { team: "HIFK to Win", odds: 1.9 },
      { team: "Jokerit to Win", odds: 2.1 },
    ],
    winRate: 42,
  },
  {
    id: "european-double",
    title: "European Double",
    selections: [
      { team: "Real Madrid to Win", odds: 2.2 },
      { team: "Bayern Munich to Win", odds: 1.65 },
    ],
    winRate: 51,
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
  }),
  center: {
    x: 0,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
  }),
};

export function PreMadeAccumulators() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const isPausedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % ACCUMULATORS.length);
      }
    }, 6000);
  }, []); // stable — only uses refs and functional state setter

  useEffect(() => {
    startInterval();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startInterval]);

  const navigate = useCallback(
    (newIndex: number, dir: number) => {
      setDirection(dir);
      setCurrentIndex(newIndex);
      startInterval(); // reset timer on manual navigation
    },
    [startInterval]
  );

  const goNext = () => {
    navigate((currentIndex + 1) % ACCUMULATORS.length, 1);
  };

  const goPrev = () => {
    navigate(
      (currentIndex - 1 + ACCUMULATORS.length) % ACCUMULATORS.length,
      -1
    );
  };

  const handleMouseEnter = () => {
    isPausedRef.current = true;
  };
  const handleMouseLeave = () => {
    isPausedRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isPausedRef.current = true;
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null) {
      const delta = e.changedTouches[0].clientX - touchStartXRef.current;
      if (Math.abs(delta) > 50) {
        if (delta < 0) goNext();
        else goPrev();
      }
      touchStartXRef.current = null;
    }
    setTimeout(() => {
      isPausedRef.current = false;
    }, 4000);
  };

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-gray-900">
        Pre-Made Accumulators
      </h2>

      {/* Chevrons + card area */}
      <div className="relative">
        {/* Left chevron — hidden below sm (≈600px) */}
        <button
          onClick={goPrev}
          aria-label="Previous accumulator"
          className="absolute left-0 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-primary-600 hover:text-primary-600 sm:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Card viewport — clips the sliding animation */}
        <div
          className="overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "tween", ease: "easeInOut", duration: 0.28 }}
              className="w-full"
            >
              <AccumulatorCard accumulator={ACCUMULATORS[currentIndex]} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right chevron — hidden below sm (≈600px) */}
        <button
          onClick={goNext}
          aria-label="Next accumulator"
          className="absolute right-0 top-1/2 z-10 hidden translate-x-1/2 -translate-y-1/2 h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-primary-600 hover:text-primary-600 sm:flex"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation dots */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {ACCUMULATORS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (idx !== currentIndex)
                navigate(idx, idx > currentIndex ? 1 : -1);
            }}
            aria-label={`Go to accumulator ${idx + 1}`}
            className={`h-2 rounded-full transition-all duration-200 ${
              idx === currentIndex
                ? "w-5 bg-primary-600"
                : "w-2 bg-gray-200 hover:bg-gray-300"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

interface AccumulatorCardProps {
  accumulator: Accumulator;
}

function AccumulatorCard({ accumulator }: AccumulatorCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const { addSelection } = useBettingStore();
  const { showToast } = useToast();

  const combinedOdds = accumulator.selections.reduce(
    (acc, s) => acc * s.odds,
    1
  );
  const exampleStake = 10;
  const potentialReturn = exampleStake * combinedOdds;

  const getWinRateStyle = () => {
    if (accumulator.winRate < 40) return "text-warning-600";
    if (accumulator.winRate <= 50) return "text-gray-600";
    return "text-success-600";
  };

  const handleAddAll = () => {
    accumulator.selections.forEach((sel, index) => {
      const mockEvent: Event = {
        id: `premade-${accumulator.id}-${index}`,
        sport: "Football",
        league: "Accumulator",
        homeTeam: sel.team.replace(" to Win", ""),
        awayTeam: "TBD",
        startTime: new Date().toISOString(),
        isLive: false,
        markets: {
          "1X2": {
            "1": sel.odds,
            X: 3.0,
            "2": 3.0,
          },
        },
      };

      const selection: Selection = {
        id: `premade-${accumulator.id}-${index}`,
        event: mockEvent,
        market: "1X2",
        outcome: "1",
        outcomeLabel: sel.team,
        odds: sel.odds,
        stake: 0,
      };
      addSelection(selection);
    });

    showToast(
      `${accumulator.selections.length} selections added to slip`,
      "success"
    );
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const oddsFormula = accumulator.selections
    .map((s) => s.odds.toFixed(2))
    .join(" \u00D7 ");

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{accumulator.title}</h3>
        <span className="rounded-md bg-primary-50 px-2 py-1 text-sm font-semibold tabular-nums text-primary-700">
          {combinedOdds.toFixed(2)}
        </span>
      </div>

      {/* Selections */}
      <div className="mb-3 flex flex-col gap-1">
        {accumulator.selections.map((sel, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">{sel.team}</span>
            <span className="font-medium tabular-nums text-gray-900">
              {sel.odds.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="mb-3 border-t border-gray-100" />

      {/* Formula and calculation */}
      <div className="mb-2 text-xs text-gray-500">
        {oddsFormula} = {combinedOdds.toFixed(2)}
      </div>
      <div className="mb-2 text-sm font-medium text-gray-900">
        {"\u20AC"}
        {exampleStake} {"\u2192"} {"\u20AC"}
        {potentialReturn.toFixed(2)}
      </div>

      {/* Win rate */}
      <div
        className={`mb-3 flex items-center gap-1 text-sm ${getWinRateStyle()}`}
      >
        {accumulator.winRate < 40 && (
          <span className="text-warning-500">{"\u26A0\uFE0F"}</span>
        )}
        <span>Historical win rate: {accumulator.winRate}%</span>
      </div>

      {accumulator.winRate < 40 && (
        <p className="mb-3 text-xs text-gray-500">
          (This is a high-risk accumulator)
        </p>
      )}

      {/* Add button */}
      <button
        onClick={handleAddAll}
        disabled={isAdded}
        className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          isAdded
            ? "bg-success-600 text-white"
            : "bg-primary-600 text-white hover:bg-primary-700"
        }`}
      >
        {isAdded ? "\u2713 Added" : "Add to Slip"}
      </button>
    </div>
  );
}
