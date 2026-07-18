"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

// The chat page is a fixed-height application workspace (its own header,
// sidebar, and sticky composer) rather than a normally-scrolling content
// page — the global Footer rendering below it would either get pushed
// off-screen behind a guessed height or force an awkward second scroll
// region. Root layout stays a Server Component (keeps the `metadata`
// export); this is the one small client piece that opts a specific route
// out of the global chrome.
export function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/dashboard/chat")) return null;
  return <Footer />;
}
