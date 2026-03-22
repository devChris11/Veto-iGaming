"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Clock,
  User,
  Receipt,
  BarChart2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

const LOGO_SRC =
  "https://ik.imagekit.io/ChristoFernando/Case%20Study%20Projects/Veto/veto-logo.png";

const noop = () => {};

export interface AppHeaderProps {
  activeTab?: "browse" | "coupon" | null;
  activeSection?: string;
  onSectionClick?: (id: string) => void;
}

const MOBILE_SECTIONS = [
  { id: "slip", label: "Slip", Icon: Receipt },
  { id: "stats", label: "Performance", Icon: BarChart2 },
  { id: "insights", label: "AI Insights", Icon: Sparkles },
  { id: "limits", label: "Limits", Icon: ShieldCheck },
] as const;

export function AppHeader({
  activeTab = null,
  activeSection = "slip",
  onSectionClick = noop,
}: AppHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      const el = headerRef.current;
      if (!el || !(e.target instanceof Node) || el.contains(e.target)) return;
      setIsOpen(false);
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  return (
    <header
      ref={headerRef}
      className="relative shrink-0 bg-primary-600"
    >
      <div className="hidden h-14 shrink-0 items-center justify-between px-4 lg:flex lg:px-6">
        <div>
          <Image
            src={LOGO_SRC}
            alt="Veto"
            width={160}
            height={28}
            className="h-7 w-auto"
            priority
          />
        </div>
        <nav className="flex items-center gap-6">
          <Link
            href="/history"
            className="text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            Game History
          </Link>
          <span className="cursor-not-allowed text-sm font-medium text-white/80 opacity-60">
            My Account
          </span>
        </nav>
      </div>

      <div className="flex h-14 shrink-0 items-center justify-between px-4 lg:hidden">
        <div>
          <Image
            src={LOGO_SRC}
            alt="Veto"
            width={160}
            height={28}
            className="h-7 w-auto"
          />
        </div>
        <button
          type="button"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((v) => !v)}
          className="text-white"
        >
          <Menu className="h-5 w-5 text-white" />
        </button>
      </div>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-14 z-50 w-full border border-gray-100 bg-white shadow-xl lg:hidden">
          <Link
            href="/history"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-3 px-6 py-4 text-base font-medium text-gray-900 transition-colors hover:bg-gray-50"
          >
            <Clock className="h-4 w-4 shrink-0 text-gray-500" />
            Game History
          </Link>
          <div className="flex w-full cursor-not-allowed items-center gap-3 px-6 py-4 text-base font-medium">
            <User className="h-4 w-4 shrink-0 text-gray-300" />
            <span className="text-gray-300">My Account</span>
          </div>

          {activeTab === "coupon" ? (
            <>
              <div className="mx-0 border-t border-gray-200" />
              <div className="px-6 pb-2 pt-4 text-lg font-bold text-gray-900">
                Veto Centre
              </div>
              {MOBILE_SECTIONS.map(({ id, label, Icon }) => {
                const active = activeSection === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      onSectionClick(id);
                      setIsOpen(false);
                    }}
                    className={
                      active
                        ? "flex w-full items-center gap-3 bg-primary-50 px-6 py-3 text-base font-semibold text-primary-700"
                        : "flex w-full items-center gap-3 px-6 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    }
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${active ? "text-primary-600" : "text-gray-400"}`}
                    />
                    {label}
                  </button>
                );
              })}
            </>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
