"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingDown, Info, PiggyBank } from "lucide-react";
import { useRebasedBets } from "@/lib/useRebasedBets";
import { calculateLossLimits } from "@/lib/metrics";
import { useToast } from "@/components/shared/Toast";

export function LossLimits() {
  const { showToast } = useToast();
  const bets = useRebasedBets();
  const [dailyLimit, setDailyLimit] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-calculated limits
  const weeklyLimit = dailyLimit * 7;
  const monthlyLimit = dailyLimit * 30;

  // Calculate loss metrics from bets
  const lossData = useMemo(
    () => calculateLossLimits(bets, dailyLimit),
    [bets, dailyLimit]
  );

  // Clamped display values — never show negative numbers
  const displayDailyLoss = Math.max(0, lossData.dailyLoss);
  const displayDailyRemaining = Math.min(
    dailyLimit,
    Math.max(0, lossData.dailyRemaining)
  );
  const displayDailyPercentage = Math.min(
    100,
    Math.max(0, lossData.dailyUsedPercentage)
  );
  const displayWeeklyLoss = Math.max(0, lossData.weeklyLoss);
  const displayMonthlyLoss = Math.max(0, lossData.monthlyLoss);

  return (
    <>
      <div className="relative overflow-hidden rounded-xl border border-green-100 bg-green-50 p-4 shadow-sm">
        {/* Watermark */}
        <div className="pointer-events-none absolute -right-3 -top-3 text-green-200 opacity-20">
          <PiggyBank className="h-24 w-24" />
        </div>

        {/* Label row */}
        <div className="mb-1 flex items-center gap-1.5">
          <TrendingDown className="h-3.5 w-3.5 text-green-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-green-600">
            Loss Limits
          </span>
        </div>

        {/* Subtitle */}
        <p className="mb-3 text-xs text-gray-400">
          Maximum losses allowed from betting activity
        </p>

        {/* Daily Limit */}
        <div className="mb-4">
          <p className="mb-1.5 text-sm font-semibold text-gray-900">
            Daily Limit: &euro;{dailyLimit}
          </p>
          <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-green-200">
            <div
              className="h-full rounded-full bg-success-600 transition-all"
              style={{ width: `${displayDailyPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600">
            &euro;{displayDailyLoss.toFixed(2)} / &euro;{lossData.dailyLimit}{" "}
            used
          </p>
          <p className="text-xs text-gray-500">
            &euro;{displayDailyRemaining.toFixed(2)} remaining today
          </p>
        </div>

        {/* Divider */}
        <div className="mb-4 border-t border-gray-100" />

        {/* Weekly */}
        <div className="mb-4">
          <p className="mb-1.5 text-sm font-medium text-gray-700">This Week:</p>
          <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-green-200">
            <div
              className="h-full rounded-full bg-success-600 transition-all"
              style={{
                width: `${Math.min(100, lossData.weeklyUsedPercentage)}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-600">
            &euro;{displayWeeklyLoss.toFixed(2)} / &euro;{weeklyLimit}
          </p>

          {/* Savings display */}
          {lossData.weeklySaved > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-success-600">
              <PiggyBank className="h-4 w-4 shrink-0" />
              <span>
                Saved &euro;{lossData.weeklySaved.toFixed(2)} (didn&apos;t
                gamble {lossData.weeklyDaysNotGambled} days)
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mb-4 border-t border-gray-100" />

        {/* Monthly */}
        <div className="mb-3">
          <p className="mb-1.5 text-sm font-medium text-gray-700">
            This Month:
          </p>
          <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-green-200">
            <div
              className="h-full rounded-full bg-success-600 transition-all"
              style={{
                width: `${Math.min(100, lossData.monthlyUsedPercentage)}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-600">
            &euro;{displayMonthlyLoss.toFixed(2)} / &euro;{monthlyLimit}
          </p>

          {/* Savings display */}
          {lossData.monthlySaved > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-success-600">
              <PiggyBank className="h-4 w-4 shrink-0" />
              <span>
                Saved &euro;{lossData.monthlySaved.toFixed(2)} (didn&apos;t
                gamble {lossData.monthlyDaysNotGambled} days)
              </span>
            </div>
          )}
        </div>

        {/* Edit button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-3 rounded-lg border border-success-300 px-3 py-1.5 text-xs font-medium text-success-600 transition-colors hover:bg-success-50"
        >
          Edit Daily Limit
        </button>
      </div>

      {/* Edit Modal */}
      <EditDailyLimitModal
        key={`${isModalOpen}-${dailyLimit}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentLimit={dailyLimit}
        onSave={(newLimit) => {
          setDailyLimit(newLimit);
          showToast("Loss limits updated", "success");
        }}
      />
    </>
  );
}

// ============================================================
// EDIT DAILY LIMIT MODAL
// ============================================================

interface EditDailyLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLimit: number;
  onSave: (newLimit: number) => void;
}

function EditDailyLimitModal({
  isOpen,
  onClose,
  currentLimit,
  onSave,
}: EditDailyLimitModalProps) {
  const [newLimit, setNewLimit] = useState(currentLimit.toString());
  const [error, setError] = useState<string | null>(null);

  // Live-calculated limits
  const parsedLimit = parseFloat(newLimit) || 0;
  const weeklyCalc = parsedLimit * 7;
  const monthlyCalc = parsedLimit * 30;

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

  const handleSave = () => {
    const value = parseFloat(newLimit);

    if (isNaN(value) || value <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    onSave(value);
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
            aria-labelledby="daily-limit-modal-title"
            className="fixed inset-x-4 bottom-6 z-200 mx-auto max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            {/* Title */}
            <h2
              id="daily-limit-modal-title"
              className="mb-4 text-xl font-bold text-gray-900"
            >
              Set Daily Loss Limit
            </h2>

            {/* Current limit */}
            <p className="mb-4 text-sm text-gray-600">
              Current: &euro;{currentLimit}/day
            </p>

            {/* New limit input */}
            <div className="mb-4">
              <label
                htmlFor="new-daily-limit"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                New daily limit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  &euro;
                </span>
                <input
                  id="new-daily-limit"
                  type="number"
                  min={1}
                  value={newLimit}
                  onChange={(e) => {
                    setNewLimit(e.target.value);
                    setError(null);
                  }}
                  className={`w-full rounded-lg border py-2 pl-8 pr-4 text-sm text-gray-900 tabular-nums placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
                    error
                      ? "border-error-500 focus:ring-error-500"
                      : "border-gray-300 focus:border-primary-500 focus:ring-primary-500/20"
                  }`}
                />
              </div>
              {error && (
                <p className="mt-1 text-xs font-medium text-error-600">
                  {error}
                </p>
              )}
            </div>

            {/* Auto-calculated limits */}
            <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="mb-2 text-sm font-medium text-gray-700">
                This automatically sets:
              </p>
              <ul className="space-y-1 text-xs tabular-nums text-gray-600">
                <li>
                  &bull; Weekly limit:{" "}
                  <span className="font-semibold text-gray-900">
                    &euro;{weeklyCalc.toFixed(0)}
                  </span>{" "}
                  (daily &times; 7)
                </li>
                <li>
                  &bull; Monthly limit:{" "}
                  <span className="font-semibold text-gray-900">
                    &euro;{monthlyCalc.toFixed(0)}
                  </span>{" "}
                  (daily &times; 30)
                </li>
              </ul>
            </div>

            {/* Info note */}
            <div className="mb-5 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                <p className="text-xs leading-relaxed text-primary-800">
                  Only daily limit is editable. Weekly and monthly are
                  calculated automatically to prevent loopholes.
                </p>
              </div>
            </div>

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
                Save
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
