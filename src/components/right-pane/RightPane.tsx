"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type MutableRefObject,
} from "react";
import { Trash2, RefreshCw } from "lucide-react";
import { useBettingStore } from "@/lib/store";
import { BettingSlip } from "./BettingSlip";
import { StickyFooter } from "./StickyFooter";
import { BulkRemoveModal } from "./BulkRemoveModal";
import { VetoCentreNav } from "./VetoCentreNav";
import { TrendCards } from "./stats/TrendCards";
import { AIInsights } from "./stats/AIInsights";
import { ResponsibleGaming } from "./limits/ResponsibleGaming";

interface RightPaneProps {
  accStake: number;
  setAccStake: (value: number) => void;
  doublesStake: number;
  setDoublesStake: (value: number) => void;
  treblesStake: number;
  setTreblesStake: (value: number) => void;
  fourFoldsStake: number;
  setFourFoldsStake: (value: number) => void;
  activeSection: string;
  onSectionClick: (id: string) => void;
  onSectionClickRef?: MutableRefObject<((id: string) => void) | null>;
}

export function RightPane({
  accStake,
  setAccStake,
  doublesStake,
  setDoublesStake,
  treblesStake,
  setTreblesStake,
  fourFoldsStake,
  setFourFoldsStake,
  activeSection,
  onSectionClick,
  onSectionClickRef,
}: RightPaneProps) {
  const selections = useBettingStore((state) => state.selections);
  const [showBulkRemoveModal, setShowBulkRemoveModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleInsightRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const slipRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const insightsRef = useRef<HTMLDivElement>(null);
  const limitsRef = useRef<HTMLDivElement>(null);
  const isScrollingToSectionRef = useRef(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // If we are programmatically scrolling to a section, skip
      // scroll-based detection until the animation completes
      if (isScrollingToSectionRef.current) return;

      const container = scrollContainerRef.current;
      if (!container) return;

      const sections = [
        { id: "slip", ref: slipRef },
        { id: "stats", ref: statsRef },
        { id: "insights", ref: insightsRef },
        { id: "limits", ref: limitsRef },
      ];

      const OFFSET = 120;
      let current = "slip";
      let smallestNegative = -Infinity;

      for (const { id, ref } of sections) {
        if (!ref.current) continue;
        const top =
          ref.current.getBoundingClientRect().top -
          container.getBoundingClientRect().top;

        if (top - OFFSET <= 0) {
          if (top > smallestNegative) {
            smallestNegative = top;
            current = id;
          }
        }
      }

      onSectionClick(current);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // set correct state on mount

    return () => container.removeEventListener("scroll", handleScroll);
  }, []); // empty deps — onSectionClick is parent setState (stable); scroll uses latest via closure on mount

  const handleSectionClick = (id: string) => {
    onSectionClick(id);

    // Lock scroll listener for 600ms to prevent the scroll
    // animation from overwriting the clicked active state
    isScrollingToSectionRef.current = true;
    setTimeout(() => {
      isScrollingToSectionRef.current = false;
    }, 600);

    const refMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
      slip: slipRef,
      stats: statsRef,
      insights: insightsRef,
      limits: limitsRef,
    };
    refMap[id]?.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  useEffect(() => {
    if (onSectionClickRef) {
      onSectionClickRef.current = handleSectionClick;
    }
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Sticky section nav */}
      <VetoCentreNav
        activeSection={activeSection}
        onSectionClick={handleSectionClick}
      />

      {/* Scrollable content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 pb-24"
      >
        {/* Slip section */}
        <div ref={slipRef} id="slip">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              Betting Slip
            </h3>
            {selections.length > 0 && (
              <button
                onClick={() => setShowBulkRemoveModal(true)}
                className="flex items-center gap-1.5 rounded-md border border-error-300 px-3 py-1.5 text-xs font-medium text-error-600 transition-colors hover:bg-error-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove All
              </button>
            )}
          </div>
          <BettingSlip
            accStake={accStake}
            setAccStake={setAccStake}
            doublesStake={doublesStake}
            setDoublesStake={setDoublesStake}
            treblesStake={treblesStake}
            setTreblesStake={setTreblesStake}
            fourFoldsStake={fourFoldsStake}
            setFourFoldsStake={setFourFoldsStake}
          />
        </div>

        {/* Stats section */}
        <div
          ref={statsRef}
          id="stats"
          className="mt-10 border-t border-gray-100 pt-8"
        >
          <h3 className="mb-4 text-base font-semibold text-gray-900">
            Performance
          </h3>
          <TrendCards />
        </div>

        {/* Insights section */}
        <div
          ref={insightsRef}
          id="insights"
          className="mt-10 border-t border-gray-100 pt-8"
        >
          {/* Heading row — refresh button inline */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              AI Insights
            </h3>
            <button
              onClick={handleInsightRefresh}
              disabled={isRefreshing}
              className="rounded-md p-1.5 text-primary-600 transition-colors hover:bg-primary-50 disabled:opacity-50"
              aria-label="Refresh insights"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          <AIInsights
            onRefresh={handleInsightRefresh}
            isRefreshing={isRefreshing}
          />
        </div>

        {/* Limits section */}
        <div
          ref={limitsRef}
          id="limits"
          className="mt-10 border-t border-gray-100 pt-8"
        >
          <h3 className="mb-4 text-base font-semibold text-gray-900">Limits</h3>
          <ResponsibleGaming />
        </div>
      </div>

      {/* Sticky footer */}
      <StickyFooter
        accStake={accStake}
        doublesStake={doublesStake}
        treblesStake={treblesStake}
        fourFoldsStake={fourFoldsStake}
        resetStakes={() => {
          setAccStake(0);
          setDoublesStake(0);
          setTreblesStake(0);
          setFourFoldsStake(0);
        }}
      />

      {/* Bulk Remove Modal */}
      <BulkRemoveModal
        isOpen={showBulkRemoveModal}
        onClose={() => setShowBulkRemoveModal(false)}
        selectionCount={selections.length}
      />
    </div>
  );
}
