"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Event, Selection } from "@/types/betting";
import { useBettingStore } from "@/lib/store";
import { useToast } from "@/components/shared/Toast";
import { motion } from "framer-motion";
import { fadeInUp, stagger } from "@/lib/motion";

interface BettingTableProps {
  events: Event[];
  showSportHeaders: boolean;
  onOddsClick?: () => void;
}

const SPORT_EMOJI: Record<string, string> = {
  Football: "\u26BD",
  "Ice Hockey": "\uD83C\uDFD2",
  Basketball: "\uD83C\uDFC0",
  Tennis: "\uD83C\uDFBE",
  Baseball: "\u26BE",
};

const BATCH_SIZE = 20;

export function BettingTable({
  events,
  showSportHeaders,
  onOddsClick,
}: BettingTableProps) {
  const [displayCount, setDisplayCount] = useState(BATCH_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { selections, addSelection, removeSelection } = useBettingStore();
  const { showToast } = useToast();

  const displayedEvents = events.slice(0, displayCount);
  const hasMore = displayCount < events.length;

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setIsLoading(true);
          // Simulate loading delay for smoother UX
          setTimeout(() => {
            setDisplayCount((prev) =>
              Math.min(prev + BATCH_SIZE, events.length)
            );
            setIsLoading(false);
          }, 300);
        }
      },
      { threshold: 0.8 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, events.length]);

  // Group events by sport if showing headers
  const groupedEvents = useMemo(() => {
    if (!showSportHeaders) {
      return [{ sport: null, events: displayedEvents }];
    }

    const groups: { sport: string; events: Event[] }[] = [];
    const sportMap = new Map<string, Event[]>();

    displayedEvents.forEach((event) => {
      const existing = sportMap.get(event.sport);
      if (existing) {
        existing.push(event);
      } else {
        sportMap.set(event.sport, [event]);
      }
    });

    // Maintain order: Football, Ice Hockey, Basketball, Tennis, Baseball
    const sportOrder = [
      "Football",
      "Ice Hockey",
      "Basketball",
      "Tennis",
      "Baseball",
    ];
    sportOrder.forEach((sport) => {
      const sportEvents = sportMap.get(sport);
      if (sportEvents && sportEvents.length > 0) {
        groups.push({ sport, events: sportEvents });
      }
    });

    return groups;
  }, [displayedEvents, showSportHeaders]);

  const handleOddsClick = useCallback(
    (event: Event, outcome: string, market: string, odds: number) => {
      const selectionId = `${event.id}-${outcome}`;
      const isSelected = selections.some((s) => s.id === selectionId);

      if (isSelected) {
        removeSelection(selectionId);
        showToast(`Selection removed from slip`, "info");
      } else {
        const getOutcomeLabel = () => {
          if (market === "1X2") {
            if (outcome === "1") return `${event.homeTeam} to Win`;
            if (outcome === "X") return "Draw";
            if (outcome === "2") return `${event.awayTeam} to Win`;
          }
          if (market === "moneyline") {
            if (outcome === "home") return `${event.homeTeam} to Win`;
            if (outcome === "away") return `${event.awayTeam} to Win`;
          }
          if (market === "OverUnder") {
            if (outcome === "over25") return "Over 2.5 Goals";
            if (outcome === "under25") return "Under 2.5 Goals";
          }
          return outcome;
        };

        const selection: Selection = {
          id: selectionId,
          event,
          market,
          outcome,
          outcomeLabel: getOutcomeLabel(),
          odds,
          stake: 0,
        };
        addSelection(selection);
        showToast(`${getOutcomeLabel()} added to slip`, "success");

        // Switch to coupon on mobile
        if (onOddsClick) {
          setTimeout(onOddsClick, 300);
        }
      }
    },
    [selections, addSelection, removeSelection, showToast, onOddsClick]
  );

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-gray-500">No events found</p>
        <p className="text-sm text-gray-400">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <section>
      <motion.div variants={stagger} initial="initial" animate="animate">
        {groupedEvents.map((group) => (
          <div key={group.sport || "all"}>
            {/* Sport Header */}
            {group.sport && (
              <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 bg-gray-50 py-2">
                <span className="text-lg">{SPORT_EMOJI[group.sport]}</span>
                <h3 className="font-semibold text-gray-900">{group.sport}</h3>
                <span className="text-sm text-gray-500">
                  ({events.filter((e) => e.sport === group.sport).length})
                </span>
              </div>
            )}

            {/* Event Cards */}
            {group.events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                selections={selections}
                onOddsClick={handleOddsClick}
              />
            ))}
          </div>
        ))}
      </motion.div>

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-4" />

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        </div>
      )}

      {/* All loaded message */}
      {!hasMore && events.length > BATCH_SIZE && (
        <p className="py-4 text-center text-sm text-gray-500">
          All events loaded
        </p>
      )}
    </section>
  );
}

