"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useBettingStore } from "@/lib/store";
import { BettingSlip } from "./BettingSlip";
import { StickyFooter } from "./StickyFooter";
import { BulkRemoveModal } from "./BulkRemoveModal";
import { VetoCentreNav } from "./VetoCentreNav";

interface RightPaneProps {
  accStake: number;
  setAccStake: (value: number) => void;
  doublesStake: number;
  setDoublesStake: (value: number) => void;
  treblesStake: number;
  setTreblesStake: (value: number) => void;
  fourFoldsStake: number;
  setFourFoldsStake: (value: number) => void;
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
}: RightPaneProps) {
  const selections = useBettingStore((state) => state.selections);
  const [showBulkRemoveModal, setShowBulkRemoveModal] = useState(false);
  const [activeSection, setActiveSection] = useState("slip");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const slipRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const insightsRef = useRef<HTMLDivElement>(null);
  const limitsRef = useRef<HTMLDivElement>(null);

  // Track which section is in view
  useEffect(() => {
    const refs = [
      { id: "slip", ref: slipRef },
      { id: "stats", ref: statsRef },
      { id: "insights", ref: insightsRef },
      { id: "limits", ref: limitsRef },
    ];

    const observers = refs.map(({ id, ref }) => {
      if (!ref.current) return null;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setActiveSection(id);
          }
        },
        { threshold: 0.3, root: scrollContainerRef.current }
      );
      observer.observe(ref.current);
      return observer;
    });

    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  const handleSectionClick = (id: string) => {
    const refMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
      slip: slipRef,
      stats: statsRef,
      insights: insightsRef,
      limits: limitsRef,
    };
    refMap[id]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
          <h3 className="mb-4 text-base font-semibold text-gray-900">Stats</h3>
          <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
            Trend cards coming in Shot 2
          </div>
        </div>

        {/* Insights section */}
        <div
          ref={insightsRef}
          id="insights"
          className="mt-10 border-t border-gray-100 pt-8"
        >
          <h3 className="mb-4 text-base font-semibold text-gray-900">
            Insights
          </h3>
          <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
            AI insights coming in Shot 2
          </div>
        </div>

        {/* Limits section */}
        <div
          ref={limitsRef}
          id="limits"
          className="mt-10 border-t border-gray-100 pt-8"
        >
          <h3 className="mb-4 text-base font-semibold text-gray-900">Limits</h3>
          <div className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
            Responsible gaming dashboard coming in Shot 2
          </div>
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
