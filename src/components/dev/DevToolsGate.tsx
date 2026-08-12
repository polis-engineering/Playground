"use client";

import dynamic from "next/dynamic";

const DevTools = dynamic(
  () => import("./DevTools").then((mod) => mod.DevTools),
  { ssr: false },
);

export function DevToolsGate() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return <DevTools />;
}
