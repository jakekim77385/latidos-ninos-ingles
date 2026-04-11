/**
 * generate_frames.js
 * 1~20 숫자에 대한 Ten Frame SVG 이미지를 정확하게 생성
 * - 1~10: 단일 프레임 (N칸 채움)
 * - 11~20: 이중 프레임 (첫 번째 꽉 참 + 두 번째 N-10칸 채움)
 */

const fs   = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'assets', 'fingers');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

/* ── 색상 (앱 디자인 시스템과 동일) ─────────────────── */
const C = {
  bg:          '#FFF5F7',
  coral:       '#FF6B6B',
  coralLight:  '#FFE8E8',
  coralBorder: '#FFAAAA',
  white:       '#FFFFFF',
  shadow:      'rgba(255,107,107,0.15)',
};

const SIZE   = 280;  // SVG 전체 크기
const CELL   = 42;   // 각 셀 크기
const GAP    = 7;    // 셀 간격
const PAD    = 10;   // 프레임 내부 패딩
const R_DOT  = 17;   // 채워진 원 반지름
const COLS   = 5;
const ROWS   = 2;

/* ── Ten Frame 하나를 SVG 문자열로 반환 ──────────────── */
function buildFrame(filled, total = 10) {
  const fw = COLS * CELL + (COLS - 1) * GAP + PAD * 2;
  const fh = ROWS * CELL + (ROWS - 1) * GAP + PAD * 2;
  let out = '';

  // 외곽 프레임 박스
  out += `<rect x="0" y="0" width="${fw}" height="${fh}" rx="14" ry="14"
           fill="${C.coralLight}" stroke="${C.coralBorder}" stroke-width="3"/>`;

  // 가로 중앙선 (5칸 구분)
  const midY = PAD + CELL + GAP / 2;
  out += `<line x1="8" y1="${midY}" x2="${fw - 8}" y2="${midY}"
           stroke="${C.coralBorder}" stroke-width="1.5"/>`;

  // 세로 구분선 (각 셀 경계)
  for (let c = 1; c < COLS; c++) {
    const lx = PAD + c * (CELL + GAP) - GAP / 2;
    out += `<line x1="${lx}" y1="8" x2="${lx}" y2="${fh - 8}"
             stroke="${C.coralBorder}" stroke-width="1"/>`;
  }

  // 각 셀
  for (let i = 0; i < total; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const cx  = PAD + col * (CELL + GAP) + CELL / 2;
    const cy  = PAD + row * (CELL + GAP) + CELL / 2;

    if (i < filled) {
      // 채워진 셀 — coral 원
      out += `<circle cx="${cx}" cy="${cy}" r="${R_DOT}" fill="${C.coral}"/>`;
      // 하이라이트
      out += `<circle cx="${cx - 5}" cy="${cy - 5}" r="5"
               fill="rgba(255,255,255,0.35)"/>`;
    } else {
      // 빈 셀 — 점선 원
      out += `<circle cx="${cx}" cy="${cy}" r="${R_DOT}"
               fill="${C.white}" stroke="${C.coralBorder}"
               stroke-width="2" stroke-dasharray="5,4"/>`;
    }
  }

  return { svg: out, width: fw, height: fh };
}

/* ── 번호 배지 ──────────────────────────────────────── */
function numBadge(n, x, y) {
  return `
    <rect x="${x - 22}" y="${y - 16}" width="44" height="32" rx="10"
          fill="${C.coral}" />
    <text x="${x}" y="${y + 6}" text-anchor="middle"
          font-family="Arial Rounded MT Bold, Arial, sans-serif"
          font-size="18" font-weight="900" fill="white"
          letter-spacing="-0.5">${n}</text>`;
}

/* ── SVG 생성 ────────────────────────────────────────── */
function generateSVG(n) {
  let body = '';

  if (n <= 10) {
    /* 단일 프레임 */
    const f = buildFrame(n, 10);
    const tx = Math.round((SIZE - f.width)  / 2);
    const ty = Math.round((SIZE - f.height) / 2);
    body += `<g transform="translate(${tx},${ty})">${f.svg}</g>`;
    // 좌상단 숫자 배지
    body += numBadge(n, tx + 26, ty - 18);

  } else {
    /* 이중 프레임 */
    const f1 = buildFrame(10, 10);   // 꽉 참
    const f2 = buildFrame(n - 10, 10); // 나머지

    const gap  = 14;  // 두 프레임 사이 간격
    const totalW = f1.width + gap + f2.width;
    const tx1 = Math.round((SIZE - totalW) / 2);
    const tx2 = tx1 + f1.width + gap;
    const ty  = Math.round((SIZE - f1.height) / 2);

    body += `<g transform="translate(${tx1},${ty})">${f1.svg}</g>`;
    body += `<g transform="translate(${tx2},${ty})">${f2.svg}</g>`;

    // 두 프레임 사이 "+" 표시
    const plusX = tx1 + f1.width + gap / 2;
    const plusY  = ty + f1.height / 2;
    body += `<text x="${plusX}" y="${plusY + 7}" text-anchor="middle"
               font-family="Arial, sans-serif" font-size="20"
               font-weight="900" fill="${C.coral}">+</text>`;

    // 좌상단 숫자 배지
    body += numBadge(n, tx1 + 26, ty - 18);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <!-- 배경 -->
  <rect width="${SIZE}" height="${SIZE}" fill="${C.bg}" rx="24"/>
  <!-- 그림자 효과 -->
  <filter id="shdw">
    <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="${C.shadow}"/>
  </filter>
  <g filter="url(#shdw)">
    ${body}
  </g>
</svg>`;
}

/* ── 실행 ────────────────────────────────────────────── */
for (let n = 1; n <= 20; n++) {
  const svg  = generateSVG(n);
  const file = path.join(OUT_DIR, `finger_${n}.svg`);
  fs.writeFileSync(file, svg, 'utf8');
  console.log(`✅ finger_${n}.svg  (filled: ${n <= 10 ? n : 10}+${n > 10 ? n-10 : 0})`);
}
console.log('\n🎉 완료! assets/fingers/ 에 finger_1.svg ~ finger_20.svg 생성됨');
