"use client";

import dynamic from "next/dynamic";
import { LiveDebugProvider } from "@/context/LiveDebugContext";

const DevTools = dynamic(
  () => import("./DevTools").then((mod) => mod.DevTools),
  { ssr: false },
);

export function DevProviders({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") {
    return <>{children}</>;
  }

  return (
    <LiveDebugProvider>
      {children}
      <DevTools />
    </LiveDebugProvider>
  );
}
