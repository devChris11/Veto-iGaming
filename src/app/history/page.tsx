"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BarChart2,
  Download,
  Trash2,
  FileX,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { getSessionBets } from "@/lib/sessionBets";
import historyData from "@/data/history.json";
import { PeluuriInfo } from "@/components/right-pane/limits/PeluuriInfo";
import type { Bet } from "@/lib/metrics";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const BETS_PER_PAGE = 10;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

const SPORT_EMOJI: Record<string, string> = {
  Football: "⚽",
  "Ice Hockey": "🏒",
  Basketball: "🏀",
  Tennis: "🎾",
  Baseball: "⚾",
};

const MARKET_LABELS: Record<string, string> = {
  "1X2": "1X2 — Match Result",
  moneyline: "Moneyline",
  OverUnder: "Over/Under",
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function generateCSV(bets: Bet[]): string {
  const headers = [
    "ID",
    "Date",
    "Time",
    "Event",
    "Sport",
    "Market",
    "Outcome Selected",
    "Odds",
    "Stake",
    "Result",
    "Winnings",
    "Profit",
  ];

  const rows = bets.map((bet) => {
    return [
      bet.id,
      formatDate(bet.timestamp),
      formatTime(bet.timestamp),
      `"${bet.event}"`,
      bet.sport,
      MARKET_LABELS[bet.market] || bet.market,
      `"${bet.outcome_selected}"`,
      bet.odds.toFixed(2),
      bet.stake.toFixed(2),
      bet.outcome,
      bet.winnings?.toFixed(2) ?? "",
      bet.profit?.toFixed(2) ?? "",
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

function downloadCSV(csv: string): void {
  const today = new Date().toISOString().split("T")[0];
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `betting_history_${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// -----------------------------------------------------------------------------
// Delete History Modal
// -----------------------------------------------------------------------------

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onExport: () => void;
}

function DeleteHistoryModal({
  isOpen,
  onClose,
  onConfirm,
  onExport,
}: DeleteModalProps) {
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

  const handleExportAndClose = () => {
    onExport();
    onClose();
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
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
            aria-labelledby="delete-history-modal-title"
            className="fixed inset-x-4 bottom-6 z-[200] mx-auto max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            {/* Warning Icon */}
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-100">
                <AlertTriangle className="h-6 w-6 text-error-600" />
              </div>
            </div>

            {/* Title */}
            <h2
              id="delete-history-modal-title"
              className="mb-4 text-center text-xl font-bold text-gray-900"
            >
              DELETE BETTING HISTORY
            </h2>

            {/* Content */}
            <div className="mb-4 text-sm text-gray-600">
              <p className="mb-2">This will permanently delete:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>All betting history (last 90 days)</li>
                <li>You won&apos;t be able to see trends</li>
                <li>You won&apos;t be able to see AI insights</li>
              </ul>
            </div>

            {/* Secondary warning */}
            <p className="mb-4 text-center text-sm font-semibold text-error-600">
              This cannot be undone.
            </p>

            {/* Tip box */}
            <div className="mb-6 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3">
              <p className="text-xs text-warning-700">
                Tip: Export your data first if you need records.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleExportAndClose}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                onClick={onClose}
                className="w-full rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="w-full rounded-xl bg-error-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-error-700"
              >
                Delete History
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// -----------------------------------------------------------------------------
// Bet Card Component
// -----------------------------------------------------------------------------

interface BetCardProps {
  bet: Bet;
}

function BetCard({ bet }: BetCardProps) {
  const sportEmoji = SPORT_EMOJI[bet.sport] || "🎯";
  const marketLabel = MARKET_LABELS[bet.market] || bet.market;

  const borderClass =
    bet.outcome === "won"
      ? "border-l-4 border-l-success-500"
      : bet.outcome === "lost"
        ? "border-l-4 border-l-error-400"
        : "border-l-4 border-l-warning-400";

  const badgeClass =
    bet.outcome === "won"
      ? "bg-success-100 text-success-700"
      : bet.outcome === "lost"
        ? "bg-error-100 text-error-700"
        : "bg-warning-100 text-warning-700";

  const badgeText =
    bet.outcome === "won"
      ? "Won ✅"
      : bet.outcome === "lost"
        ? "Lost ❌"
        : "Pending ⏳";

  const profitColor =
    (bet.profit ?? 0) > 0
      ? "text-success-600"
      : (bet.profit ?? 0) < 0
        ? "text-error-600"
        : "text-gray-600";

  const winningsColor = bet.outcome === "won" ? "text-success-600" : "";

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${borderClass}`}
    >
      {/* Row 1: Date/Event + Outcome Badge */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400">
            {formatDate(bet.timestamp)} · {formatTime(bet.timestamp)}
          </p>
          <p className="text-sm font-semibold text-gray-900">{bet.event}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}
        >
          {badgeText}
        </span>
      </div>

      {/* Row 2: Bet details */}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <div>
          <p className="text-xs text-gray-500">Sport</p>
          <p className="text-sm font-medium tabular-nums text-gray-900">
            {sportEmoji} {bet.sport}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Bet Type</p>
          <p className="text-sm font-medium text-gray-900">Single</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Market</p>
          <p className="text-sm font-medium text-gray-900">{marketLabel}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Stake</p>
          <p className="text-sm font-medium tabular-nums text-gray-900">
            €{bet.stake.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Odds</p>
          <p className="text-sm font-medium tabular-nums text-gray-900">
            {bet.odds.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Winnings</p>
          <p
            className={`text-sm font-medium tabular-nums ${winningsColor || "text-gray-900"}`}
          >
            {bet.winnings != null ? `€${bet.winnings.toFixed(2)}` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Profit/Loss</p>
          <p className={`text-sm font-medium tabular-nums ${profitColor}`}>
            {bet.profit != null
              ? `${bet.profit >= 0 ? "+" : ""}€${bet.profit.toFixed(2)}`
              : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Empty State Component
// -----------------------------------------------------------------------------

function EmptyState() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-12 shadow-sm">
      <FileX className="mb-4 h-12 w-12 text-gray-300" />
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        History deleted
      </h3>
      <p className="mb-6 text-sm text-gray-500">
        Data will be restored on page reload (MVP simulation)
      </p>
      <button
        onClick={handleReload}
        className="flex items-center gap-2 rounded-lg border border-primary-300 px-4 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
      >
        <RefreshCw className="h-4 w-4" />
        Reload Page
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Page Component
// -----------------------------------------------------------------------------

export default function HistoryPage() {
  const [isDeleted, setIsDeleted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [asOfMs] = useState(() => Date.now());

  // Get bets from session (rebased timestamps)
  const allBets = useMemo(() => getSessionBets(), []);

  // Filter to last 90 days, sorted newest first
  const filteredBets = useMemo(() => {
    const cutoff = asOfMs - NINETY_DAYS_MS;
    return allBets
      .filter((bet) => new Date(bet.timestamp).getTime() >= cutoff)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [allBets, asOfMs]);

  // Pagination
  const totalBets = filteredBets.length;
  const totalPages = Math.ceil(totalBets / BETS_PER_PAGE);
  const startIndex = (currentPage - 1) * BETS_PER_PAGE;
  const endIndex = Math.min(startIndex + BETS_PER_PAGE, totalBets);
  const paginatedBets = filteredBets.slice(startIndex, endIndex);

  // Summary from history.json (static)
  const summary = historyData.summary;

  // Export handler
  const handleExport = useCallback(() => {
    const csv = generateCSV(filteredBets);
    downloadCSV(csv);
  }, [filteredBets]);

  // Delete handler
  const handleDelete = () => {
    setIsDeleted(true);
  };

  // Pagination handlers
  const goToPrevious = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goToNext = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-primary-600 transition-colors hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Game History</h1>
          <p className="text-sm text-gray-500">
            Your betting activity for the last 90 days
          </p>
        </div>

        {/* Account Summary Card */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-1.5">
            <BarChart2 className="h-4 w-4 text-gray-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Account Summary
            </span>
          </div>

          {/* Stats Grid */}
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-gray-500">Total Staked</p>
              <p className="text-2xl font-bold tabular-nums text-gray-900">
                €{summary.total_staked.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Won</p>
              <p className="text-2xl font-bold tabular-nums text-gray-900">
                €{summary.total_won.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Net Result</p>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  summary.net_result < 0
                    ? "text-error-600"
                    : summary.net_result > 0
                      ? "text-success-600"
                      : "text-gray-900"
                }`}
              >
                €{summary.net_result.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Return Rate</p>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  summary.return_rate < 100
                    ? "text-error-600"
                    : summary.return_rate > 100
                      ? "text-success-600"
                      : "text-gray-900"
                }`}
              >
                {summary.return_rate.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="mb-4 border-t border-gray-100" />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-error-300 px-4 py-2 text-sm font-medium text-error-600 transition-colors hover:bg-error-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete All Data
            </button>
          </div>
        </div>

        {/* Betting History Section */}
        <div className="mb-8">
          {/* Section Header */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Betting History
            </h2>
            <p className="text-xs text-gray-400">
              Last 90 days · data retained for GDPR compliance
            </p>
          </div>

          {/* Bet List or Empty State */}
          {isDeleted ? (
            <EmptyState />
          ) : (
            <>
              <div className="space-y-3">
                {paginatedBets.map((bet) => (
                  <BetCard key={bet.id} bet={bet} />
                ))}
              </div>

              {/* Pagination */}
              {totalBets > 0 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {startIndex + 1}–{endIndex} of {totalBets} bets
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={goToPrevious}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <button
                      onClick={goToNext}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Peluuri Info */}
        <PeluuriInfo />
      </div>

      {/* Delete Modal */}
      <DeleteHistoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        onExport={handleExport}
      />
    </div>
  );
}
