/**
 * generate_person_frames.js
 * 1~100 숫자를 "사람 = 10" 시스템으로 SVG 생성
 *
 * 규칙:
 *   complete = floor(N / 10) → 팔 올린 사람 아이콘 (각 10개 손가락)
 *   remain   = N % 10        → 낱개 손가락 dots
 *
 * 예: 23 = 사람 2명 + 손가락 3개
 *     50 = 사람 5명
 *     100 = 사람 10명
 */

const fs   = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'assets', 'fingers');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const C = {
  bg:          '#FFF5F7',
  coral:       '#FF6B6B',
  coralDark:   '#E85555',
  coralLight:  '#FFE8E8',
  coralBorder: '#FFAAAA',
  white:       '#FFFFFF',
  textMid:     '#6B7280',
};

/* ════════════════════════════════════════════════════════
   사람 아이콘 SVG (팔 들고 손가락 10개 표시)
   x, y = 상단 좌측 기준, size = 전체 높이
   ════════════════════════════════════════════════════════ */
function drawPerson(x, y, size) {
  const cx  = x + size * 0.5;
  const hR  = size * 0.13;          // 머리 반지름
  const sw  = size * 0.07;          // 선 두께
  const fR  = size * 0.055;         // 손가락 점 반지름
  let s = '';

  /* 머리 */
  s += `<circle cx="${r(cx)}" cy="${r(y + hR)}" r="${r(hR)}" fill="${C.coral}"/>`;

  /* 몸통 */
  const bodyT = y + hR * 2.1;
  const bodyB = y + size * 0.62;
  s += `<line x1="${r(cx)}" y1="${r(bodyT)}" x2="${r(cx)}" y2="${r(bodyB)}"
           stroke="${C.coral}" stroke-width="${r(sw)}" stroke-linecap="round"/>`;

  /* 왼팔 */
  const armY = y + size * 0.30;
  const lArmX = cx - size * 0.38;
  const lArmY = y + size * 0.10;
  s += `<line x1="${r(cx)}" y1="${r(armY)}" x2="${r(lArmX)}" y2="${r(lArmY)}"
           stroke="${C.coral}" stroke-width="${r(sw)}" stroke-linecap="round"/>`;

  /* 오른팔 */
  const rArmX = cx + size * 0.38;
  const rArmY = lArmY;
  s += `<line x1="${r(cx)}" y1="${r(armY)}" x2="${r(rArmX)}" y2="${r(rArmY)}"
           stroke="${C.coral}" stroke-width="${r(sw)}" stroke-linecap="round"/>`;

  /* 왼손 손가락 5개 (부채꼴) */
  for (let i = 0; i < 5; i++) {
    const ang = Math.PI * 1.35 + i * 0.18;
    const fx = lArmX + Math.cos(ang) * size * 0.14;
    const fy = lArmY + Math.sin(ang) * size * 0.14;
    s += `<circle cx="${r(fx)}" cy="${r(fy)}" r="${r(fR)}" fill="${C.coral}"/>`;
  }

  /* 오른손 손가락 5개 */
  for (let i = 0; i < 5; i++) {
    const ang = Math.PI * (-0.15) - i * 0.18;
    const fx = rArmX + Math.cos(ang) * size * 0.14;
    const fy = rArmY + Math.sin(ang) * size * 0.14;
    s += `<circle cx="${r(fx)}" cy="${r(fy)}" r="${r(fR)}" fill="${C.coral}"/>`;
  }

  /* 왼다리 */
  s += `<line x1="${r(cx)}" y1="${r(bodyB)}" x2="${r(cx - size*0.17)}" y2="${r(y + size*0.96)}"
           stroke="${C.coral}" stroke-width="${r(sw)}" stroke-linecap="round"/>`;
  /* 오른다리 */
  s += `<line x1="${r(cx)}" y1="${r(bodyB)}" x2="${r(cx + size*0.17)}" y2="${r(y + size*0.96)}"
           stroke="${C.coral}" stroke-width="${r(sw)}" stroke-linecap="round"/>`;

  return s;
}

/* ════════════════════════════════════════════════════════
   낱개 손가락 dots (remain개, 손 모양으로 배치)
   cx, cy = 중심점
   ════════════════════════════════════════════════════════ */
function drawFingerDots(cx, cy, count, dotR = 11) {
  if (count === 0) return '';
  let s = '';

  /* 손목/손바닥 반원 배경 */
  const palmR = dotR * 3.2;
  s += `<circle cx="${r(cx)}" cy="${r(cy + palmR * 0.3)}" r="${r(palmR)}"
           fill="${C.coralLight}" stroke="${C.coralBorder}" stroke-width="2"/>`;

  /* count개 손가락 (위쪽으로 부채형 배치) */
  const spread = Math.min(0.55, 0.15 + count * 0.09); // 각도 범위
  for (let i = 0; i < count; i++) {
    const ang = -Math.PI / 2 - spread + (2 * spread / Math.max(count - 1, 1)) * i;
    const safeAng = count === 1 ? -Math.PI / 2 : ang;
    const dist = palmR * 1.05;
    const fx = cx + Math.cos(safeAng) * dist;
    const fy = cy + Math.sin(safeAng) * dist + palmR * 0.3;
    /* 손가락 막대 */
    s += `<line x1="${r(cx + Math.cos(safeAng) * palmR * 0.55)}"
               y1="${r(cy + Math.sin(safeAng) * palmR * 0.55 + palmR * 0.3)}"
               x2="${r(fx)}" y2="${r(fy)}"
               stroke="${C.coral}" stroke-width="${r(dotR * 1.1)}"
               stroke-linecap="round"/>`;
    /* 손가락 끝 점 */
    s += `<circle cx="${r(fx)}" cy="${r(fy)}" r="${r(dotR * 0.7)}"
             fill="${C.white}" stroke="${C.coral}" stroke-width="2"/>`;
  }
  return s;
}

