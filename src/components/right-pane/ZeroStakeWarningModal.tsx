"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface ZeroStakeWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  zeroStakeSelections: Array<{ outcomeLabel: string; event: string }>;
}

export function ZeroStakeWarningModal({
  isOpen,
  onClose,
  onConfirm,
  zeroStakeSelections,
}: ZeroStakeWarningModalProps) {
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

  const visibleSelections = zeroStakeSelections.slice(0, 3);
  const overflowCount = zeroStakeSelections.length - visibleSelections.length;

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
            aria-labelledby="zero-stake-modal-title"
            className="fixed inset-x-4 bottom-6 z-[200] mx-auto max-w-sm rounded-2xl bg-white p-6 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            {/* Warning Icon — amber, informational not destructive */}
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-warning-600"
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
              id="zero-stake-modal-title"
              className="mb-1 text-center text-xl font-bold text-gray-900"
            >
              Heads up
            </h2>

            {/* Subtitle */}
            <p className="mb-3 text-center text-sm text-gray-600">
              Some selections have no single stake
            </p>

            {/* Zero-stake selection list */}
            <ul className="mb-4 space-y-1 pl-1">
              {visibleSelections.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                  <span className="text-gray-700">
                    <span className="font-medium">{s.outcomeLabel}</span>{" "}
                    <span className="text-gray-400">({s.event})</span>
                  </span>
                </li>
              ))}
              {overflowCount > 0 && (
                <li className="pl-3.5 text-sm text-gray-400">
                  ...and {overflowCount} more
                </li>
              )}
            </ul>

            <p className="mb-4 text-center text-xs text-gray-500">
              They will still count toward your accumulator and hedge bets if
              you have set a stake for those.
            </p>

            {/* Prototype note */}
            <div className="mb-5 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3">
              <p className="text-xs text-warning-800">
                In a live platform, selections with no stake are automatically
                excluded from the bet slip before placement.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                Review slip
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 active:bg-primary-800"
              >
                Place anyway →
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
