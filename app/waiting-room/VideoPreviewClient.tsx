"use client";

import dynamic from "next/dynamic";

// navigator.mediaDevices is browser-only; load this component only after hydration.
export const VideoPreview = dynamic(
  () => import("./VideoPreview").then((m) => m.VideoPreview),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full max-w-[366px]">
        <div className="relative aspect-[547/443] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-700 to-neutral-900" />
      </div>
    ),
  }
);
