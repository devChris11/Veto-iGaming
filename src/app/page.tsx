"use client";

import { useState, useEffect, useRef } from "react";
import { LeftPane } from "@/components/left-pane";
import { RightPane } from "@/components/right-pane";
import { AppHeader, ToastProvider, MobileTabBar } from "@/components/shared";
import eventsData from "@/data/events.json";
import type { Event } from "@/types/betting";

export default function Home() {
  const rightPaneSectionClickRef = useRef<((id: string) => void) | null>(null);
  const [activeTab, setActiveTab] = useState<"browse" | "coupon">("browse");
  const [activeSection, setActiveSection] = useState("slip");
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  // Lifted state for stakes (reset when bet is placed)
  const [accStake, setAccStake] = useState(0);
  const [doublesStake, setDoublesStake] = useState(0);
  const [treblesStake, setTreblesStake] = useState(0);
  const [fourFoldsStake, setFourFoldsStake] = useState(0);

  // Type cast the events data
  const events = eventsData.events as unknown as Event[];

  // Handle responsive breakpoint
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 900);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  return (
    <ToastProvider>
      <AppHeader
        activeTab={isDesktop ? null : activeTab}
        activeSection={activeSection}
        onSectionClick={(id) => {
          setActiveSection(id);
          rightPaneSectionClickRef.current?.(id);
        }}
      />
      {isDesktop === null ? null : isDesktop ? (
        // Desktop layout: side-by-side
        <main className="flex h-[calc(100dvh-56px)] overflow-hidden">
          {/* Left Pane - 50% */}
          <div className="w-1/2 overflow-y-auto">
            <LeftPane events={events} />
          </div>

          {/* Right Pane - 50% */}
          <div className="w-1/2 overflow-hidden border-l border-gray-200">
            <RightPane
              accStake={accStake}
              setAccStake={setAccStake}
              doublesStake={doublesStake}
              setDoublesStake={setDoublesStake}
              treblesStake={treblesStake}
              setTreblesStake={setTreblesStake}
              fourFoldsStake={fourFoldsStake}
              setFourFoldsStake={setFourFoldsStake}
              activeSection={activeSection}
              onSectionClick={setActiveSection}
              onSectionClickRef={rightPaneSectionClickRef}
            />
          </div>
        </main>
      ) : (
        // Mobile/Tablet layout: tab-based
        <main className="flex h-[calc(100dvh-56px)] flex-col overflow-hidden">
          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "browse" ? (
              <LeftPane events={events} />
            ) : (
              <RightPane
                accStake={accStake}
                setAccStake={setAccStake}
                doublesStake={doublesStake}
                setDoublesStake={setDoublesStake}
                treblesStake={treblesStake}
                setTreblesStake={setTreblesStake}
                fourFoldsStake={fourFoldsStake}
                setFourFoldsStake={setFourFoldsStake}
                activeSection={activeSection}
                onSectionClick={setActiveSection}
                onSectionClickRef={rightPaneSectionClickRef}
              />
            )}
          </div>

          {/* Mobile Tab Bar */}
          <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </main>
      )}
    </ToastProvider>
  );
}
