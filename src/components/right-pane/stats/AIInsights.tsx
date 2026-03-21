"use client";

import { useState, useEffect } from "react";
import { Search, AlertTriangle, Clock } from "lucide-react";

interface Insight {
  id: string;
  category: "Pattern" | "Stakes" | "Timing";
  emoji: string;
  text: string;
}

const INSIGHT_POOL: Insight[] = [
  // Pattern Recognition
  {
    id: "pattern-1",
    category: "Pattern",
    emoji: "🎯",
    text: "You win 68% on Arsenal home games, but only 31% away.",
  },
  {
    id: "pattern-2",
    category: "Pattern",
    emoji: "📅",
    text: "Weekend bets: 52% win rate. Weekday bets: 38% win rate.",
  },
  {
    id: "pattern-3",
    category: "Pattern",
    emoji: "📊",
    text: "Your 1X2 bets: 48% win rate. Over/Under: 29% win rate.",
  },
  // Stake Optimization
  {
    id: "stakes-1",
    category: "Stakes",
    emoji: "💰",
    text: "Average winning bet: €15 stake. Average losing bet: €42 stake.",
  },
  {
    id: "stakes-2",
    category: "Stakes",
    emoji: "⚠️",
    text: "You've placed 8 bets over €50 this week with 25% win rate.",
  },
  {
    id: "stakes-3",
    category: "Stakes",
    emoji: "📈",
    text: "Stakes increase after losses. Last 4 losses: €10→€20→€40→€80.",
  },
  {
    id: "stakes-4",
    category: "Stakes",
    emoji: "💡",
    text: "Your €10-20 bets: 56% win rate. €50+ bets: 28% win rate.",
  },
  // Time-Based
  {
    id: "timing-1",
    category: "Timing",
    emoji: "🌙",
    text: "73% of bets placed after 10 PM with 28% win rate.",
  },
  {
    id: "timing-2",
    category: "Timing",
    emoji: "⏱️",
    text: "Sessions over 2 hours: 35% win rate. Under 1 hour: 58%.",
  },
  {
    id: "timing-3",
    category: "Timing",
    emoji: "⚡",
    text: "12 bets in 15 minutes yesterday with 8% win rate (rapid betting).",
  },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getRandomInsights(): Insight[] {
  return shuffleArray(INSIGHT_POOL).slice(0, 3);
}

function getIconComponent(category: Insight["category"]) {
  switch (category) {
    case "Pattern":
      return Search;
    case "Stakes":
      return AlertTriangle;
    case "Timing":
      return Clock;
  }
}

function getIconStyles(category: Insight["category"]) {
  switch (category) {
    case "Pattern":
      return { bg: "bg-blue-100", icon: "text-blue-600" };
    case "Stakes":
      return { bg: "bg-warning-100", icon: "text-warning-600" };
    case "Timing":
      return { bg: "bg-success-100", icon: "text-success-600" };
  }
}

interface AIInsightsProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function AIInsights({ isRefreshing }: AIInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>(() =>
    getRandomInsights()
  );

  // When the parent triggers a refresh, swap insights mid-spin
  useEffect(() => {
    if (!isRefreshing) return;
    const timer = setTimeout(() => {
      setInsights(getRandomInsights());
    }, 300);
    return () => clearTimeout(timer);
  }, [isRefreshing]);

  return (
    <div>
      {/* Individual insight cards */}
      <div className="space-y-3">
        {insights.map((insight) => {
          const IconComponent = getIconComponent(insight.category);
          const styles = getIconStyles(insight.category);

          return (
            <div
              key={insight.id}
              className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              {/* Icon square */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.bg}`}
              >
                <IconComponent className={`h-5 w-5 ${styles.icon}`} />
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs font-semibold text-gray-500">
                  {insight.category}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-gray-700">
                  {insight.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer — plain text, no container */}
      <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
        Insights are for awareness only — not tips to bet more. They highlight
        patterns in your history to support informed decisions.
      </p>
    </div>
  );
}
