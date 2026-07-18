"use client";

import { Toast } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // Created once per browser session via useState, not module scope — a
  // module-level singleton would leak cached data across different users'
  // requests during SSR.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Single global toast queue — call toast.success/.danger/etc. from
          anywhere (hooks, pages) via `import { toast } from "@heroui/react"`,
          no per-page setup needed. */}
      <Toast.Provider placement="top end" />
    </QueryClientProvider>
  );
}
