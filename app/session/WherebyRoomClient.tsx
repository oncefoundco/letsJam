"use client";

import dynamic from "next/dynamic";

export const WherebyRoom = dynamic(
  () => import("./WherebyRoom").then((m) => m.WherebyRoom),
  {
    ssr: false,
    loading: () => (
      <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-xl bg-neutral-900" />
    ),
  }
);
