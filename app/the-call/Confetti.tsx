"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export function Confetti({ src = "/animations/celebration.json" }: { src?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <DotLottieReact src={src} autoplay loop={false} />
    </div>
  );
}
