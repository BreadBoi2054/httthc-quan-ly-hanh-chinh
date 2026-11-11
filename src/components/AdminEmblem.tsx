import React, { useId } from "react";

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
      {/* Vành ngoài vàng kim & đường chấm trống đồng */}
      <circle cx="32" cy="32" r="30.5" fill="#FEF08A" stroke="#B45309" strokeWidth="2" />
      <circle
        cx="32"
        cy="32"
        r="28"
        stroke="#D97706"
        strokeWidth="1"
        strokeDasharray="2 2.2"
        fill="none"
      />
      {/* Vành xanh lục & nền đỏ cờ trung tâm */}
      <circle cx="32" cy="32" r="25" fill="#15803D" stroke="#F59E0B" strokeWidth="1.4" />
      <circle cx="32" cy="32" r="20.2" fill="#CE1126" stroke="#FACC15" strokeWidth="1.6" />
      {/* Vòng tia trống đồng mờ phía sau ngôi sao */}
      <circle
        cx="32"
        cy="32"
        r="15.5"
        stroke="#FDE047"
        strokeOpacity="0.45"
        strokeWidth="0.9"
        strokeDasharray="1.6 2.4"
      />
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

function polarPoint(cx: number, cy: number, radius: number, angleDeg: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [
    Number((cx + radius * Math.cos(rad)).toFixed(2)),
    Number((cy + radius * Math.sin(rad)).toFixed(2)),
  ];
}

function buildStarPoints(cx: number, cy: number, rays: number, rOuter: number, rInner: number): string {
  const pts: string[] = [];
  const step = 360 / rays;
  for (let i = 0; i < rays; i += 1) {
    const [ox, oy] = polarPoint(cx, cy, rOuter, i * step);
    const [ix, iy] = polarPoint(cx, cy, rInner, (i + 0.5) * step);
    pts.push(`${ox},${oy}`, `${ix},${iy}`);
  }
  return pts.join(" ");
}

function buildSawtoothPoints(cx: number, cy: number, teeth: number, rInner: number, rOuter: number): string {
  const pts: string[] = [];
  const step = 360 / teeth;
  for (let i = 0; i < teeth; i += 1) {
    const [ix, iy] = polarPoint(cx, cy, rInner, i * step);
    const [ox, oy] = polarPoint(cx, cy, rOuter, (i + 0.5) * step);
    pts.push(`${ix},${iy}`, `${ox},${oy}`);
  }
  return pts.join(" ");
}

const DRUM_SUN_POINTS = buildStarPoints(200, 200, 14, 44, 15);
const DRUM_INNER_SAWTOOTH = buildSawtoothPoints(200, 200, 44, 92, 105);
const DRUM_OUTER_SAWTOOTH = buildSawtoothPoints(200, 200, 64, 166, 179);

const DRUM_FEATHER_ANGLES = Array.from({ length: 14 }, (_, i) => Number(((i + 0.5) * (360 / 14)).toFixed(2)));
const DRUM_TANGENT_CIRCLES = Array.from({ length: 20 }, (_, i) => {
  const [x, y] = polarPoint(200, 200, 74, i * 18);
  const [nx, ny] = polarPoint(200, 200, 74, (i + 1) * 18);
  return { x, y, nx, ny };
});
const DRUM_BEAD_DOTS = Array.from({ length: 36 }, (_, i) => {
  const [x, y] = polarPoint(200, 200, 55, i * 10);
  return { x, y };
});
const DRUM_BIRD_ANGLES = Array.from({ length: 8 }, (_, i) => i * 45);
const DRUM_RIM_TICKS = Array.from({ length: 72 }, (_, i) => {
  const [x1, y1] = polarPoint(200, 200, 183, i * 5);
  const [x2, y2] = polarPoint(200, 200, 193, i * 5);
  return { x1, y1, x2, y2 };
});

/**
 * Mặt Trống đồng Ngọc Lũ – Đông Sơn chi tiết cao (Mặt trời 14 tia, lông công, vòng tròn tiếp tuyến,
 * văn răng cưa kỷ hà và đàn 08 Chim Lạc sải cánh ngược chiều kim đồng hồ).
 */
