/**
 * generate_toe_frames.js
 * 11~20: 양손(10손가락) + 발가락(N-10개) SVG 생성
 */

const fs   = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'assets', 'fingers');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const C = {
  bg:         '#FFF5F7',
  coral:      '#FF6B6B',
  coralLight: '#FFE8E8',
  coralBorder:'#FFAAAA',
  sectionBg:  '#FFFFFF',
  shadow:     'rgba(255,107,107,0.12)',
};

const W = 320;
const H = 320;

/* ── 숫자 배지 ──────────────────────────────────────── */
function badge(n, x, y) {
  return `
    <rect x="${x-26}" y="${y-18}" width="52" height="36" rx="12"
          fill="${C.coral}" />
    <text x="${x}" y="${y+8}" text-anchor="middle"
          font-family="Arial Rounded MT Bold, Arial, sans-serif"
          font-size="20" font-weight="900" fill="white">${n}</text>`;
}

/* ── 레이블 텍스트 ──────────────────────────────────── */
function label(text, x, y, color = C.coral) {
  return `<text x="${x}" y="${y}" text-anchor="middle"
    font-family="Arial Rounded MT Bold, Arial, sans-serif"
    font-size="11" font-weight="700" fill="${color}">${text}</text>`;
}

/* ── 이모지 행 (손가락 or 발가락) ──────────────────── */
function emojiRow(emojis, x, y, maxPerRow, size = 28) {
  const spacing = size + 6;
  let out = '';
  emojis.forEach((em, i) => {
    const col = i % maxPerRow;
    const row = Math.floor(i / maxPerRow);
    out += `<text x="${x + col * spacing + size/2}" y="${y + row * (size + 4) + size - 4}"
      font-size="${size}">${em}</text>`;
  });
  return out;
}

/* ── 섹션 박스 ──────────────────────────────────────── */
function sectionBox(x, y, w, h, label2) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14"
          fill="${C.coralLight}" stroke="${C.coralBorder}" stroke-width="2.5"/>
    ${label(label2, x + w/2, y + h + 14)}`;
}

/* ── 11~20 SVG 생성 ─────────────────────────────────── */
function generateSVG(n) {
  const extra = n - 10;  // 발가락 개수

  // ─ 손 섹션 (항상 양손 = 10손가락) ─
  // 🖐️ 이모지 2개 (손 5개 × 2 = 10)
  const handEmojis = ['🖐️', '🖐️'];
  const handSize   = 52;
  const handBoxW   = 126;
  const handBoxH   = 82;
  const handBoxX   = 16;
  const handBoxY   = 90;

  // ─ 발 섹션 (N-10 발가락 표시) ─
  // 발가락은 🦶 이모지로 낱개 표시 (최대 10개)
  const toeEmojis  = Array(extra).fill('🦶');
  const toeSize    = extra <= 5 ? 34 : 28;
  const toeCols    = 5;
  const toeSpacing = toeSize + 5;
  const toeBoxW    = 130;
  const toeBoxH    = extra <= 5 ? 52 : 86;
  const toeBoxX    = W - toeBoxW - 16;
  const toeBoxY    = extra <= 5
    ? (H - toeBoxH) / 2 - 14
    : 76;

  // "+" 기호 위치
  const plusX = (handBoxX + handBoxW + toeBoxX) / 2;
  const plusY = (handBoxY + handBoxH / 2);

  let body = '';

  // 손 박스
  body += sectionBox(handBoxX, handBoxY, handBoxW, handBoxH, '10 dedos de las manos');
  body += emojiRow(handEmojis, handBoxX + 10, handBoxY + 12, 2, handSize);

  // + 기호
  body += `<text x="${plusX}" y="${plusY + 10}" text-anchor="middle"
    font-family="Arial, sans-serif" font-size="28" font-weight="900"
    fill="${C.coral}">+</text>`;

  // 발 박스
  body += sectionBox(toeBoxX, toeBoxY, toeBoxW, toeBoxH,
    `${extra} dedo${extra > 1 ? 's' : ''} del pie`);
  body += emojiRow(toeEmojis, toeBoxX + 8, toeBoxY + 8, toeCols, toeSize);

  // 숫자 배지 (중앙 상단)
  body += badge(n, W / 2, 36);

  // "= N" 표시 (하단)
  body += `<text x="${W/2}" y="${H - 16}" text-anchor="middle"
    font-family="Arial Rounded MT Bold, Arial, sans-serif"
    font-size="13" fill="${C.coral}" font-weight="800">
    = ${n} en total
  </text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.bg}" rx="24"/>
  ${body}
</svg>`;
}

/* ── 실행 ────────────────────────────────────────────── */
for (let n = 11; n <= 20; n++) {
  const svg  = generateSVG(n);
  const file = path.join(OUT_DIR, `finger_${n}.svg`);
  fs.writeFileSync(file, svg, 'utf8');
  const extra = n - 10;
  console.log(`✅ finger_${n}.svg  → 🖐️🖐️(10) + 🦶×${extra}`);
}
console.log('\n🎉 완료!');