/* ════════════════════════════════════════════════════════
   숫자 배지
   ════════════════════════════════════════════════════════ */
function badge(n, x, y, fs = 20) {
  const w = n >= 100 ? 60 : n >= 10 ? 50 : 42;
  return `
    <rect x="${x - w/2}" y="${y - 18}" width="${w}" height="36" rx="12"
          fill="${C.coral}"/>
    <text x="${x}" y="${y + 8}" text-anchor="middle"
          font-family="Arial Rounded MT Bold, Arial, sans-serif"
          font-size="${fs}" font-weight="900" fill="white">${n}</text>`;
}

/* ── 소수점 제거 헬퍼 ─────────────────────────────────── */
function r(v) { return Math.round(v * 10) / 10; }

/* ════════════════════════════════════════════════════════
   메인 SVG 생성
   ════════════════════════════════════════════════════════ */
function generateSVG(n) {
  const complete = Math.floor(n / 10);
  const remain   = n % 10;

  /* ── 캔버스 크기 계산 ─────────────────────────────── */
  // 최대 한 줄에 5명
  const personsPerRow = 5;
  const personRows    = complete > 0 ? Math.ceil(complete / personsPerRow) : 0;

  const hasRemain = remain > 0;

  // 캔버스 너비: 사람이 있으면 사람 기준, 없으면 손가락 기준
  const W = 300;

  // 사람 크기: 한 줄에 5명이 들어가야 함
  const personsInFirstRow = Math.min(complete, personsPerRow);
  const personSize = personsInFirstRow > 0
    ? Math.min(72, Math.floor((W - 24) / personsInFirstRow) - 6)
    : 72;
  const personW    = personSize * 0.80;  // 사람 너비 (가로 공간)

  const BADGE_H   = 52;    // 배지 영역
  const ROW_GAP   = 10;    // 줄 간격
  const FINGER_H  = 90;    // 손가락 영역 높이
  const PAD_B     = 20;    // 하단 여백

  let contentH = BADGE_H;
  if (personRows > 0) contentH += personRows * (personSize + ROW_GAP);
  if (hasRemain)      contentH += FINGER_H;
  contentH += PAD_B;

  const H = Math.max(240, contentH);

  /* ── 레이아웃 계산 ────────────────────────────────── */
  let body = '';
  let curY = BADGE_H;

  /* 사람 아이콘들 */
  for (let row = 0; row < personRows; row++) {
    const startIdx = row * personsPerRow;
    const endIdx   = Math.min(complete, startIdx + personsPerRow);
    const count    = endIdx - startIdx;
    const rowW     = count * personW + (count - 1) * 6;
    let   px       = (W - rowW) / 2;

    for (let i = 0; i < count; i++) {
      body += drawPerson(px, curY, personSize);
      px += personW + 6;
    }
    curY += personSize + ROW_GAP;
  }

  /* "+" 구분선 (사람 + 손가락이 함께 있을 때) */
  if (complete > 0 && hasRemain) {
    body += `<text x="${W/2}" y="${curY + 14}" text-anchor="middle"
       font-family="Arial, sans-serif" font-size="22" font-weight="900"
       fill="${C.coralBorder}">+</text>`;
    curY += 28;
  }

  /* 낱개 손가락 */
  if (hasRemain) {
    const dotR = 12;
    body += drawFingerDots(W / 2, curY + FINGER_H * 0.35, remain, dotR);
    curY += FINGER_H;
  }

  /* 숫자 배지 (상단 중앙) */
  body += badge(n, W / 2, 28);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}" rx="20"/>
  ${body}
</svg>`;
}

/* ════════════════════════════════════════════════════════
   실행: 1~100 모두 생성
   ════════════════════════════════════════════════════════ */
let generated = 0;
for (let n = 1; n <= 100; n++) {
  const svg  = generateSVG(n);
  const file = path.join(OUT_DIR, `finger_${n}.svg`);
  fs.writeFileSync(file, svg, 'utf8');
  generated++;

  const complete = Math.floor(n / 10);
  const remain   = n % 10;
  const desc = complete > 0
    ? `🧑×${complete}${remain > 0 ? ` + ✋×${remain}` : ''}`
    : `✋×${remain}`;
  if (n % 10 === 0 || n <= 10) {
    console.log(`  finger_${String(n).padStart(3,' ')}.svg → ${desc}`);
  }
}
console.log(`\n🎉 완료! finger_1.svg ~ finger_100.svg (총 ${generated}개) 생성됨`);
console.log(`📁 ${OUT_DIR}`);