export function BronzeDrumWatermark({
  size = 420,
  className = "opacity-20",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 400 400"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {/* Vành ngoài cùng của mặt trống */}
      <circle cx="200" cy="200" r="197" stroke="#B45309" strokeWidth="2.2" />
      <circle cx="200" cy="200" r="193" stroke="#D97706" strokeWidth="1.2" />
      <circle cx="200" cy="200" r="183" stroke="#B45309" strokeWidth="1.4" />

      {/* Vạch khắc kỷ hà vành ngoài */}
      {DRUM_RIM_TICKS.map((t, idx) => (
        <line
          key={idx}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="#D97706"
          strokeWidth="1"
        />
      ))}

      {/* Vành răng cưa ngoài */}
      <circle cx="200" cy="200" r="179" stroke="#D97706" strokeWidth="1" />
      <polygon points={DRUM_OUTER_SAWTOOTH} stroke="#B45309" strokeWidth="1.1" fill="none" />
      <circle cx="200" cy="200" r="166" stroke="#B45309" strokeWidth="1.4" />
      <circle cx="200" cy="200" r="160" stroke="#D97706" strokeWidth="1" strokeDasharray="3 3" />

      {/* Vành chính: Đàn 08 Chim Lạc Đông Sơn & hoa văn trám lồng xen kẽ */}
      {DRUM_BIRD_ANGLES.map((angle) => (
        <g key={angle} transform={`rotate(${angle} 200 200)`}>
          {/* Chim Lạc sải cánh bay ngược chiều kim đồng hồ */}
          <path
            d="M214 65 L170 63 L180 67.5 L212 70 Z"
            fill="#B45309"
          />
          {/* Mào Chim Lạc uốn cong */}
          <path
            d="M188 64 Q201 53 216 56"
            stroke="#B45309"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Cánh trên vươn cao */}
          <path
            d="M196 65 L209 45 L220 49 L205 66 Z"
            fill="#D97706"
            stroke="#B45309"
            strokeWidth="0.9"
          />
          {/* Cánh dưới sải rộng */}
          <path
            d="M197 69 L209 86 L219 83 L206 69 Z"
            fill="#D97706"
            stroke="#B45309"
            strokeWidth="0.9"
          />
          {/* Đuôi dài 3 dải lông vũ */}
          <path
            d="M212 66 L234 60 M212 68 L236 67.5 M211 70 L233 75"
            stroke="#B45309"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Hoa văn trám lồng kỷ hà xen giữa hai cánh chim (ở góc lệch 22.5 độ) */}
          <g transform="rotate(22.5 200 200)">
            <polygon
              points="200,56 209,66 200,76 191,66"
              stroke="#B45309"
              strokeWidth="1.2"
              fill="none"
            />
            <circle cx="200" cy="66" r="2.3" fill="#D97706" />
          </g>
        </g>
      ))}

      {/* Vành răng cưa trong */}
      <circle cx="200" cy="200" r="110" stroke="#B45309" strokeWidth="1.4" />
      <circle cx="200" cy="200" r="105" stroke="#D97706" strokeWidth="0.9" />
      <polygon points={DRUM_INNER_SAWTOOTH} stroke="#B45309" strokeWidth="1.1" fill="none" />
      <circle cx="200" cy="200" r="92" stroke="#B45309" strokeWidth="1.3" />

      {/* Vành vòng tròn đồng tâm chấm giữa có tiếp tuyến (đặc trưng trống Ngọc Lũ) */}
      <circle cx="200" cy="200" r="85" stroke="#D97706" strokeWidth="0.9" />
      {DRUM_TANGENT_CIRCLES.map((c, idx) => (
        <g key={idx}>
          <line
            x1={c.x}
            y1={c.y}
            x2={c.nx}
            y2={c.ny}
            stroke="#D97706"
            strokeWidth="0.9"
          />
          <circle cx={c.x} cy={c.y} r="5.5" fill="#FFFBEB" stroke="#B45309" strokeWidth="1.1" />
          <circle cx={c.x} cy={c.y} r="1.8" fill="#B45309" />
        </g>
      ))}
      <circle cx="200" cy="200" r="63" stroke="#B45309" strokeWidth="1.3" />

      {/* Vòng hạt châu bao quanh mặt trời */}
      {DRUM_BEAD_DOTS.map((d, idx) => (
        <circle key={idx} cx={d.x} cy={d.y} r="1.5" fill="#B45309" />
      ))}
      <circle cx="200" cy="200" r="47" stroke="#B45309" strokeWidth="1.5" />

      {/* Họa tiết lông công hình tam giác xen kẽ 14 tia mặt trời */}
      {DRUM_FEATHER_ANGLES.map((deg) => (
        <g key={deg} transform={`rotate(${deg} 200 200)`}>
          <path d="M196.5 157 L200 173 L203.5 157" stroke="#D97706" strokeWidth="1.1" fill="none" />
          <circle cx="200" cy="161" r="1.2" fill="#B45309" />
        </g>
      ))}

      {/* Mặt trời 14 tia trung tâm Trống đồng Đông Sơn */}
      <polygon points={DRUM_SUN_POINTS} fill="#D97706" stroke="#92400E" strokeWidth="1" />
      <circle cx="200" cy="200" r="9" fill="#FEF3C7" stroke="#B45309" strokeWidth="1.4" />
      <circle cx="200" cy="200" r="3.5" fill="#B45309" />
    </svg>
  );
}

