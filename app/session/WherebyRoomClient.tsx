"use client";

import dynamic from "next/dynamic";
import { MorphTrain } from "@/app/_components/MorphTrain";

export const WherebyRoom = dynamic(
  () => import("./WherebyRoom").then((m) => m.WherebyRoom),
  {
    ssr: false,
    loading: () => (
      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden rounded-xl bg-neutral-900">
        <MorphTrain size={18} />
      </div>
    ),
  }
);
