"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type State =
  | { kind: "working" }
  | { kind: "empty" }
  | { kind: "error"; message: string };

export function SynthesizePanel({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "working" });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/synthesize`, {
          method: "POST",
        });
        if (res.status === 409) {
          setState({ kind: "empty" });
          return;
        }
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? `Failed (${res.status})`);
        }
        // Perspectives stored — re-render the server page to show them.
        router.refresh();
      } catch (err) {
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "Failed to synthesize",
        });
      }
    })();
  }, [sessionId, router]);

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl bg-[#f5f5f5] p-12 text-center"
      style={{ fontFamily: "var(--font-public-sans)" }}
    >
      {state.kind === "working" ? (
        <>
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-[#e85d3c]" />
          <p className="text-[15px] text-[#1a1a1a]">Reading the room…</p>
          <p className="text-[13px] text-black/55">
            Turning everyone&apos;s reflections into options to vote on.
          </p>
        </>
      ) : state.kind === "empty" ? (
        <>
          <p className="text-[15px] text-[#1a1a1a]">No reflections yet</p>
          <p className="text-[13px] text-black/55">
            Once people submit their take in Self Reflection, the options
            appear here.
          </p>
        </>
      ) : (
        <>
          <p className="text-[15px] text-[#1a1a1a]">Couldn&apos;t synthesize</p>
          <p className="text-[13px] text-black/55">{state.message}</p>
          <button
            type="button"
            onClick={() => {
              started.current = false;
              setState({ kind: "working" });
              router.refresh();
            }}
            className="mt-2 rounded-xl bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-black"
          >
            Try again
          </button>
        </>
      )}
    </div>
  );
}
