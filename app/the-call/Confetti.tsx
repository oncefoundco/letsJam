"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export function Confetti({ src = "/animations/celebration.json" }: { src?: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <DotLottieReact
        src={src}
        autoplay
        loop={false}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
