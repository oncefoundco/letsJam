/* ──────────────────────────────────────────────────────────────────────────
 * Morph Train — the project's loading animation.
 *
 * A row of tiles, each one shape-phase behind the last, so a wave of shapes
 * (square → circle → triangle → diamond → star → plus) sweeps across. Pure CSS:
 * the `mt-morph` keyframe lives in globals.css and the corner-rounding
 * `#mt-round` SVG filter is mounted once in the root layout — so this renders
 * anywhere (server or client) with no JS and no duplicated <style>/<svg>.
 * ────────────────────────────────────────────────────────────────────────── */

// Brand palette, one colour per tile.
const COLORS = ["#00AACF", "#FC5652", "#FFCB00", "#00B3A0", "#00AACF", "#FC5652"];

// Resting shape (square). All other shapes live in the keyframe in globals.css.
const SQUARE =
  "polygon(50% 0%, 75% 0%, 100% 0%, 100% 33.3%, 100% 66.7%, 100% 100%, 66.7% 100%, 33.3% 100%, 0% 100%, 0% 66.7%, 0% 33.3%, 0% 0%)";

const MORPH_MS = 3600; // one full trip through all the shapes

export function MorphTrain({
  size = 20,
  gap = 9,
  className,
  label = "Loading",
}: {
  /** tile size in px */
  size?: number;
  /** gap between tiles in px */
  gap?: number;
  className?: string;
  /** accessible label for the status role */
  label?: string;
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={className}
      style={{ display: "flex", gap, filter: "url(#mt-round)" }}
    >
      {COLORS.map((c, i) => (
        <span
          key={i}
          style={{
            width: size,
            height: size,
            background: c,
            clipPath: SQUARE,
            animation: `mt-morph ${MORPH_MS}ms ease-in-out infinite`,
            // each tile is one shape-phase behind the previous
            animationDelay: `${(-i * MORPH_MS) / COLORS.length}ms`,
          }}
        />
      ))}
    </div>
  );
}