/**
 * Biểu tượng Chim Lạc Đỏ cờ – Vàng đồng sải cánh (đặt cạnh tiêu đề chuyên mục lớn)
 */
export function LacBirdEmblem({
  size = 36,
  flip = false,
  className = "",
}: {
  size?: number;
  flip?: boolean;
  className?: string;
}) {
  const height = Math.round((size * 40) / 56);
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 56 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 pointer-events-none select-none ${flip ? "-scale-x-100" : ""} ${className}`}
      aria-hidden="true"
    >
      {/* Vầng nhật nguyệt vàng nhỏ phía trước */}
      <circle cx="11" cy="11" r="3.2" fill="#F59E0B" fillOpacity="0.28" />
      <circle cx="11" cy="11" r="1.6" fill="#D97706" />

      {/* Cánh trên vươn cao (Đỏ cờ chủ đạo + gân lông vũ vàng) */}
      <path
        d="M25 22 L15 5 L23 7.5 L31 19 Z"
        fill="#CE1126"
      />
      <path
        d="M28 21 L24 4 L31 7 L35 19 Z"
        fill="#E11D48"
      />
      <path
        d="M22 9 L28 19 M27 8 L32 19"
        stroke="#FDE047"
        strokeWidth="0.9"
        strokeLinecap="round"
      />

      {/* Thân & mỏ dài vươn tới phía trước */}
      <path
        d="M4 16 L20 18.5 L39 22.5 L53 19.5 L42 25.5 L22 23.5 L12 19 Z"
        fill="#CE1126"
      />
      {/* Mào Chim Lạc uốn lượn */}
      <path
        d="M16 17 C20 11 27 10 34 12"
        stroke="#D97706"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Cánh dưới & dải đuôi Lạc Việt */}
      <path
        d="M26 23.5 L19 36 L27 34.5 L34 24.5 Z"
        fill="#B91C1C"
      />
      <path
        d="M38 23.5 L54 24.5 M37 25 L52 29.5 M35 26 L48 33.5"
        stroke="#D97706"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Đường diềm Hồi văn Kỷ hà – Trám lồng Đông Sơn chạy ngang trang trọng
 */
export function DongSonFretStrip({ className = "" }: { className?: string }) {
  const rawId = useId().replace(/:/g, "");
  const patternId = `dongson-fret-${rawId}`;

  return (
    <div
      className={`no-print pointer-events-none select-none w-full overflow-hidden leading-none bg-[#f6d56b] border-y border-[#dfB648] ${className}`}
      aria-hidden="true"
    >
      <svg
        width="100%"
        height="10"
        viewBox="0 0 1440 10"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full h-[9px]"
      >
        <defs>
          <pattern id={patternId} x="0" y="0" width="36" height="10" patternUnits="userSpaceOnUse">
            {/* Hồi văn chữ S gãy & trám lồng Đông Sơn */}
            <path
              d="M2 8 L2 2 L10 2 L10 5 L6 5 L6 8 L14 8 L14 2"
              stroke="#B45309"
              strokeOpacity="0.65"
              strokeWidth="1.1"
              fill="none"
            />
            <polygon
              points="25,1.5 31,5 25,8.5 19,5"
              stroke="#991B1B"
              strokeOpacity="0.55"
              strokeWidth="1.05"
              fill="none"
            />
            <circle cx="25" cy="5" r="1.2" fill="#B45309" fillOpacity="0.7" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="1440" height="10" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}

function BloomingLotus({
  x,
  y,
  scale = 1,
}: {
  x: number;
  y: number;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Lớp cánh sen hồng phấn phía ngoài */}
      <path d="M0 44 C-34 36 -44 18 -26 8 C-14 16 -8 30 0 44Z" fill="#FECDD3" />
      <path d="M0 44 C34 36 44 18 26 8 C14 16 8 30 0 44Z" fill="#FECDD3" />
      <path d="M0 44 C-26 30 -32 10 -15 1 C-6 13 -4 28 0 44Z" fill="#FDA4AF" />
      <path d="M0 44 C26 30 32 10 15 1 C6 13 4 28 0 44Z" fill="#FDA4AF" />
      {/* Lớp cánh sen hồng đào trung tâm */}
      <path d="M0 44 C-16 25 -15 3 -5 -6 C-1 10 -1 26 0 44Z" fill="#FB7185" />
      <path d="M0 44 C16 25 15 3 5 -6 C1 10 1 26 0 44Z" fill="#FB7185" />
      {/* Cánh sen búp đỉnh thắm */}
      <path d="M0 44 C-9 22 -8 -3 0 -12 C8 -3 9 22 0 44Z" fill="#E11D48" />
      <path d="M0 41 C-4 22 -4 3 0 -5 C4 3 4 22 0 41Z" fill="#F43F5E" />
      {/* Nhụy & gương sen vàng óng */}
      <ellipse cx="0" cy="27" rx="8.5" ry="4.2" fill="#FACC15" />
      <ellipse cx="0" cy="26.5" rx="5.5" ry="2.4" fill="#D97706" />
      <circle cx="-4" cy="24" r="1.1" fill="#FEF08A" />
      <circle cx="0" cy="23" r="1.1" fill="#FEF08A" />
      <circle cx="4" cy="24" r="1.1" fill="#FEF08A" />
    </g>
  );
}

