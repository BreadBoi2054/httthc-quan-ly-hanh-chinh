import React from "react";

/**
 * Huy hiệu Hành chính Sao Vàng - Hoa Sen - Trống Đồng cách điệu (Tự vẽ bằng SVG thuần, không phụ thuộc ảnh ngoài)
 */
export function AdminEmblem({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Biểu trưng Hệ thống Hành chính"
      className="shrink-0"
    >
      <circle cx="32" cy="32" r="30" fill="#991B1B" stroke="#F59E0B" strokeWidth="2.5" />
      <circle
        cx="32"
        cy="32"
        r="24"
        fill="none"
        stroke="#FCD34D"
        strokeWidth="1"
        strokeDasharray="3 2"
      />
      {/* Cánh sen cách điệu nâng đỡ phía dưới */}
      <path
        d="M16 44C21 49 26.5 51 32 51C37.5 51 43 49 48 44"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M21 47.5L32 42L43 47.5"
        stroke="#FCD34D"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* Ngôi sao vàng 5 cánh trung tâm */}
      <polygon
        points="32,13 35.9,24.8 48.3,24.8 38.2,32.1 42.1,43.9 32,36.6 21.9,43.9 25.8,32.1 15.7,24.8 28.1,24.8"
        fill="#FACC15"
        stroke="#FEF08A"
        strokeWidth="0.8"
      />
    </svg>
  );
}

/**
 * Họa tiết Trống đồng Đông Sơn chìm trang nhã trên nền Đỏ Hành chính
 */
export function BronzeDrumWatermark() {
  return (
    <svg
      viewBox="0 0 240 240"
      className="pointer-events-none select-none opacity-15"
      width="220"
      height="220"
      aria-hidden="true"
    >
      <circle cx="120" cy="120" r="112" stroke="#FCD34D" strokeWidth="1.5" fill="none" />
      <circle cx="120" cy="120" r="92" stroke="#FCD34D" strokeWidth="1" strokeDasharray="4 4" fill="none" />
      <circle cx="120" cy="120" r="68" stroke="#FCD34D" strokeWidth="1.2" fill="none" />
      <circle cx="120" cy="120" r="42" stroke="#FCD34D" strokeWidth="1" fill="none" />
      <polygon
        points="120,88 126,110 148,104 132,120 148,136 126,130 120,152 114,130 92,136 108,120 92,104 114,110"
        fill="#FCD34D"
      />
    </svg>
  );
}
