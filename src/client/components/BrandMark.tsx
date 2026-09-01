import React from "react";

const SIZE = 18;

export function BrandMark({ size = SIZE }: { size?: number } = {}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
      style={{
        display: "block",
        flex: "none"
      }}
    >
      <circle cx="9" cy="9" r="6.75" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path fill="currentColor" d="M1.55 16.45 7.65 10.35a1.2 1.2 0 0 1 1.7 0L16.45 1.55 10.35 7.65a1.2 1.2 0 0 1-1.7 0z" />
    </svg>
  );
}
