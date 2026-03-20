"use client";

import { useState } from "react";
import type { Event, Selection } from "@/types/betting";
import { useBettingStore } from "@/lib/store";
import { useToast } from "@/components/shared/Toast";

interface LiveBettingCardsProps {
  events: Event[];
  onOddsClick?: () => void;
}

const SPORT_EMOJI: Record<string, string> = {
  Football: "\u26BD",
  "Ice Hockey": "\uD83C\uDFD2",
  Basketball: "\uD83C\uDFC0",
  Tennis: "\uD83C\uDFBE",
  Baseball: "\u26BE",
};

export function LiveBettingCards({
  events,
  onOddsClick,
}: LiveBettingCardsProps) {
  const liveEvents = events.filter((e) => e.isLive);

  if (liveEvents.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
        Live Now
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          {liveEvents.length}
        </span>
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {liveEvents.map((event) => (
          <LiveEventCard
            key={event.id}
            event={event}
            onOddsClick={onOddsClick}
          />
        ))}
      </div>
    </section>
  );
}

interface LiveEventCardProps {
  event: Event;
  onOddsClick?: () => void;
}

function LiveEventCard({ event, onOddsClick }: LiveEventCardProps) {
  const { selections, addSelection, removeSelection } = useBettingStore();
  const { showToast } = useToast();

  // Get score display
  const getScoreDisplay = () => {
    if (!event.score) return null;
    return `${event.score.home} - ${event.score.away}`;
  };

  const getTimeDisplay = () => {
    if (!event.score) return "";
    if (event.sport === "Football" && event.score.time) return event.score.time;
    if (event.sport === "Ice Hockey" && event.score.period)
      return event.score.period;
    return "";
  };

  // Get odds for display
  const getOdds = () => {
    if (event.markets["1X2"]) {
      return {
        type: "1X2" as const,
        outcomes: [
          { key: "1", label: "1", odds: event.markets["1X2"]["1"] },
          { key: "X", label: "X", odds: event.markets["1X2"].X },
          { key: "2", label: "2", odds: event.markets["1X2"]["2"] },
        ],
      };
    }
    if (event.markets.moneyline) {
      return {
        type: "moneyline" as const,
        outcomes: [
          { key: "home", label: "Home", odds: event.markets.moneyline.home },
          { key: "away", label: "Away", odds: event.markets.moneyline.away },
        ],
      };
    }
    return null;
  };

  const odds = getOdds();
  if (!odds) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="text-xs font-semibold text-red-600">LIVE</span>
          <span className="text-base">
            {SPORT_EMOJI[event.sport] || "\u26BD"}
          </span>
          <span className="text-xs text-gray-500">{event.league}</span>
        </div>
        {getTimeDisplay() && (
          <span className="text-xs font-medium text-gray-600">
            {getTimeDisplay()}
          </span>
        )}
      </div>

      {/* Score */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex-1 truncate text-sm font-medium text-gray-900">
          {event.homeTeam}
        </span>
        <span className="text-lg font-bold tabular-nums text-gray-900">
          {getScoreDisplay()}
        </span>
        <span className="flex-1 truncate text-right text-sm font-medium text-gray-900">
          {event.awayTeam}
        </span>
      </div>

      {/* Odds Buttons */}
      <div className="flex gap-1">
        {odds.outcomes.map((outcome) => (
          <OddsButton
            key={outcome.key}
            event={event}
            outcome={outcome.key}
            label={outcome.label}
            odds={outcome.odds}
            market={odds.type}
            selections={selections}
            addSelection={addSelection}
            removeSelection={removeSelection}
            showToast={showToast}
            onOddsClick={onOddsClick}
          />
        ))}
      </div>
    </div>
  );
}

interface OddsButtonProps {
  event: Event;
  outcome: string;
  label: string;
  odds: number;
  market: "1X2" | "moneyline";
  selections: Selection[];
  addSelection: (selection: Selection) => void;
  removeSelection: (id: string) => void;
  showToast: (message: string, type?: "success" | "info" | "warning") => void;
  onOddsClick?: () => void;
}

function OddsButton({
  event,
  outcome,
  label,
  odds,
  market,
  selections,
  addSelection,
  removeSelection,
  showToast,
  onOddsClick,
}: OddsButtonProps) {
  const [isFlashing, setIsFlashing] = useState(false);
  const selectionId = `${event.id}-${outcome}`;
  const isSelected = selections.some((s) => s.id === selectionId);

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
    return outcome;
  };

  const handleClick = () => {
    if (isSelected) {
      removeSelection(selectionId);
      showToast(`${getOutcomeLabel()} removed from slip`, "info");
    } else {
      // Flash green
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 150);

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

      // Switch to coupon tab on mobile after 300ms
      if (onOddsClick) {
        setTimeout(onOddsClick, 300);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex flex-1 flex-col items-center justify-center rounded-md border px-3 py-2 text-center transition-colors ${
        isFlashing
          ? "border-success-500 bg-success-500 text-white"
          : isSelected
            ? "border-primary-600 bg-primary-600 text-white"
            : "border-gray-200 bg-gray-50 text-primary-600 hover:bg-primary-50"
      }`}
    >
      <span className="text-xs text-inherit opacity-70">{label}</span>
      <span className="text-sm font-semibold tabular-nums">
        {odds.toFixed(2)}
      </span>
    </button>
  );
}
