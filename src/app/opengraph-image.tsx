import { ImageResponse } from "next/og";
import { PRODUCT } from "@/config/product";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${PRODUCT.name} | School Management System`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#0f0f0f",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: PRODUCT.primaryColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              fontWeight: 800,
            }}
          >
            C
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>{PRODUCT.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>
            Complete School Management.
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, color: PRODUCT.primaryColor }}>
            Configured for Your School.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 30, color: "#a3a3a3" }}>
          Student administration · Academics · Staff · Communication · Finance
        </div>
      </div>
    ),
    { ...size }
  );
}
