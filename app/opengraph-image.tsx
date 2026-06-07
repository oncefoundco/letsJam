import { ImageResponse } from "next/og";
import { SITE_TAGLINE } from "@/lib/seo";

/**
 * Generated 1200×630 social card. Branded letsJam lockup + value line + domain,
 * so shared links unfurl as the product (not the old "Together" title). Uses
 * only flexbox + the default bundled font, which satori (next/og) supports.
 * Shared by Twitter via app/twitter-image.tsx.
 */
export const alt = `letsJam — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "76px 84px",
          background: "#f4f4f4",
          color: "#030303",
        }}
      >
        {/* brand lockup */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#e4ecff",
              borderRadius: "999px",
              padding: "6px 20px",
              fontSize: 36,
              fontWeight: 600,
              transform: "rotate(-8deg)",
            }}
          >
            lets
          </div>
          <div style={{ fontSize: 50, fontWeight: 700, marginLeft: 8 }}>jam</div>
        </div>

        {/* value line */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 600,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              maxWidth: 940,
            }}
          >
            The AI decision room for teams.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              lineHeight: 1.35,
              color: "rgba(3,3,3,0.6)",
              marginTop: 28,
              maxWidth: 860,
            }}
          >
            From “what are we actually solving?” to a decision everyone commits
            to — in one session.
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 28, color: "rgba(3,3,3,0.55)" }}>
            letsjam.so
          </div>
          <div
            style={{
              display: "flex",
              height: 16,
              width: 132,
              borderRadius: "999px",
              background: "#3c5bcb",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