interface EventCardProps {
  event: Event;
  selections: Selection[];
  onOddsClick: (
    event: Event,
    outcome: string,
    market: string,
    odds: number
  ) => void;
}

function EventCard({ event, selections, onOddsClick }: EventCardProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const timeStr = date.toLocaleTimeString("fi-FI", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (date.toDateString() === now.toDateString()) {
      return timeStr;
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow ${timeStr}`;
    }
    return date.toLocaleDateString("fi-FI", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const getOddsButtons = () => {
    if (event.markets["1X2"]) {
      return [
        {
          key: "1",
          label: "1",
          odds: event.markets["1X2"]["1"],
          market: "1X2",
        },
        { key: "X", label: "X", odds: event.markets["1X2"].X, market: "1X2" },
        {
          key: "2",
          label: "2",
          odds: event.markets["1X2"]["2"],
          market: "1X2",
        },
      ];
    }
    if (event.markets.moneyline) {
      return [
        {
          key: "home",
          label: "Home",
          odds: event.markets.moneyline.home,
          market: "moneyline",
        },
        {
          key: "away",
          label: "Away",
          odds: event.markets.moneyline.away,
          market: "moneyline",
        },
      ];
    }
    if (event.markets.OverUnder) {
      return [
        {
          key: "over25",
          label: "O2.5",
          odds: event.markets.OverUnder.over25,
          market: "OverUnder",
        },
        {
          key: "under25",
          label: "U2.5",
          odds: event.markets.OverUnder.under25,
          market: "OverUnder",
        },
      ];
    }
    return [];
  };

  const oddsButtons = getOddsButtons();

  return (
    <motion.div
      variants={fadeInUp}
      className="mb-2 rounded-lg border border-gray-200 bg-white p-4 shadow"
    >
      {/* Top row */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">
          {event.league}
        </span>
        {event.isLive ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
            LIVE {event.score?.time ?? ""}
          </span>
        ) : (
          <span className="text-xs text-gray-500">
            {formatTime(event.startTime)}
          </span>
        )}
      </div>

      {/* Main row: Teams + Odds */}
      <div className="flex items-center justify-between gap-2">
        <span className="flex-1 truncate text-sm font-medium text-gray-900">
          {event.homeTeam}
        </span>
        {/* Odds buttons */}
        <div className="flex gap-1">
          {oddsButtons.map((btn) => (
            <OddsButton
              key={btn.key}
              eventId={event.id}
              outcomeKey={btn.key}
              label={btn.label}
              odds={btn.odds}
              isSelected={selections.some(
                (s) => s.id === `${event.id}-${btn.key}`
              )}
              onClick={() => onOddsClick(event, btn.key, btn.market, btn.odds)}
            />
          ))}
        </div>
        <span className="flex-1 truncate text-right text-sm font-medium text-gray-900">
          {event.awayTeam}
        </span>
      </div>
    </motion.div>
  );
}

interface OddsButtonProps {
  eventId: string;
  outcomeKey: string;
  label: string;
  odds: number;
  isSelected: boolean;
  onClick: () => void;
}

function OddsButton({ label, odds, isSelected, onClick }: OddsButtonProps) {
  const [isFlashing, setIsFlashing] = useState(false);

  const handleClick = () => {
    if (!isSelected) {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 150);
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`min-w-[52px] rounded-md border px-3 py-2 text-center text-sm font-semibold tabular-nums transition-colors ${
        isFlashing
          ? "border-success-500 bg-success-500 text-white"
          : isSelected
            ? "border-primary-600 bg-primary-600 text-white"
            : "border-gray-200 bg-gray-50 text-primary-600 hover:bg-primary-50"
      }`}
    >
      <span className="block text-xs font-medium opacity-70">{label}</span>
      <span className="block">{odds.toFixed(2)}</span>
    </button>
  );
}
