"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import { useToast } from "@/components/shared/Toast";

const SESSION_KEY = "veto_session_start";
const SESSION_END_KEY = "veto_last_session_end";
const COOLDOWN_SECONDS = 90 * 60; // 90 min cooldown matches session length

type SessionState = "active" | "ended" | "cooldown";

export function SessionTime() {
  const { showToast } = useToast();
  const [sessionState, setSessionState] = useState<SessionState>("active");
  const [sessionLimitMinutes, setSessionLimitMinutes] = useState(90);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Initialize session state from storage (defer setState out of effect body)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initFromStorage = () => {
      try {
        // Check for cooldown first
        const lastEndStr = localStorage.getItem(SESSION_END_KEY);
        if (lastEndStr) {
          const lastEnd = parseInt(lastEndStr, 10);
          const elapsed = Math.floor((Date.now() - lastEnd) / 1000);
          if (elapsed < COOLDOWN_SECONDS) {
            setCooldownSeconds(COOLDOWN_SECONDS - elapsed);
            setSessionState("cooldown");
            return;
          } else {
            // Cooldown is over, can start new session
            localStorage.removeItem(SESSION_END_KEY);
          }
        }

        // Check for existing session
        const sessionStartStr = sessionStorage.getItem(SESSION_KEY);
        if (sessionStartStr) {
          const sessionStart = parseInt(sessionStartStr, 10);
          const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
          const sessionLimitSeconds = sessionLimitMinutes * 60;
          const remaining = sessionLimitSeconds - elapsed;

          if (remaining <= 0) {
            // Session has ended
            sessionStorage.removeItem(SESSION_KEY);
            localStorage.setItem(SESSION_END_KEY, Date.now().toString());
            setCooldownSeconds(COOLDOWN_SECONDS);
            setSessionState("ended");
          } else {
            setStartTime(sessionStart);
            setRemainingSeconds(remaining);
            setSessionState("active");
          }
        } else {
          // Start a fresh session
          const now = Date.now();
          sessionStorage.setItem(SESSION_KEY, now.toString());
          setStartTime(now);
          setRemainingSeconds(sessionLimitMinutes * 60);
          setSessionState("active");
        }
      } catch {
        // SSR safety - fail silently
      }
    };

    queueMicrotask(initFromStorage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer
  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      if (sessionState === "active" && startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const sessionLimitSeconds = sessionLimitMinutes * 60;
        const remaining = sessionLimitSeconds - elapsed;

        if (remaining <= 0) {
          // Session ended
          try {
            sessionStorage.removeItem(SESSION_KEY);
            localStorage.setItem(SESSION_END_KEY, Date.now().toString());
          } catch {
            // SSR safety
          }
          setCooldownSeconds(COOLDOWN_SECONDS);
          setSessionState("ended");
          setRemainingSeconds(0);
        } else {
          setRemainingSeconds(remaining);
        }
      } else if (sessionState === "ended" || sessionState === "cooldown") {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            // Cooldown is over - but don't auto-start session
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [mounted, sessionState, startTime, sessionLimitMinutes]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const formatClockTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStartNewSession = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_END_KEY);
      const now = Date.now();
      sessionStorage.setItem(SESSION_KEY, now.toString());
      setStartTime(now);
      setRemainingSeconds(sessionLimitMinutes * 60);
      setSessionState("active");
    } catch {
      // SSR safety
    }
  }, [sessionLimitMinutes]);

  const handleUpdateLimit = useCallback(
    (newLimit: number) => {
      setSessionLimitMinutes(newLimit);

      // Recalculate remaining time with new limit (don't reset start time)
      if (startTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const newRemaining = newLimit * 60 - elapsed;
        setRemainingSeconds(Math.max(0, newRemaining));
      }

      showToast("Session limit updated", "success");
    },
    [startTime, showToast]
  );

  const getCountdownColor = (seconds: number): string => {
    if (seconds <= 15 * 60) return "text-error-600";
    if (seconds <= 30 * 60) return "text-warning-600";
    return "text-gray-900";
  };

  if (!mounted) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-purple-100 bg-purple-50 p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-purple-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-purple-600">
            Session Time
          </span>
        </div>
        <div className="h-24 animate-pulse rounded bg-purple-100" />
      </div>
    );
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-xl border border-purple-100 bg-purple-50 p-4 shadow-sm">
        {/* Watermark */}
        <div className="pointer-events-none absolute -bottom-3 -right-3 text-purple-200 opacity-20">
          <Clock className="h-24 w-24" />
        </div>

        {/* Label row */}
        <div className="mb-3 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-purple-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-purple-600">
            Session Time
          </span>
        </div>

        {sessionState === "active" && startTime && (
          <>
            {/* Two-column row — info left, countdown right */}
            <div className="mb-3 flex items-center justify-between gap-4">
              {/* Left: start and end times only */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-success-500" />
                  <span className="text-gray-600">
                    Started: {formatClockTime(startTime)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-error-500" />
                  <span className="text-gray-600">
                    Ends:{" "}
                    {formatClockTime(
                      startTime + sessionLimitMinutes * 60 * 1000
                    )}{" "}
                    ({sessionLimitMinutes} min limit)
                  </span>
                </div>
              </div>

              {/* Right: countdown */}
              <div className="shrink-0 text-right">
                <p
                  className={`text-5xl font-bold tabular-nums leading-none ${getCountdownColor(remainingSeconds)}`}
                >
                  {formatTime(remainingSeconds)}
                </p>
                <p
                  className={`mt-1 text-sm ${getCountdownColor(remainingSeconds)}`}
                >
                  remaining
                </p>
              </div>
            </div>

            {/* Edit button — outside the flex row, below both columns */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-lg border border-purple-300 px-3 py-1.5 text-xs font-medium text-purple-600 transition-colors hover:bg-purple-50"
            >
              Edit Time Limit
            </button>
          </>
        )}

        {sessionState === "ended" && (
          <>
            <div className="mb-4 text-center">
              <p className="mb-1 text-lg font-semibold text-gray-900">
                Session ended
              </p>
              <p className="text-sm text-gray-600">
                Take a break — you&apos;ve used your {sessionLimitMinutes} min
                session.
              </p>
            </div>

            {cooldownSeconds > 0 ? (
              <div className="mb-4 text-center">
                <p className="text-sm text-gray-500">
                  Next session available in:{" "}
                  <span className="font-semibold tabular-nums text-gray-900">
                    {formatTime(cooldownSeconds)}
                  </span>
                </p>
              </div>
            ) : (
              <button
                onClick={handleStartNewSession}
                className="mb-4 w-full rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Start New Session
              </button>
            )}

            {/* Peluuri info */}
            <div className="rounded-lg border border-green-200 bg-purple-50 p-3">
              <p className="text-xs text-green-700">
                &#128161; Need help? Peluuri:{" "}
                <a
                  href="tel:0800100101"
                  className="font-semibold text-green-800"
                >
                  0800 100 101
                </a>
              </p>
            </div>
          </>
        )}

        {sessionState === "cooldown" && (
          <>
            <div className="mb-4 text-center">
              <p className="mb-1 text-lg font-semibold text-gray-900">
                You recently completed a session.
              </p>
              <p className="text-sm text-gray-600">
                Next session available in:{" "}
                <span className="font-semibold tabular-nums text-gray-900">
                  {formatTime(cooldownSeconds)}
                </span>
              </p>
            </div>

            {cooldownSeconds <= 0 && (
              <button
                onClick={handleStartNewSession}
                className="mb-4 w-full rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Start New Session
              </button>
            )}

            {/* Info */}
            <div className="rounded-lg border border-green-200 bg-purple-50 p-3">
              <p className="mb-1 text-xs text-green-700">
                &#128161; This helps you take healthy breaks between sessions.
              </p>
              <p className="text-xs text-green-700">
                Peluuri:{" "}
                <a
                  href="tel:0800100101"
                  className="font-semibold text-green-800"
                >
                  0800 100 101
                </a>
              </p>
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      <EditSessionLimitModal
        key={`${isModalOpen}-${sessionLimitMinutes}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentLimit={sessionLimitMinutes}
        onSave={handleUpdateLimit}
      />
    </>
  );
}

// ============================================================
// EDIT SESSION LIMIT MODAL
// ============================================================

interface EditSessionLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLimit: number;
  onSave: (newLimit: number) => void;
}

function EditSessionLimitModal({
  isOpen,
  onClose,
  currentLimit,
  onSave,
}: EditSessionLimitModalProps) {
  const [newLimit, setNewLimit] = useState(String(currentLimit));
  const [error, setError] = useState<string | null>(null);
  const [showHighWarning, setShowHighWarning] = useState(false);

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setNewLimit(String(currentLimit));
        setError(null);
        setShowHighWarning(false);
      });
    }
  }, [isOpen, currentLimit]);

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

  const handleInputChange = (value: string) => {
    setNewLimit(value);
    setError(null);

    const numValue = parseInt(value, 10);
    setShowHighWarning(!isNaN(numValue) && numValue > 180);
  };

  const handleSave = () => {
    const value = parseInt(newLimit, 10);

    if (isNaN(value)) {
      setError("Please enter a valid number");
      return;
    }

    if (value < 30) {
      setError("Minimum session length is 30 minutes");
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
            aria-labelledby="session-limit-modal-title"
            className="fixed inset-x-4 bottom-6 z-200 mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full"
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            {/* Title */}
            <h2
              id="session-limit-modal-title"
              className="mb-4 text-xl font-bold text-gray-900"
            >
              Set Daily Session Limit
            </h2>

            {/* Current limit */}
            <p className="mb-4 text-sm text-gray-600">
              Current: {currentLimit} minutes
            </p>

            {/* New limit input */}
            <div className="mb-4">
              <label
                htmlFor="new-session-limit"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                New Limit (minutes)
              </label>
              <input
                id="new-session-limit"
                type="number"
                min={30}
                value={newLimit}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Enter session limit"
                className={`w-full rounded-lg border py-2 px-4 text-gray-900 tabular-nums placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
                  error
                    ? "border-error-500 focus:ring-error-500"
                    : "border-gray-300 focus:ring-primary-500"
                }`}
              />
              {error && (
                <p className="mt-1 text-xs font-medium text-error-600">
                  {error}
                </p>
              )}
            </div>

            {/* Recommendation */}
            <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs leading-relaxed text-gray-600">
                <span className="font-semibold">Recommended:</span> 60–120
                minutes
              </p>
            </div>

            {/* High limit warning */}
            {showHighWarning && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs leading-relaxed text-amber-800">
                  &#9888;&#65039; Limits above 180 minutes may indicate problem
                  gambling. Need help?
                  <br />
                  <a
                    href="tel:0800100101"
                    className="font-semibold text-amber-900"
                  >
                    &#128222; Peluuri: 0800 100 101
                  </a>
                </p>
              </div>
            )}

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
