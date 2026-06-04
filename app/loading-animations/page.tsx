"use client";

import { useEffect, useState } from "react";

/* ──────────────────────────────────────────────────────────────────────────
 * Loading-animation test bench.
 *
 * NOT wired into any real loading state — this page exists purely to preview
 * the candidate loaders on loop so we can pick one.
 *
 * The hero, `PixelMorph`, is FOUR pixels (a 2×2 set echoing the brand mark)
 * that smoothly morph between the four brand shapes — rounded square, circle,
 * diamond, triangle — each pixel offset so all four shapes are always on
 * screen at once. Every shape is a 12-vertex `clip-path` polygon, so the
 * browser can interpolate vertex-by-vertex and the change reads as a true
 * morph rather than a swap.
 * ────────────────────────────────────────────────────────────────────────── */

// Primary palette.
const C = {
  teal: "#00B3A0",
  blue: "#00AACF",
  orange: "#FC5652",
  yellow: "#FFCB00",
  ink: "#1E2A33",
} as const;

/* ── shared cadence hook ──────────────────────────────────────────────────
 * Advances an index 0..count-1 on an interval. */
function useStep(count: number, ms: number, playing: boolean) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setI((p) => (p + 1) % count), ms);
    return () => clearInterval(id);
  }, [count, ms, playing]);
  return i;
}

/* Like useStep but ever-increasing (never wraps) — lets a caller drive both a
 * looping index (tick % n) and an accumulating rotation that steps forward
 * without snapping back to zero. */
function useTick(ms: number, playing: boolean) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT((p) => p + 1), ms);
    return () => clearInterval(id);
  }, [ms, playing]);
  return t;
}

/* ══════════════════════════════════════════════════════════════════════════
 * HERO — Pixel Morph
 * Four pixels in a 2×2, each cycling through the four shapes. All shapes are
 * 12-point polygons so clip-path transitions interpolate into a smooth morph.
 * ════════════════════════════════════════════════════════════════════════ */

const UNIT = 38; // size of one pixel
const PITCH = 48; // distance between pixel centres-ish (size + gap)
const BOX = UNIT + PITCH; // container = 2 cells wide
const CENTER = (BOX - UNIT) / 2; // translate that centres one pixel

const gridX = (i: number) => (i % 2) * PITCH;
const gridY = (i: number) => Math.floor(i / 2) * PITCH;

// Each polygon has exactly 12 vertices, listed in the same winding order, so
// CSS can morph one into the next without snapping.
const SHAPES = {
  square:
    "polygon(50% 0%, 75% 0%, 100% 0%, 100% 33.3%, 100% 66.7%, 100% 100%, 66.7% 100%, 33.3% 100%, 0% 100%, 0% 66.7%, 0% 33.3%, 0% 0%)",
  roundedSquare:
    "polygon(18% 0%, 50% 0%, 82% 0%, 100% 18%, 100% 50%, 100% 82%, 82% 100%, 50% 100%, 18% 100%, 0% 82%, 0% 50%, 0% 18%)",
  circle:
    "polygon(50% 0%, 75% 6.7%, 93.3% 25%, 100% 50%, 93.3% 75%, 75% 93.3%, 50% 100%, 25% 93.3%, 6.7% 75%, 0% 50%, 6.7% 25%, 25% 6.7%)",
  diamond:
    "polygon(50% 0%, 66.7% 16.7%, 83.3% 33.3%, 100% 50%, 83.3% 66.7%, 66.7% 83.3%, 50% 100%, 33.3% 83.3%, 16.7% 66.7%, 0% 50%, 16.7% 33.3%, 33.3% 16.7%)",
  triangle:
    "polygon(50% 0%, 62.5% 25%, 75% 50%, 87.5% 75%, 100% 100%, 66.7% 100%, 33.3% 100%, 0% 100%, 12.5% 75%, 25% 50%, 37.5% 25%, 43.75% 12.5%)",
  star: // 6-pointed star, outer/inner radius alternating
    "polygon(50% 0%, 61% 31%, 93.3% 25%, 72% 50%, 93.3% 75%, 61% 69%, 50% 100%, 39% 69%, 6.7% 75%, 28% 50%, 6.7% 25%, 39% 31%)",
  plus: // a cross — its 12 corners line up with the rest
    "polygon(33.3% 0%, 66.7% 0%, 66.7% 33.3%, 100% 33.3%, 100% 66.7%, 66.7% 66.7%, 66.7% 100%, 33.3% 100%, 33.3% 66.7%, 0% 66.7%, 0% 33.3%, 33.3% 33.3%)",
} as const;

