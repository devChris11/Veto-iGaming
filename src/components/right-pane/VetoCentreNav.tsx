"use client";

import { useState, useRef, useEffect } from "react";
import { Receipt, BarChart2, Sparkles, ShieldCheck, Menu } from "lucide-react";

const SECTIONS = [
  { id: "slip", label: "Slip", Icon: Receipt },
  { id: "stats", label: "Performance", Icon: BarChart2 },
  { id: "insights", label: "Insights", Icon: Sparkles },
  { id: "limits", label: "Limits", Icon: ShieldCheck },
];

interface VetoCentreNavProps {
  activeSection: string;
  onSectionClick: (id: string) => void;
}

export function VetoCentreNav({
  activeSection,
  onSectionClick,
}: VetoCentreNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef}>
      {/* Desktop nav — shown at lg and above */}
      <div className="hidden items-center justify-between border-b border-gray-200 px-4 py-3 lg:flex">
        <span className="text-lg font-bold text-gray-900">Veto Centre</span>
        <div className="flex items-center gap-1.5">
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onSectionClick(id)}
              className={
                activeSection === id
                  ? "rounded-full bg-primary-600 px-3 py-1.5 text-xs font-medium text-white"
                  : "rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-primary-400"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile nav — hidden at lg and above */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <span className="text-lg font-bold text-gray-900">Veto Centre</span>
          <button
            onClick={() => setIsOpen((v) => !v)}
            aria-label="Open navigation"
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="border-b border-gray-200 bg-white shadow-sm">
            {SECTIONS.map(({ id, label, Icon }, index) => (
              <div key={id}>
                <button
                  onClick={() => {
                    onSectionClick(id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    activeSection === id
                      ? "bg-primary-50 font-medium text-primary-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                  {activeSection === id && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-600" />
                  )}
                </button>
                {index < SECTIONS.length - 1 && (
                  <div className="mx-4 border-t border-gray-100" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
