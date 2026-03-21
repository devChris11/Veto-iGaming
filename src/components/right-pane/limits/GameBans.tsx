"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Ban, AlertTriangle, ExternalLink } from "lucide-react";
import { useToast } from "@/components/shared/Toast";

const BAN_ALL_KEY = "veto_ban_all_start";
const BAN_ALL_DURATION = 24 * 60 * 60; // 24 hours in seconds

// All available game types
const ALL_GAMES = [
  "Sports Betting",
  "Slots",
  "Live Casino",
  "Poker",
  "Blackjack",
  "Roulette",
  "Baccarat",
  "Scratch Cards",
  "Virtual Sports",
  "Bingo",
] as const;

type GameType = (typeof ALL_GAMES)[number];

interface BannedGame {
  name: GameType;
  bannedAt: Date;
}

// Initial banned games for MVP (simulation)
const INITIAL_BANNED: BannedGame[] = [
  {
    name: "Blackjack",
    bannedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  }, // 3 days ago
  { name: "Slots", bannedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }, // 2 weeks ago
  {
    name: "Live Casino",
    bannedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  }, // 1 month ago
];

export function GameBans() {
  const { showToast } = useToast();
  const [bannedGames, setBannedGames] = useState<BannedGame[]>(INITIAL_BANNED);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isSelfExcludeModalOpen, setIsSelfExcludeModalOpen] = useState(false);
  const [banAllActive, setBanAllActive] = useState(false);
  const [banAllCooldownSeconds, setBanAllCooldownSeconds] = useState(0);

  // On mount — check localStorage for active ban-all cooling-off
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const banStart = localStorage.getItem(BAN_ALL_KEY);
        if (banStart) {
          const elapsed = Math.floor(
            (Date.now() - parseInt(banStart, 10)) / 1000
          );
          const remaining = BAN_ALL_DURATION - elapsed;
          if (remaining > 0) {
            setBanAllActive(true);
            setBanAllCooldownSeconds(remaining);
          } else {
            localStorage.removeItem(BAN_ALL_KEY);
          }
        }
      } catch {
        // SSR safety
      }
    });
  }, []);

  // Cooldown countdown
  useEffect(() => {
    if (!banAllActive) return;
    const interval = setInterval(() => {
      setBanAllCooldownSeconds((prev) => {
        if (prev <= 1) {
          setBanAllActive(false);
          try {
            localStorage.removeItem(BAN_ALL_KEY);
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [banAllActive]);

  const formatCooldown = (seconds: number): string => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // Sort by most recent first
  const sortedBans = [...bannedGames].sort(
    (a, b) => b.bannedAt.getTime() - a.bannedAt.getTime()
  );

  const formatBanDuration = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "banned today";
    if (diffDays === 1) return "banned yesterday";
    if (diffDays < 7) return `banned ${diffDays} days ago`;
    if (diffDays < 14) return "banned 1 week ago";
    if (diffDays < 30) return `banned ${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 60) return "banned 1 month ago";
    return `banned ${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
        {/* Watermark */}
        <div className="pointer-events-none absolute -right-3 -top-3 text-amber-200 opacity-20">
          <Ban className="h-24 w-24" />
        </div>

        {/* Label row */}
        <div className="mb-3 flex items-center gap-1.5">
          <Ban className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
            Game Bans
          </span>
        </div>

        {/* Currently banned */}
        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold text-gray-900">
            Currently Banned ({bannedGames.length}):
          </p>
          {sortedBans.length > 0 ? (
            <ul className="space-y-1">
              {sortedBans.map((game) => (
                <li
                  key={game.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-700">{game.name}</span>
                  <span className="text-xs text-gray-500">
                    {formatBanDuration(game.bannedAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No games currently banned</p>
          )}
        </div>

        {/* Ban-all cooling-off indicator */}
        {banAllActive && (
          <div className="mb-3 rounded-lg border border-error-200 bg-error-50 px-3 py-2">
            <p className="text-xs font-semibold text-error-700">
              All games banned — cooling-off period active
            </p>
            <p className="tabular-nums text-xs text-error-600">
              Lifts in: {formatCooldown(banAllCooldownSeconds)}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsManageModalOpen(true)}
            className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-50"
          >
            Manage Bans
          </button>
          <button
            onClick={() => setIsSelfExcludeModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-error-300 px-3 py-1.5 text-xs font-medium text-error-600 transition-colors hover:bg-error-50"
          >
            <AlertTriangle className="h-3 w-3" />
            Self-Exclude (National DB)
          </button>
        </div>
      </div>

      {/* Manage Bans Modal */}
      <ManageBansModal
        key={`${isManageModalOpen}-${bannedGames
          .map((g) => g.name)
          .sort()
          .join(",")}`}
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        bannedGames={bannedGames}
        onSave={(newBans) => {
          setBannedGames(newBans);
          showToast("Game bans updated", "success");
        }}
        onBanAll={() => {
          const now = Date.now().toString();
          try {
            localStorage.setItem(BAN_ALL_KEY, now);
          } catch {}
          setBanAllActive(true);
          setBanAllCooldownSeconds(BAN_ALL_DURATION);
        }}
      />

      {/* Self-Exclude Warning Modal */}
      <SelfExcludeModal
        isOpen={isSelfExcludeModalOpen}
        onClose={() => setIsSelfExcludeModalOpen(false)}
      />
    </>
  );
}

// ============================================================
// MANAGE BANS MODAL
// ============================================================

interface ManageBansModalProps {
  isOpen: boolean;
  onClose: () => void;
  bannedGames: BannedGame[];
  onSave: (newBans: BannedGame[]) => void;
  onBanAll: () => void;
}

function ManageBansModal({
  isOpen,
  onClose,
  bannedGames,
  onSave,
  onBanAll,
}: ManageBansModalProps) {
  const [selectedGames, setSelectedGames] = useState<Set<GameType>>(() => {
    return new Set(bannedGames.map((g) => g.name)) as Set<GameType>;
  });
  const [banAll, setBanAll] = useState(false);
  const [previousSelection, setPreviousSelection] = useState<Set<GameType>>(
    () => new Set(bannedGames.map((g) => g.name)) as Set<GameType>
  );

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleGameToggle = (game: GameType) => {
    if (banAll) return; // Individual toggles disabled when "ban all" is checked

    setSelectedGames((prev) => {
      const next = new Set(prev);
      if (next.has(game)) {
        next.delete(game);
      } else {
        next.add(game);
      }
      return next;
    });
  };

  const handleBanAllToggle = () => {
    if (!banAll) {
      // Turning on "ban all" - save current selection and select all
      setPreviousSelection(new Set(selectedGames));
      setSelectedGames(new Set(ALL_GAMES));
    } else {
      // Turning off "ban all" - restore previous selection
      setSelectedGames(previousSelection);
    }
    setBanAll(!banAll);
  };

  const handleSave = () => {
    const existingBansMap = new Map(
      bannedGames.map((g) => [g.name, g.bannedAt])
    );

    const newBans: BannedGame[] = Array.from(selectedGames).map((name) => ({
      name,
      bannedAt: existingBansMap.get(name) || new Date(),
    }));

    onSave(newBans);

    // Activate cooling-off if all games are banned
    if (selectedGames.size === ALL_GAMES.length) {
      onBanAll();
    }

    onClose();
  };

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-200 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-bans-modal-title"
            className="fixed inset-x-4 bottom-6 z-200 mx-auto max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="max-h-[80vh] overflow-y-auto p-6">
              {/* Title */}
              <h2
                id="manage-bans-modal-title"
                className="mb-4 text-xl font-bold text-gray-900"
              >
                Select Games to Ban
              </h2>

              {/* Game checkboxes */}
              <div className="mb-4 space-y-2">
                {ALL_GAMES.map((game) => (
                  <label
                    key={game}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      banAll
                        ? "cursor-not-allowed border-gray-100 bg-gray-50 opacity-60"
                        : selectedGames.has(game)
                          ? "border-primary-200 bg-primary-50"
                          : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGames.has(game)}
                      onChange={() => handleGameToggle(game)}
                      disabled={banAll}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                    />
                    <span
                      className={`text-sm ${banAll ? "text-gray-400" : "text-gray-700"}`}
                    >
                      {game}
                    </span>
                  </label>
                ))}
              </div>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400">
                    OR
                  </span>
                </div>
              </div>

              {/* Ban All checkbox */}
              <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <input
                  type="checkbox"
                  checked={banAll}
                  onChange={handleBanAllToggle}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Ban me from ALL games
                  </span>
                  <p className="mt-0.5 text-xs text-gray-600">
                    (24-hour cooling-off period)
                  </p>
                </div>
              </label>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
                >
                  Save Bans
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ============================================================
// SELF-EXCLUDE WARNING MODAL
// ============================================================

interface SelfExcludeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SelfExcludeModal({ isOpen, onClose }: SelfExcludeModalProps) {
  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleExternalLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-200 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal panel - more serious styling */}
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="self-exclude-modal-title"
            className="fixed inset-x-4 bottom-6 z-200 mx-auto max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="max-h-[80vh] overflow-y-auto">
              {/* Warning header */}
              <div className="bg-error-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error-100">
                    <AlertTriangle className="h-5 w-5 text-error-600" />
                  </div>
                  <h2
                    id="self-exclude-modal-title"
                    className="text-lg font-bold text-error-900"
                  >
                    SELF-EXCLUSION WARNING
                  </h2>
                </div>
              </div>

              <div className="p-6">
                {/* Warning content */}
                <div className="mb-4 space-y-3">
                  <p className="text-sm font-medium text-gray-900">
                    This will ban you from ALL licensed gambling in Finland for
                    a minimum of 3 months.
                  </p>
                  <p className="text-sm text-gray-600">
                    This cannot be undone immediately. Reversing self-exclusion
                    requires a formal application and a mandatory waiting
                    period.
                  </p>
                  <p className="text-sm font-semibold text-error-700">
                    Are you sure you want to continue?
                  </p>
                </div>

                {/* Info box */}
                <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="mb-3 text-xs font-medium text-gray-500">
                    This action cannot be completed in-app. Self-exclusion must
                    be done through the Finnish national gambling register at:
                  </p>

                  <a
                    href="https://www.pelikielto.fi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
                  >
                    <span>&#127760;</span>
                    www.pelikielto.fi
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <div className="border-t border-gray-200 pt-3">
                    <p className="mb-1 text-xs text-gray-500">
                      Need support? Contact Peluuri:
                    </p>
                    <a
                      href="tel:0800100101"
                      className="text-sm font-semibold text-gray-900"
                    >
                      &#128222; 0800 100 101
                    </a>
                    <p className="text-xs text-gray-500">
                      Mon-Fri 12:00-18:00 &bull; Free &amp; Anonymous
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() =>
                      handleExternalLink("https://www.pelikielto.fi")
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-error-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-error-700"
                  >
                    Continue to pelikielto.fi
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleExternalLink("https://www.peluuri.fi")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Learn More
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
