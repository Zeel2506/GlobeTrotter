import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// A favicon should be square. logo.png is 628x397, and browsers letterbox a
// non-square icon into the tab slot, which wastes most of it. This composes the
// mark onto a square field at build time using Next's own image generation, so
// no image library is needed.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  const logo = readFileSync(join(process.cwd(), "public", "logo.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          borderRadius: 12,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={54} height={34} alt="" />
      </div>
    ),
    { ...size },
  );
}
