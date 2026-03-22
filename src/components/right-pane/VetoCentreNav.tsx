"use client";

const SECTIONS = [
  { id: "slip", label: "Slip" },
  { id: "stats", label: "Performance" },
  { id: "insights", label: "Insights" },
  { id: "limits", label: "Limits" },
];

interface VetoCentreNavProps {
  activeSection: string;
  onSectionClick: (id: string) => void;
}

export function VetoCentreNav({
  activeSection,
  onSectionClick,
}: VetoCentreNavProps) {
  return (
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
  );
}
