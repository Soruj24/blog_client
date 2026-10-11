import { ImageResponse } from "next/og";

// Brand-matched share image: warm paper background, ink text.
// Flat color only — no gradients, per the site's editorial system.
export const alt = "Inkwell — Ideas worth reading slowly";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "96px",
          background: "#fafaf9",
          color: "#18181b",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#71717a",
          }}
        >
          Inkwell · Editorial platform
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 96,
            lineHeight: 1.05,
            fontWeight: 700,
            fontFamily: "Georgia, 'Times New Roman', serif",
            letterSpacing: "-0.01em",
          }}
        >
          Ideas worth reading slowly
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 32,
            lineHeight: 1.4,
            color: "#52525b",
          }}
        >
          Long-form essays on technology, design, and culture.
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