function LotusBud({
  x,
  y,
  tilt = 0,
  scale = 1,
}: {
  x: number;
  y: number;
  tilt?: number;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${tilt}) scale(${scale})`}>
      <path d="M0 28 C-9 18 -8 4 0 -6 C8 4 9 18 0 28Z" fill="#FB7185" />
      <path d="M0 28 C-5 17 -4 3 0 -6 C3 5 3 17 0 28Z" fill="#E11D48" />
      <path d="M0 29 C-7 24 -8 17 -4 13 C-1 19 -1 24 0 29Z" fill="#15803D" />
      <path d="M0 29 C7 24 8 17 4 13 C1 19 1 24 0 29Z" fill="#16A34A" />
    </g>
  );
}

function GoldenSeedPod({
  x,
  y,
  tilt = 0,
}: {
  x: number;
  y: number;
  tilt?: number;
}) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${tilt})`}>
      <path d="M-11 4 L0 22 L11 4 Z" fill="#15803D" />
      <ellipse cx="0" cy="4" rx="11" ry="4.8" fill="#FACC15" stroke="#B45309" strokeWidth="0.9" />
      <circle cx="-5" cy="4" r="1.2" fill="#92400E" />
      <circle cx="0" cy="3.2" r="1.2" fill="#92400E" />
      <circle cx="5" cy="4" r="1.2" fill="#92400E" />
      <circle cx="-2.5" cy="5.5" r="1.1" fill="#92400E" />
      <circle cx="2.5" cy="5.5" r="1.1" fill="#92400E" />
    </g>
  );
}

/**
 * Dải họa tiết Đầm Sen Việt Nam đa tầng (Hoa sen mãn khai, Búp sen hồng, Đài sen vàng & Lá sen gân xanh)
 */
