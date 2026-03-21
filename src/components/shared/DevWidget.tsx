"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { label: "Home", href: "/" },
  { label: "Test", href: "/test" },
  { label: "History", href: "/test/history" },
];

export function DevWidget() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleNavigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <div ref={containerRef} className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-14 right-0 w-36 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
          >
            {links.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => handleNavigate(href)}
                className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                prefetch={false}
              >
                {label}
              </Link>
            ))}
            <div className="mx-2 my-1 border-t border-gray-100" />
            <button
              onClick={() => {
                sessionStorage.removeItem("veto_session_start");
                localStorage.removeItem("veto_last_session_end");
                window.location.reload();
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-amber-600 hover:bg-amber-50"
            >
              <span className="text-xs">&#9201;</span>
              Reset Session
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("veto_ban_all_start");
                window.location.reload();
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-amber-600 hover:bg-amber-50"
            >
              <span className="text-xs">🚫</span>
              Reset Ban Cooldown
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-900/80 text-white"
        aria-label="Dev menu"
      >
        <span className="font-mono text-[10px] font-semibold tracking-wider">
          DEV
        </span>
      </button>
    </div>
  );
}