// Order the morph travels through (loops back to the start).
const SHAPE_CYCLE = [
  SHAPES.roundedSquare,
  SHAPES.circle,
  SHAPES.diamond,
  SHAPES.triangle,
] as const;

// Colour fixed per position — the brand mark, brought to life.
//   0 ┌ blue   1 ┐ orange
//   2 └ yellow 3 ┘ teal
const PIXEL_COLORS = [C.blue, C.orange, C.yellow, C.teal];

function PixelMorph({ ms = 900, size = 1 }: { ms?: number; size?: number }) {
  const step = useStep(SHAPE_CYCLE.length, ms, true);
  return (
    <div
      style={{
        position: "relative",
        width: BOX,
        height: BOX,
        transform: `scale(${size})`,
      }}
    >
      {[0, 1, 2, 3].map((q) => (
        <span
          key={q}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: UNIT,
            height: UNIT,
            transform: `translate(${gridX(q)}px, ${gridY(q)}px)`,
            background: PIXEL_COLORS[q],
            // offset each pixel so the four shapes are always all present
            clipPath: SHAPE_CYCLE[(q + step) % SHAPE_CYCLE.length],
            // smooth the polygon facets/chamfers into real curves
            filter: "url(#nf-round)",
            transition: "clip-path 720ms cubic-bezier(.65, 0, .35, 1)",
            willChange: "clip-path",
          }}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * VARIANT 2 — Single morph
 * One pixel, cycling the same four shapes + four colours. The minimal take.
 * ════════════════════════════════════════════════════════════════════════ */

function SingleMorph({ ms = 700, size = 1 }: { ms?: number; size?: number }) {
  const step = useStep(SHAPE_CYCLE.length, ms, true);
  return (
    <span
      style={{
        display: "block",
        width: 64,
        height: 64,
        transform: `scale(${size})`,
        background: PIXEL_COLORS[step],
        clipPath: SHAPE_CYCLE[step],
        // softens the sharp clip-path corners (esp. triangle/diamond tips)
        filter: "url(#nf-round)",
        transition:
          "clip-path 600ms cubic-bezier(.65,0,.35,1), background 600ms ease",
        willChange: "clip-path, background",
      }}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * HERO — Merge & Spin
 * Four sharp squares spread in a 2×2 gather into the centre and fuse into one
 * big rounded triangle, then fan back out — all while the whole set spins
 * continuously (the spin is a CSS animation on the wrapper, independent of the
 * React-driven gather/scatter so re-renders never reset it).
 * ════════════════════════════════════════════════════════════════════════ */

function MergeSpin({ ms = 1150, size = 1 }: { ms?: number; size?: number }) {
  const merged = useStep(2, ms, true) === 1;
  return (
    <div style={{ transform: `scale(${size})` }}>
      <div
        style={{
          position: "relative",
          width: BOX,
          height: BOX,
          animation: "nf-spin 3.4s linear infinite",
        }}
      >
        {[0, 1, 2, 3].map((q) => (
          <span
            key={q}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: UNIT,
              height: UNIT,
              background: PIXEL_COLORS[q],
              // sharp squares spread out → one big rounded triangle at centre
              clipPath: merged ? SHAPES.triangle : SHAPES.square,
              borderRadius: merged ? 18 : 0,
              transformOrigin: "center",
              transform: merged
                ? `translate(${CENTER}px, ${CENTER}px) scale(1.9)`
                : `translate(${gridX(q)}px, ${gridY(q)}px) scale(1)`,
              transition:
                "clip-path 780ms cubic-bezier(.65,0,.35,1), transform 780ms cubic-bezier(.65,0,.35,1), border-radius 780ms ease",
              willChange: "clip-path, transform",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * HERO — Rotate & Round
 * Four sharp squares gather to the centre and shrink into a little shape
 * (square → triangle → diamond, one per loop), then fan back out. The cluster
 * rotates a quarter-turn on each spread beat and HOLDS through the gather — a
 * deliberate rotate-stop-rotate cadence, not a continuous spin.
 * ════════════════════════════════════════════════════════════════════════ */

// Shapes the gathered piece cycles through, one per "merge" beat.
const MERGED_SHAPES = [SHAPES.square, SHAPES.triangle, SHAPES.diamond];
const BEATS = MERGED_SHAPES.length * 2; // spread+gather per shape

// Cumulative rotation at every beat. The cluster turns +90° ON each gather
// beat and holds while spread — EXCEPT the square→triangle gather, which forms
// with no turn. Precomputed from MERGED_SHAPES so the rule survives edits.
const STEP_ROTATION = (() => {
  const arr: number[] = [];
  let acc = 0;
  for (let s = 0; s < BEATS; s++) {
    const turns = s % 2 === 1 && MERGED_SHAPES[(s - 1) / 2] !== SHAPES.triangle;
    if (turns) acc += 90;
    arr.push(acc);
  }
  return arr;
})();
const LOOP_ROTATION = STEP_ROTATION[BEATS - 1]; // total turn per full loop

function RotateRound({ ms = 1150, size = 1 }: { ms?: number; size?: number }) {
  // Loop: spread → square → spread → triangle → spread → diamond → …
  const tick = useTick(ms, true);
  const step = tick % BEATS;
  const merged = step % 2 === 1; // odd beats are gathered
  const shapeIdx = (step - 1) / 2; // which merged shape (valid when merged)
  const isSquareBeat = merged && shapeIdx === 0; // only this beat rounds corners
  // Rotate-and-round / stop / … — and notably NO turn on the triangle gather.
  const rotation = Math.floor(tick / BEATS) * LOOP_ROTATION + STEP_ROTATION[step];
  return (
    <div style={{ transform: `scale(${size})` }}>
      <div
        style={{
          position: "relative",
          width: BOX,
          height: BOX,
          transform: `rotate(${rotation}deg)`,
          transition: "transform 780ms cubic-bezier(.65, 0, .35, 1)",
        }}
      >
        {[0, 1, 2, 3].map((q) => (
          <span
            key={q}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: UNIT,
              height: UNIT,
              background: PIXEL_COLORS[q],
              transformOrigin: "center",
              // gather to the centre and shrink small when merged
              transform: merged
                ? `translate(${CENTER}px, ${CENTER}px) scale(0.7)`
                : `translate(${gridX(q)}px, ${gridY(q)}px) scale(1)`,
              // always a polygon so the shapes morph smoothly into each other
              clipPath: merged ? MERGED_SHAPES[shapeIdx] : SHAPES.square,
              // round the corners only for the little-square beat
              borderRadius: isSquareBeat ? "30%" : "0",
              transition:
                "transform 780ms cubic-bezier(.65,0,.35,1), clip-path 780ms cubic-bezier(.65,0,.35,1), border-radius 780ms ease",
              willChange: "transform, clip-path, border-radius",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * RANDOMS — a grab-bag of experiments riffing on the same vocabulary
 * (four pixels, the brand palette, clip-path shapes, gooey rounding, stepped
 * rotation). Mostly CSS-keyframe driven, staggered with animation-delay.
 * ════════════════════════════════════════════════════════════════════════ */

const MORPH_MS = 3600; // one full trip through all the shapes

// A row of tiles, each one shape-phase behind the last — a wave of shapes
// (square→circle→triangle→diamond→star→plus) sweeping across.
function MorphTrain() {
  const N = 6;
  return (
    <div style={{ display: "flex", gap: 9, filter: "url(#nf-round)" }}>
      {Array.from({ length: N }, (_, i) => (
        <span
          key={i}
          style={{
            width: 26,
            height: 26,
            background: PIXEL_COLORS[i % PIXEL_COLORS.length],
            clipPath: SHAPES.square,
            animation: `nf-morph ${MORPH_MS}ms ease-in-out infinite`,
            animationDelay: `${(-i * MORPH_MS) / N}ms`,
          }}
        />
      ))}
    </div>
  );
}

// A 3×3 of morphing tiles, the shape wave travelling on the diagonal.
function ShapeGridMorph() {
  const N = 3;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${N}, 22px)`,
        gap: 7,
        filter: "url(#nf-round)",
      }}
    >
      {Array.from({ length: N * N }, (_, i) => {
        const diag = Math.floor(i / N) + (i % N); // 0..4 wavefront
        return (
          <span
            key={i}
            style={{
              width: 22,
              height: 22,
              background: PIXEL_COLORS[diag % PIXEL_COLORS.length],
              clipPath: SHAPES.square,
              animation: `nf-morph ${MORPH_MS}ms ease-in-out infinite`,
              animationDelay: `${(-diag * MORPH_MS) / 6}ms`,
            }}
          />
        );
      })}
    </div>
  );
}

// Eight morphing shapes spaced around a slowly turning ring.
function ShapeRing() {
  const N = 8;
  const R = 28;
  return (
    <div
      style={{
        position: "relative",
        width: 74,
        height: 74,
        filter: "url(#nf-round)",
        animation: "nf-spin 7000ms linear infinite",
      }}
    >
      {Array.from({ length: N }, (_, i) => {
        const a = (i / N) * Math.PI * 2;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: 37 + R * Math.sin(a) - 9,
              top: 37 - R * Math.cos(a) - 9,
              width: 18,
              height: 18,
              background: PIXEL_COLORS[i % PIXEL_COLORS.length],
              clipPath: SHAPES.square,
              animation: `nf-morph ${MORPH_MS}ms ease-in-out infinite`,
              animationDelay: `${(-i * MORPH_MS) / N}ms`,
            }}
          />
        );
      })}
    </div>
  );
}

// One big tile slowly cycling every shape, colour shifting with it.
function BigMorph() {
  return (
    <span
      style={{
        display: "block",
        width: 60,
        height: 60,
        clipPath: SHAPES.square,
        filter: "url(#nf-round)",
        animation: `nf-morph ${MORPH_MS + 600}ms ease-in-out infinite, nf-colors ${MORPH_MS + 600}ms linear infinite`,
      }}
    />
  );
}

// A scatter of different shapes, each tumbling (rotate + pulse) in place.
const CONFETTI = [
  { shape: "triangle", left: 2, top: 8, size: 20, c: 1, d: 0 },
  { shape: "circle", left: 33, top: 0, size: 16, c: 0, d: 220 },
  { shape: "star", left: 60, top: 8, size: 24, c: 2, d: 440 },
  { shape: "diamond", left: 8, top: 38, size: 18, c: 3, d: 140 },
  { shape: "square", left: 36, top: 34, size: 20, c: 2, d: 360 },
  { shape: "plus", left: 64, top: 42, size: 18, c: 0, d: 560 },
] as const;

function Confetti() {
  return (
    <div style={{ position: "relative", width: 86, height: 64, filter: "url(#nf-round)" }}>
      {CONFETTI.map((it, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: it.left,
            top: it.top,
            width: it.size,
            height: it.size,
            background: PIXEL_COLORS[it.c],
            clipPath: SHAPES[it.shape],
            animation: "nf-tumble 1800ms ease-in-out infinite",
            animationDelay: `${it.d}ms`,
          }}
        />
      ))}
    </div>
  );
}

// Two blobs that morph shape AND slide through each other, fused gooey.
function GooeyMorph() {
  return (
    <div style={{ position: "relative", width: 86, height: 40, filter: "url(#nf-goo)" }}>
      <span
        style={{
          position: "absolute",
          top: 6,
          left: 0,
          width: 28,
          height: 28,
          background: C.blue,
          clipPath: SHAPES.circle,
          animation: `nf-slide-r 1600ms ease-in-out infinite, nf-morph ${MORPH_MS}ms ease-in-out infinite`,
        }}
      />
      <span
        style={{
          position: "absolute",
          top: 6,
          right: 0,
          width: 28,
          height: 28,
          background: C.orange,
          clipPath: SHAPES.circle,
          animation: `nf-slide-l 1600ms ease-in-out infinite, nf-morph ${MORPH_MS}ms ease-in-out infinite`,
        }}
      />
    </div>
  );
}

const RANDOMS: { name: string; render: () => React.ReactNode }[] = [
  { name: "Shape Grid", render: () => <ShapeGridMorph /> },
  { name: "Shape Ring", render: () => <ShapeRing /> },
  { name: "Big Morph", render: () => <BigMorph /> },
  { name: "Confetti", render: () => <Confetti /> },
  { name: "Gooey Morph", render: () => <GooeyMorph /> },
];

function RandomsGallery({ dark }: { dark: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
        gap: 16,
      }}
    >
      {RANDOMS.map((r) => (
        <div key={r.name}>
          <Stage dark={dark} size={0.8}>
            {r.render()}
          </Stage>
          <p
            style={{
              textAlign: "center",
              marginTop: 8,
              fontSize: 13,
              color: "rgba(3,3,3,.55)",
            }}
          >
            {r.name}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
 * Page scaffolding
 * ════════════════════════════════════════════════════════════════════════ */

type Variant = {
  id: string;
  name: string;
  blurb: string;
  render: (size: number) => React.ReactNode;
};

const VARIANTS: Variant[] = [
  {
    id: "rotate-round",
    name: "Rotate & Round",
    blurb: "4 rounded squares spinning as a cluster",
    render: (size) => <RotateRound size={size} />,
  },
  {
    id: "morph-train",
    name: "Morph Train",
    blurb: "a wave of shapes — square → circle → triangle → diamond → star → plus",
    render: (size) => (
      <div style={{ transform: `scale(${size})` }}>
        <MorphTrain />
      </div>
    ),
  },
  {
    id: "merge-spin",
    name: "Merge & Spin",
    blurb: "4 sharp squares gather + spin into one big rounded triangle",
    render: (size) => <MergeSpin size={size} />,
  },
  {
    id: "shape-cycle",
    name: "Shape Cycle",
    blurb: "4 pixels · rounded square → circle → diamond → triangle",
    render: (size) => <PixelMorph size={size} />,
  },
  {
    id: "single-morph",
    name: "Single Morph",
    blurb: "one pixel cycling all four shapes + colours",
    render: (size) => <SingleMorph size={size} />,
  },
];

function Stage({
  dark,
  size,
  children,
}: {
  dark: boolean;
  size: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: 200 + size * 120,
        borderRadius: 18,
        background: dark ? C.ink : "#ffffff",
        border: `1px solid ${dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)"}`,
        boxShadow: dark
          ? "0 1px 0 rgba(255,255,255,.04) inset"
          : "0 1px 2px rgba(0,0,0,.04)",
      }}
    >
      {children}
    </div>
  );
}

export default function LoadingAnimationsPage() {
  const [dark, setDark] = useState(false);
  const [active, setActive] = useState(VARIANTS[0].id);
  const isRandoms = active === "randoms";
  const variant = VARIANTS.find((v) => v.id === active);

  return (
    <div style={{ minHeight: "100vh", background: "#f4f4f4", color: "#030303" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "56px 24px 96px" }}>
        <header style={{ marginBottom: 8 }}>
          <p
            style={{
              fontSize: 12,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: "rgba(3,3,3,.5)",
              margin: 0,
            }}
          >
            letsJam · test bench
          </p>
          <h1
            style={{
              fontFamily: "var(--font-queens), Georgia, serif",
              fontWeight: 300,
              letterSpacing: "-0.02em",
              fontSize: 40,
              margin: "6px 0 0",
            }}
          >
            Loading animations
          </h1>
          <p style={{ color: "rgba(3,3,3,.6)", marginTop: 8, maxWidth: 560 }}>
            Preview only — pick the feel. Nothing here is wired into a real
            loading state yet.
          </p>
        </header>

        {/* controls */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
            margin: "28px 0 20px",
          }}
        >
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              onClick={() => setActive(v.id)}
              style={{
                padding: "9px 14px",
                borderRadius: 999,
                border: "1px solid rgba(0,0,0,.1)",
                background: active === v.id ? C.ink : "#fff",
                color: active === v.id ? "#fff" : "#030303",
                fontSize: 14,
                cursor: "pointer",
                transition: "all 160ms ease",
              }}
            >
              {v.name}
            </button>
          ))}
          <button
            onClick={() => setActive("randoms")}
            style={{
              padding: "9px 14px",
              borderRadius: 999,
              border: "1px solid rgba(0,0,0,.1)",
              background: isRandoms ? C.ink : "#fff",
              color: isRandoms ? "#fff" : "#030303",
              fontSize: 14,
              cursor: "pointer",
              transition: "all 160ms ease",
            }}
          >
            🎲 Randoms
          </button>
          <button
            onClick={() => setDark((d) => !d)}
            style={{
              marginLeft: "auto",
              padding: "9px 14px",
              borderRadius: 999,
              border: "1px solid rgba(0,0,0,.1)",
              background: "#fff",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {dark ? "☾ dark bg" : "☀ light bg"}
          </button>
        </div>

        <p style={{ color: "rgba(3,3,3,.55)", fontSize: 14, marginBottom: 16 }}>
          {isRandoms
            ? "a grab-bag of experiments — pure imagination"
            : variant?.blurb}
        </p>

        {isRandoms ? (
          <RandomsGallery dark={dark} />
        ) : (
          variant && (
            <>
              {/* hero stage */}
              <Stage dark={dark} size={1.6}>
                {variant.render(1.6)}
              </Stage>

              {/* size matrix — see how it reads small (inline/button) vs large */}
              <h2
                style={{
                  fontSize: 13,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "rgba(3,3,3,.45)",
                  margin: "40px 0 14px",
                }}
              >
                At different sizes
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 16,
                }}
              >
                {[0.45, 0.8, 1.2].map((s) => (
                  <Stage key={s} dark={dark} size={s}>
                    {variant.render(s)}
                  </Stage>
                ))}
              </div>
            </>
          )
        )}
      </div>

      <style>{`
        @keyframes nf-spin { to { transform: rotate(360deg); } }
        @keyframes nf-morph {
          0%     { clip-path: ${SHAPES.square}; }
          16.6%  { clip-path: ${SHAPES.circle}; }
          33.3%  { clip-path: ${SHAPES.triangle}; }
          50%    { clip-path: ${SHAPES.diamond}; }
          66.6%  { clip-path: ${SHAPES.star}; }
          83.3%  { clip-path: ${SHAPES.plus}; }
          100%   { clip-path: ${SHAPES.square}; }
        }
        @keyframes nf-tumble {
          0%, 100% { transform: rotate(0deg) scale(.7); }
          50%      { transform: rotate(180deg) scale(1); }
        }
        @keyframes nf-colors {
          0%   { background: #00AACF; }
          25%  { background: #FC5652; }
          50%  { background: #FFCB00; }
          75%  { background: #00B3A0; }
          100% { background: #00AACF; }
        }
        @keyframes nf-slide-r {
          0%, 100% { transform: translateX(0); }
          50%      { transform: translateX(28px); }
        }
        @keyframes nf-slide-l {
          0%, 100% { transform: translateX(0); }
          50%      { transform: translateX(-28px); }
        }
      `}</style>

      {/* Corner-rounding filter for clip-path shapes: blur, then re-sharpen the
          alpha so straight edges stay crisp but corners come out rounded. */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id="nf-round">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b" />
            <feColorMatrix
              in="b"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            />
          </filter>
          {/* stronger blur → the gooey "blobs fuse" effect */}
          <filter id="nf-goo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b" />
            <feColorMatrix
              in="b"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
            />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