export function LotusGardenStrip() {
  return (
    <div className="no-print pointer-events-none select-none w-full overflow-hidden leading-none" aria-hidden="true">
      <svg
        viewBox="0 0 1440 92"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-14 sm:h-20 block"
        preserveAspectRatio="xMidYMax slice"
      >
        {/* Thân cuống sen thanh mảnh */}
        <g stroke="#166534" strokeWidth="2.2" strokeLinecap="round">
          <line x1="95" y1="92" x2="90" y2="42" />
          <line x1="205" y1="92" x2="212" y2="48" />
          <line x1="315" y1="92" x2="310" y2="38" />
          <line x1="435" y1="92" x2="428" y2="52" />
          <line x1="545" y1="92" x2="548" y2="44" />
          <line x1="650" y1="92" x2="642" y2="46" />
          <line x1="720" y1="92" x2="720" y2="34" />
          <line x1="805" y1="92" x2="814" y2="50" />
          <line x1="915" y1="92" x2="912" y2="42" />
          <line x1="1035" y1="92" x2="1042" y2="50" />
          <line x1="1145" y1="92" x2="1140" y2="38" />
          <line x1="1255" y1="92" x2="1248" y2="48" />
          <line x1="1355" y1="92" x2="1360" y2="40" />
        </g>

        {/* Lớp lá sen xanh thẫm hậu cảnh */}
        <ellipse cx="65" cy="86" rx="110" ry="26" fill="#14532D" fillOpacity="0.88" />
        <ellipse cx="255" cy="88" rx="115" ry="25" fill="#166534" fillOpacity="0.88" />
        <ellipse cx="475" cy="87" rx="125" ry="26" fill="#15803D" fillOpacity="0.85" />
        <ellipse cx="720" cy="88" rx="145" ry="28" fill="#14532D" fillOpacity="0.9" />
        <ellipse cx="970" cy="87" rx="125" ry="26" fill="#166534" fillOpacity="0.86" />
        <ellipse cx="1195" cy="88" rx="115" ry="25" fill="#15803D" fillOpacity="0.88" />
        <ellipse cx="1380" cy="86" rx="110" ry="26" fill="#14532D" fillOpacity="0.9" />

        {/* Lớp lá sen xanh ngọc tiền cảnh kèm gân lá */}
        <ellipse cx="165" cy="90" rx="88" ry="20" fill="#16A34A" fillOpacity="0.88" />
        <ellipse cx="385" cy="91" rx="92" ry="19" fill="#22C55E" fillOpacity="0.78" />
        <ellipse cx="610" cy="90" rx="96" ry="20" fill="#16A34A" fillOpacity="0.86" />
        <ellipse cx="840" cy="90" rx="96" ry="20" fill="#16A34A" fillOpacity="0.86" />
        <ellipse cx="1065" cy="91" rx="92" ry="19" fill="#22C55E" fillOpacity="0.78" />
        <ellipse cx="1290" cy="90" rx="88" ry="20" fill="#16A34A" fillOpacity="0.88" />

        {/* Gân lá sen thanh mảnh */}
        <g stroke="#86EFAC" strokeOpacity="0.55" strokeWidth="1">
          <path d="M125 88 Q165 78 205 88" />
          <path d="M565 88 Q610 77 655 88" />
          <path d="M795 88 Q840 77 885 88" />
          <path d="M1250 88 Q1290 78 1330 88" />
        </g>

        {/* Đài sen vàng (gương sen) */}
        <GoldenSeedPod x={428} y={44} tilt={-8} />
        <GoldenSeedPod x={814} y={42} tilt={9} />
        <GoldenSeedPod x={1248} y={40} tilt={-6} />

        {/* Búp sen hồng duyên dáng */}
        <LotusBud x={212} y={32} tilt={8} scale={0.95} />
        <LotusBud x={642} y={30} tilt={-7} scale={0.95} />
        <LotusBud x={1042} y={34} tilt={7} scale={0.92} />

        {/* 07 Đóa sen hồng Việt Nam mãn khai trải đều toàn dải */}
        <BloomingLotus x={90} y={24} scale={0.92} />
        <BloomingLotus x={310} y={20} scale={1.02} />
        <BloomingLotus x={548} y={28} scale={0.88} />
        <BloomingLotus x={720} y={14} scale={1.18} />
        <BloomingLotus x={912} y={26} scale={0.9} />
        <BloomingLotus x={1140} y={20} scale={1.02} />
        <BloomingLotus x={1360} y={24} scale={0.92} />
      </svg>
    </div>
  );
}

/**
 * Khung tiêu đề chuyên trang mang bản sắc Trống đồng Đông Sơn & Chim Lạc Việt Nam
 */
export function CulturalSubpageBanner({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="no-print relative overflow-hidden bg-[#fff8dc] border border-[#e5c56b] border-l-4 border-l-[#ce1126] border-b-2 border-b-[#ce1126] px-5 py-4 rounded-[2px]">
      <div className="absolute -right-12 -top-16 hidden sm:block">
        <BronzeDrumWatermark size={240} className="opacity-[0.16]" />
      </div>
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-4xl">
          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-wider text-[#ce1126]">
              {eyebrow}
            </p>
          )}
          <div className="flex items-center gap-2.5">
            <LacBirdEmblem size={34} />
            <h1 className="text-xl sm:text-2xl font-bold text-[#991b1b] uppercase font-official-serif">
              {title}
            </h1>
          </div>
          <div className="text-sm text-[#4a2518]">{description}</div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
