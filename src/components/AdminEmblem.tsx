import React from "react";

/**
 * Huy hiệu Hành chính Sao Vàng - Lúa Vàng - Trống Đồng cách điệu (SVG thuần)
 */
export function AdminEmblem({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Biểu trưng Hệ thống Hành chính Phường Thanh Nhàn"
      className="shrink-0"
    >
      {/* Vành lúa vàng & viền xanh lá truyền thống bao quanh */}
      <circle cx="32" cy="32" r="30" fill="#FEF08A" stroke="#D97706" strokeWidth="2.2" />
      <circle cx="32" cy="32" r="25.5" fill="#15803D" stroke="#F59E0B" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="20.5" fill="#CE1126" stroke="#FACC15" strokeWidth="1.6" />
      {/* Cánh sen & dải lụa đỏ vàng phía dưới */}
      <path
        d="M14 45C19.5 51 25.5 53.5 32 53.5C38.5 53.5 44.5 51 50 45"
        stroke="#B91C1C"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M19 48.5L32 43.5L45 48.5"
        stroke="#F59E0B"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Ngôi sao vàng 5 cánh trung tâm */}
      <polygon
        points="32,15 35.4,25.2 46.2,25.2 37.4,31.6 40.8,41.8 32,35.4 23.2,41.8 26.6,31.6 17.8,25.2 28.6,25.2"
        fill="#FACC15"
        stroke="#FEF9C3"
        strokeWidth="0.7"
      />
    </svg>
  );
}

/**
 * Họa tiết Trống đồng Đông Sơn chìm vàng đồng ấm trên nền Vàng kem
 */
export function BronzeDrumWatermark() {
  return (
    <svg
      viewBox="0 0 240 240"
      className="pointer-events-none select-none opacity-25"
      width="240"
      height="240"
      aria-hidden="true"
    >
      <circle cx="120" cy="120" r="112" stroke="#D97706" strokeWidth="1.6" fill="none" />
      <circle cx="120" cy="120" r="92" stroke="#D97706" strokeWidth="1.1" strokeDasharray="4 4" fill="none" />
      <circle cx="120" cy="120" r="68" stroke="#D97706" strokeWidth="1.3" fill="none" />
      <circle cx="120" cy="120" r="42" stroke="#D97706" strokeWidth="1.1" fill="none" />
      <polygon
        points="120,86 126,110 150,104 132,120 150,136 126,130 120,154 114,130 90,136 108,120 90,104 114,110"
        fill="#D97706"
      />
    </svg>
  );
}

/**
 * Dải họa tiết Hoa Sen hồng & Lá Sen xanh trang nhã chân nền Vàng kem (thuần SVG)
 */
export function LotusGardenStrip() {
  return (
    <div className="pointer-events-none select-none w-full overflow-hidden leading-none" aria-hidden="true">
      <svg
        viewBox="0 0 1440 68"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-10 sm:h-14 object-cover"
        preserveAspectRatio="none"
      >
        {/* Lớp lá sen xanh ngọc phía sau */}
        <ellipse cx="90" cy="64" rx="115" ry="26" fill="#15803D" fillOpacity="0.82" />
        <ellipse cx="260" cy="68" rx="95" ry="22" fill="#16A34A" fillOpacity="0.78" />
        <ellipse cx="470" cy="66" rx="120" ry="24" fill="#15803D" fillOpacity="0.72" />
        <ellipse cx="720" cy="67" rx="135" ry="25" fill="#166534" fillOpacity="0.8" />
        <ellipse cx="980" cy="66" rx="120" ry="24" fill="#16A34A" fillOpacity="0.76" />
        <ellipse cx="1210" cy="65" rx="110" ry="25" fill="#15803D" fillOpacity="0.82" />
        <ellipse cx="1370" cy="64" rx="105" ry="26" fill="#166534" fillOpacity="0.85" />

        {/* Bông sen 1 (trái) */}
        <g transform="translate(175, 22)">
          <path d="M0 36 C-18 24 -22 8 -8 2 C-2 12 -2 24 0 36Z" fill="#FB7185" />
          <path d="M0 36 C18 24 22 8 8 2 C2 12 2 24 0 36Z" fill="#FB7185" />
          <path d="M0 36 C-10 20 -8 2 0 -6 C8 2 10 20 0 36Z" fill="#F43F5E" />
          <circle cx="0" cy="22" r="5" fill="#FACC15" />
        </g>

        {/* Bông sen 2 (trung tâm) */}
        <g transform="translate(720, 16)">
          <path d="M0 44 C-28 32 -34 12 -14 4 C-5 16 -4 30 0 44Z" fill="#FDA4AF" />
          <path d="M0 44 C28 32 34 12 14 4 C5 16 4 30 0 44Z" fill="#FDA4AF" />
          <path d="M0 44 C-18 26 -16 4 -5 -4 C-1 10 -1 26 0 44Z" fill="#FB7185" />
          <path d="M0 44 C18 26 16 4 5 -4 C1 10 1 26 0 44Z" fill="#FB7185" />
          <path d="M0 44 C-10 22 -8 -2 0 -10 C8 -2 10 22 0 44Z" fill="#E11D48" />
          <ellipse cx="0" cy="26" rx="7" ry="4" fill="#FACC15" />
        </g>

        {/* Bông sen 3 (phải) */}
        <g transform="translate(1265, 20)">
          <path d="M0 38 C-20 26 -24 10 -10 2 C-3 13 -2 25 0 38Z" fill="#FDA4AF" />
          <path d="M0 38 C20 26 24 10 10 2 C3 13 2 25 0 38Z" fill="#FDA4AF" />
          <path d="M0 38 C-11 21 -9 2 0 -7 C9 2 11 21 0 38Z" fill="#F43F5E" />
          <circle cx="0" cy="23" r="5.5" fill="#FACC15" />
        </g>
      </svg>
    </div>
  );
}
