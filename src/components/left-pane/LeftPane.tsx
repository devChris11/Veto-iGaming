"use client";

import { useState, useMemo } from "react";
import type { Event } from "@/types/betting";
import { SearchBar } from "./SearchBar";
import { CategoryNav } from "./CategoryNav";
import { FeaturedCards } from "./FeaturedCards";
import { LiveBettingCards } from "./LiveBettingCards";
import { PreMadeAccumulators } from "./PreMadeAccumulators";
import { BettingTable } from "./BettingTable";

interface LeftPaneProps {
  events: Event[];
  onOddsClick?: () => void;
}

export function LeftPane({ events, onOddsClick }: LeftPaneProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSport, setActiveSport] = useState<string | null>(null);
  const [activeLeague, setActiveLeague] = useState<string | null>(null);

  // Filtering logic
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((e) =>
        [e.homeTeam, e.awayTeam, e.league, e.sport].some((s) =>
          s.toLowerCase().includes(query)
        )
      );
    }

    // Sport filter
    if (activeSport) {
      filtered = filtered.filter((e) => e.sport === activeSport);
    }

    // League filter (handle special cases)
    if (activeLeague) {
      // Handle "All [Sport]" options
      if (activeLeague.startsWith("All ")) {
        // Already filtered by sport, no additional league filter needed
      } else if (activeLeague === "All Events") {
        // Show all
      } else if (activeLeague === "Live Now") {
        filtered = filtered.filter((e) => e.isLive);
      } else if (activeLeague === "Today") {
        const today = new Date().toDateString();
        filtered = filtered.filter(
          (e) => new Date(e.startTime).toDateString() === today
        );
      } else if (activeLeague === "Tomorrow") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toDateString();
        filtered = filtered.filter(
          (e) => new Date(e.startTime).toDateString() === tomorrowStr
        );
      } else {
        // Specific league filter
        filtered = filtered.filter((e) => e.league === activeLeague);
      }
    }

    return filtered;
  }, [events, searchQuery, activeSport, activeLeague]);

  const handleFilter = (sport: string | null, league: string | null) => {
    setActiveSport(sport);
    setActiveLeague(league);
  };

  // Determine if we should show sport headers in the betting table
  const showSportHeaders = !activeSport && !searchQuery;

  // Determine if we should show certain sections
  const showFeatured = !searchQuery;
  const showLive = !searchQuery && !activeSport;
  const showAccumulators = !searchQuery;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-gray-50 px-4 py-4 pb-20">
      <div className="flex flex-col gap-6">
        {/* Search Bar */}
        <SearchBar onSearch={setSearchQuery} events={events} />

        {/* Category Navigation */}
        <CategoryNav
          onFilter={handleFilter}
          activeSport={activeSport}
          activeLeague={activeLeague}
        />

        {/* Featured Cards */}
        {showFeatured && <FeaturedCards />}

        {/* Live Betting Cards */}
        {showLive && (
          <LiveBettingCards events={events} onOddsClick={onOddsClick} />
        )}

        {/* Pre-Made Accumulators */}
        {showAccumulators && <PreMadeAccumulators />}

        {/* Betting Table */}
        <BettingTable
          key={`${activeSport ?? "all"}-${activeLeague ?? "all"}-${searchQuery}`}
          events={filteredEvents}
          showSportHeaders={showSportHeaders}
          onOddsClick={onOddsClick}
        />
      </div>
    </div>
  );
}
