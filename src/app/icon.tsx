import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          borderRadius: 10,
          fontSize: 18,
          fontWeight: 800,
          color: "white",
          fontFamily: "Poppins, Arial, sans-serif",
        }}
      >
        IA
      </div>
    ),
    {
      ...size,
    }
  );
}
