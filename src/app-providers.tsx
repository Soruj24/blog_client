"use client";

import { SessionProvider } from "next-auth/react";
import { Provider } from "react-redux";
import { useState, type ReactNode } from "react";
import { store } from "@/src/store/store";
import { ToastProvider } from "@/src/components/ui/Toast";

/**
 * Client providers composed once in app/layout.tsx:
 * - Redux store (RTK Query + UI slices)
 * - Auth.js SessionProvider (session only, secrets stay server-side)
 * Theme class is applied by ThemeToggle to avoid hydration mismatch.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [reduxStore] = useState(() => store);
  return (
    <Provider store={reduxStore}>
      <SessionProvider>
        <ToastProvider>{children}</ToastProvider>
      </SessionProvider>
    </Provider>
  );
}
