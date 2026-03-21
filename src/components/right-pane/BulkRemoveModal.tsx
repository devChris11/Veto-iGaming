"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useBettingStore } from "@/lib/store";
import { useToast } from "@/components/shared";

interface BulkRemoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectionCount: number;
}

export function BulkRemoveModal({
  isOpen,
  onClose,
  selectionCount,
}: BulkRemoveModalProps) {
  const clearSelections = useBettingStore((state) => state.clearSelections);
  const { showToast } = useToast();

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

  const handleConfirm = () => {
    clearSelections();
    onClose();
    showToast("All bets removed", "info");
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
            aria-labelledby="bulk-remove-modal-title"
            className="fixed inset-x-4 bottom-6 z-[200] mx-auto max-w-sm rounded-2xl bg-white p-6 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            {/* Warning Icon */}
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-error-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2
              id="bulk-remove-modal-title"
              className="mb-2 text-center text-xl font-bold text-gray-900"
            >
              Remove all bets?
            </h2>

            {/* Description */}
            <p className="mb-2 text-center text-sm text-gray-600">
              This will clear your entire betting slip.
            </p>

            {/* Selection count */}
            <p className="mb-5 text-center text-sm font-medium text-gray-500">
              {selectionCount} selection{selectionCount !== 1 ? "s" : ""} will
              be removed
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 rounded-xl bg-error-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-error-700 active:bg-error-800"
              >
                Remove All
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
