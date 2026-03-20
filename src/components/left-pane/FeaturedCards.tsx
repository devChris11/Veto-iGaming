"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { InfoModal } from "@/components/shared";

const PROTOTYPE_NOTE =
  "This feature is intentionally non-functional in this prototype. In a production platform, these cards are CMS-driven — updated daily by the trading team and linked directly to live markets. They are included here to demonstrate awareness of this iGaming UX pattern, which is standard across Veikkaus, Bet365, and Betsson.";

interface FeaturedCard {
  id: number;
  title: string;
  subtitle: string;
  gradient: string;
  content: React.ReactNode;
  modalTitle: string;
  description: string;
}

const FEATURED_CARDS: FeaturedCard[] = [
  {
    id: 1,
    title: "Boosted Odds",
    subtitle: "Arsenal vs Chelsea",
    gradient: "from-red-500 to-orange-500",
    content: (
      <div className="flex items-baseline gap-2">
        <span className="text-lg text-white/70 line-through">3.40</span>
        <span className="text-2xl font-bold text-white">4.25</span>
      </div>
    ),
    modalTitle: "Boosted Odds",
    description:
      "Boosted Odds are manually promoted events where the operator has temporarily increased the odds above the standard market price. On a live platform, tapping this card takes you directly to that event with the boosted selection pre-highlighted and ready to add to your slip. Boosts are time-limited — they expire when the offer window closes or the event kicks off.",
  },
  {
    id: 2,
    title: "Quick Bets",
    subtitle: "Top picks today",
    gradient: "from-blue-500 to-cyan-500",
    content: <p className="text-sm text-white/90">Pre-selected value bets</p>,
    modalTitle: "Quick Bets",
    description:
      "Quick Bets are a curated shortlist of single-event selections chosen by the trading team for users who want to bet without browsing the full event list. On a live platform, tapping this card opens a condensed list of today's recommended singles — typically 5 to 10 picks across different sports — each with a one-tap Add to Slip button.",
  },
  {
    id: 3,
    title: "Banker Picks",
    subtitle: "High confidence selections",
    gradient: "from-purple-500 to-pink-500",
    content: (
      <p className="text-sm text-white/90">3 banker selections this week</p>
    ),
    modalTitle: "Banker Picks",
    description:
      "Banker Picks are high-confidence selections identified by the platform's analysts — events where the implied probability is considered stronger than the odds suggest. These are commonly used as the anchor leg of an accumulator. On a live platform, tapping this card shows this week's banker selections with supporting reasoning and an option to add them all to your slip.",
  },
  {
    id: 4,
    title: "Value Bets",
    subtitle: "Best odds vs probability",
    gradient: "from-green-500 to-emerald-500",
    content: <p className="text-sm text-white/90">8 value bets identified</p>,
    modalTitle: "Value Bets",
    description:
      "Value Bets are algorithmically identified opportunities where the bookmaker's odds imply a lower probability than statistical models suggest — meaning the potential return outweighs the assessed risk. On a live platform, tapping this card surfaces today's value opportunities ranked by expected value, helping experienced bettors find edges in the market.",
  },
];

export function FeaturedCards() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeModal, setActiveModal] = useState<FeaturedCard | null>(null);
  const isPausedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        setCurrentIndex((prev) => (prev + 1) % FEATURED_CARDS.length);
      }
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []); // empty deps — runs once, reads isPaused via ref (no stale closure)

  const handleMouseEnter = () => {
    isPausedRef.current = true;
  };
  const handleMouseLeave = () => {
    isPausedRef.current = false;
  };
  const handleTouchStart = () => {
    isPausedRef.current = true;
  };
  const handleTouchEnd = () => {
    setTimeout(() => {
      isPausedRef.current = false;
    }, 3000);
  };

  /* eslint-disable react-hooks/refs -- translateX step reads first card width + gap from trackRef */
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-gray-900">
        Today&apos;s Highlights
      </h2>

      <div
        className="relative -m-1 overflow-hidden p-1"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Sliding track — transform instead of scroll, no overflow-x conflict */}
        <div
          ref={trackRef}
          className="flex gap-4 transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(calc(-${currentIndex} * (${
              trackRef.current?.children[0]
                ? (trackRef.current.children[0] as HTMLElement).offsetWidth + 16
                : 0
            }px)))`,
          }}
        >
          {FEATURED_CARDS.map((card) => (
            <motion.button
              key={card.id}
              onClick={() => setActiveModal(card)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={`flex h-44 shrink-0 cursor-pointer flex-col justify-between rounded-xl
                bg-linear-to-r ${card.gradient} p-5 text-left
                w-[calc(100%-20%)] sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]`}
            >
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {card.title}
                </h3>
                <p className="text-sm text-white/80">{card.subtitle}</p>
              </div>
              <div className="mt-auto">{card.content}</div>
            </motion.button>
          ))}
        </div>
      </div>

      <InfoModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={activeModal?.modalTitle ?? ""}
        description={activeModal?.description ?? ""}
        prototypeNote={PROTOTYPE_NOTE}
      />
    </section>
  );
  /* eslint-enable react-hooks/refs */
}
