"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "./AppHeader";

/** Home (`/`) renders `AppHeader` with tab/section props from `page.tsx`; other routes get defaults. */
export function AppHeaderSlot() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <AppHeader />;
}
