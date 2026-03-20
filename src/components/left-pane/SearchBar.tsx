"use client";

import { useState, useRef, useEffect } from "react";
import type { Event } from "@/types/betting";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  events: Event[];
}

const SPORT_EMOJI: Record<string, string> = {
  Football: "\u26BD",
  "Ice Hockey": "\uD83C\uDFD2",
  Basketball: "\uD83C\uDFC0",
  Tennis: "\uD83C\uDFBE",
  Baseball: "\u26BE",
};

const POPULAR_SEARCHES = [
  "Premier League",
  "Ice Hockey Finland",
  "Champions League",
];
const RECENT_SEARCHES = ["HIFK", "Arsenal", "NBA"];

export function SearchBar({ onSearch, events }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter events based on query
  const filteredResults =
    query.length > 0
      ? events
          .filter((event) =>
            [event.homeTeam, event.awayTeam, event.league, event.sport].some(
              (field) => field.toLowerCase().includes(query.toLowerCase())
            )
          )
          .slice(0, 8)
      : [];

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleResultClick = (searchTerm: string) => {
    setQuery(searchTerm);
    onSearch(searchTerm);
    setIsFocused(false);
  };

  const clearSearch = () => {
    setQuery("");
    onSearch("");
    inputRef.current?.focus();
  };

  const showDropdown = isFocused;

  return (
    <div ref={containerRef} className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search events, teams, leagues..."
          className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
          {query.length === 0 ? (
            // Empty state: Popular + Recent
            <div className="max-h-80 overflow-y-auto">
              {/* Popular Searches (30%) */}
              <div className="border-b border-gray-100 p-3">
                <h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">
                  Popular
                </h4>
                <div className="flex flex-col gap-1">
                  {POPULAR_SEARCHES.map((search) => (
                    <button
                      key={search}
                      onClick={() => handleResultClick(search)}
                      className="rounded-md px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
              {/* Recent Searches (70%) */}
              <div className="p-3">
                <h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">
                  Recent
                </h4>
                <div className="flex flex-col gap-1">
                  {RECENT_SEARCHES.map((search) => (
                    <button
                      key={search}
                      onClick={() => handleResultClick(search)}
                      className="rounded-md px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : filteredResults.length > 0 ? (
            // Search results
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredResults.map((event) => (
                <button
                  key={event.id}
                  onClick={() =>
                    handleResultClick(`${event.homeTeam} vs ${event.awayTeam}`)
                  }
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-gray-50"
                >
                  <span className="text-base">
                    {SPORT_EMOJI[event.sport] || "\u26BD"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {event.homeTeam} vs {event.awayTeam}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {event.league}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // No results
            <div className="p-4 text-center text-sm text-gray-500">
              No events found for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
