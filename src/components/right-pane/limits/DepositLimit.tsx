"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/shared/Toast";

export function DepositLimit() {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Static values for MVP (simulation only, resets on page reload)
  const [deposited] = useState(350);
  const [limit, setLimit] = useState(500);

  const usedPercentage = Math.round((deposited / limit) * 100);
  const remaining = limit - deposited;

  // Calculate reset date (first of next month)
  const resetDate = new Date();
  resetDate.setMonth(resetDate.getMonth() + 1);
  resetDate.setDate(1);
  const resetDateFormatted = resetDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <div className="relative overflow-hidden rounded-xl border border-primary-100 bg-primary-50 p-4 shadow-sm">
        {/* Watermark */}
        <div className="pointer-events-none absolute -right-3 -top-3 text-primary-200 opacity-20">
          <CreditCard className="h-24 w-24" />
        </div>

        {/* Label row */}
        <div className="mb-1 flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5 text-primary-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
            Deposit Limit
          </span>
        </div>

        {/* Subtitle */}
        <p className="mb-3 text-xs text-gray-400">
          Monthly transfer limit to your gaming account
        </p>

        {/* Amount row */}
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-xl font-bold tabular-nums text-gray-900">
            &euro;{deposited} / &euro;{limit}
          </p>
          <span className="text-sm font-medium tabular-nums text-gray-500">
            {usedPercentage}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-primary-600 transition-all"
            style={{ width: `${usedPercentage}%` }}
          />
        </div>

        {/* Remaining and reset info */}
        <div className="mb-3 space-y-0.5">
          <p className="text-xs text-gray-700">
            &euro;{remaining} remaining this month
          </p>
          <p className="text-xs text-gray-500">Resets: {resetDateFormatted}</p>
        </div>

        {/* Edit button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-3 rounded-lg border border-primary-300 px-3 py-1.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50"
        >
          Edit Limit
        </button>
      </div>

      {/* Edit Modal */}
      <EditDepositLimitModal
        key={`${isModalOpen}-${limit}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentLimit={limit}
        onSave={(newLimit) => {
          setLimit(newLimit);
          showToast("Deposit limit updated", "success");
        }}
      />
    </>
  );
}

// ============================================================
// EDIT DEPOSIT LIMIT MODAL
// ============================================================

interface EditDepositLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLimit: number;
  onSave: (newLimit: number) => void;
}

function EditDepositLimitModal({
  isOpen,
  onClose,
  currentLimit,
  onSave,
}: EditDepositLimitModalProps) {
  const [newLimit, setNewLimit] = useState(currentLimit.toString());
  const [error, setError] = useState<string | null>(null);

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

    if (isNaN(value)) {
      setError("Please enter a valid number");
      return;
    }

    if (value < 50) {
      setError("Minimum deposit limit is \u20AC50/month");
      return;
    }

    if (value > 2000) {
      setError("Maximum deposit limit is \u20AC2,000/month");
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
            aria-labelledby="deposit-limit-modal-title"
            className="fixed inset-x-4 bottom-6 z-200 mx-auto max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            {/* Title */}
            <h2
              id="deposit-limit-modal-title"
              className="mb-4 text-xl font-bold text-gray-900"
            >
              Set Monthly Deposit Limit
            </h2>

            {/* Current limit */}
            <p className="mb-4 text-sm text-gray-600">
              Current: &euro;{currentLimit}
            </p>

            {/* New limit input */}
            <div className="mb-4">
              <label
                htmlFor="new-deposit-limit"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                New Limit
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  &euro;
                </span>
                <input
                  id="new-deposit-limit"
                  type="number"
                  min={50}
                  max={2000}
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

            {/* Regulation info */}
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">
                  Finnish regulations:
                </p>
              </div>
              <ul className="space-y-0.5 text-xs text-amber-700">
                <li>&#8226; Minimum: &euro;50/month</li>
                <li>&#8226; Maximum: &euro;2,000/month</li>
                <li>&#8226; Changes take effect immediately</li>
                <li>&#8226; Cannot increase for 72 hours after setting</li>
              </ul>
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
