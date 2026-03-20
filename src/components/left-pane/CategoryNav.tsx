"use client";

import { useRef } from "react";

interface CategoryNavProps {
  onFilter: (sport: string | null, league: string | null) => void;
  activeSport: string | null;
  activeLeague: string | null;
}

const PRIMARY_CATEGORIES = [
  "All",
  "Football",
  "Ice Hockey",
  "Basketball",
  "Tennis",
  "Baseball",
];

const SECONDARY_OPTIONS: Record<string, string[]> = {
  All: ["All Events", "Live Now", "Today", "Tomorrow"],
  Football: [
    "All Football",
    "Premier League",
    "La Liga",
    "Bundesliga",
    "Champions League",
    "Veikkausliiga",
  ],
  "Ice Hockey": ["All Ice Hockey", "Finnish Liiga", "NHL", "KHL", "SHL"],
  Basketball: ["All Basketball", "NBA", "EuroLeague"],
  Tennis: ["All Tennis", "ATP Miami Open", "WTA"],
  Baseball: ["All Baseball", "MLB"],
};

export function CategoryNav({
  onFilter,
  activeSport,
  activeLeague,
}: CategoryNavProps) {
  const primaryRef = useRef<HTMLDivElement>(null);
  const secondaryRef = useRef<HTMLDivElement>(null);

  const currentPrimary = activeSport || "All";
  const secondaryOptions =
    SECONDARY_OPTIONS[currentPrimary] || SECONDARY_OPTIONS.All;
  const currentSecondary = activeLeague || secondaryOptions[0];

  const handlePrimaryClick = (category: string) => {
    const sport = category === "All" ? null : category;
    const defaultSecondary = SECONDARY_OPTIONS[category]?.[0] || null;
    onFilter(sport, defaultSecondary);
  };

  const handleSecondaryClick = (option: string) => {
    onFilter(activeSport, option);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Primary Navigation */}
      <div
        ref={primaryRef}
        className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {PRIMARY_CATEGORIES.map((category) => {
          const isActive = currentPrimary === category;
          return (
            <button
              key={category}
              onClick={() => handlePrimaryClick(category)}
              className={`shrink-0 border-b-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "border-primary-600 text-primary-600 font-semibold"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Secondary Navigation (Pills) */}
      <div
        ref={secondaryRef}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {secondaryOptions.map((option) => {
          const isActive = currentSecondary === option;
          return (
            <button
              key={option}
              onClick={() => handleSecondaryClick(option)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-primary-600 text-white"
                  : "border border-gray-300 text-gray-600 hover:border-primary-400"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
