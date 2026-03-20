"use client";

import { useState, useEffect } from "react";
import { LeftPane } from "@/components/left-pane";
import { ToastProvider, MobileTabBar } from "@/components/shared";
import eventsData from "@/data/events.json";
import type { Event } from "@/types/betting";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"browse" | "coupon">("browse");
  const [isDesktop, setIsDesktop] = useState(false);

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

  // Switch to coupon tab on mobile when odds are clicked
  const handleOddsClick = () => {
    if (!isDesktop) {
      setActiveTab("coupon");
    }
  };

  return (
    <ToastProvider>
      {isDesktop ? (
        // Desktop layout: side-by-side
        <main className="flex h-screen overflow-hidden">
          {/* Left Pane - 50% */}
          <div className="w-1/2 overflow-y-auto">
            <LeftPane events={events} onOddsClick={handleOddsClick} />
          </div>

          {/* Right Pane - 50% */}
          <div className="w-1/2 overflow-y-auto border-l border-gray-200 bg-white">
            <div className="flex h-full items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-lg font-medium">Betting Slip</p>
                <p className="text-sm">Coming in Milestone 4</p>
              </div>
            </div>
          </div>
        </main>
      ) : (
        // Mobile/Tablet layout: tab-based
        <main className="flex h-screen flex-col overflow-hidden">
          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "browse" ? (
              <LeftPane events={events} onOddsClick={handleOddsClick} />
            ) : (
              <div className="flex h-full items-center justify-center bg-white text-gray-400">
                <div className="text-center">
                  <p className="text-lg font-medium">Betting Slip</p>
                  <p className="text-sm">Coming in Milestone 4</p>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Tab Bar */}
          <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />
        </main>
      )}
    </ToastProvider>
  );
}
