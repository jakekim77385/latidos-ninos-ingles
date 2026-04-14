/**
 * speech.js — Latidos Niños
 * Web Speech API 기반 스페인어 TTS (Text-to-Speech)
 *
 * 사용법:
 *   Speech.say("uno");           // 단어 읽기
 *   Speech.sayNumber(5);         // 숫자 → 스페인어로 읽기
 *   Speech.isSupported()         // 지원 여부 확인
 */

const Speech = (function () {

  const NUMBERS_ES = {
    0: 'cero', 1: 'uno', 2: 'dos', 3: 'tres', 4: 'cuatro',
    5: 'cinco', 6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve',
    10: 'diez', 11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce',
    15: 'quince', 16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho',
    19: 'diecinueve', 20: 'veinte', 21: 'veintiuno', 22: 'veintidós',
    23: 'veintitrés', 24: 'veinticuatro', 25: 'veinticinco',
    26: 'veintiséis', 27: 'veintisiete', 28: 'veintiocho', 29: 'veintinueve',
    30: 'treinta', 40: 'cuarenta', 50: 'cincuenta',
    60: 'sesenta', 70: 'setenta', 80: 'ochenta', 90: 'noventa',
    100: 'cien',
  };

  function numberToSpanish(n) {
    if (NUMBERS_ES[n] !== undefined) return NUMBERS_ES[n];
    if (n > 20 && n < 30) return 'veinti' + NUMBERS_ES[n - 20];
    if (n >= 31 && n <= 99) {
      const tens = Math.floor(n / 10) * 10;
      const ones = n % 10;
      return ones === 0
        ? NUMBERS_ES[tens]
        : NUMBERS_ES[tens] + ' y ' + NUMBERS_ES[ones];
    }
    return String(n);
  }

  let _voices = [];
  let _spanishVoice = null;
  let _englishVoice = null;

  function _loadVoices() {
    _voices = window.speechSynthesis.getVoices();
    // 스페인어 음성 우선순위: es-419(중남미) > es-MX > es-ES > es
    _spanishVoice =
      _voices.find(v => v.lang === 'es-419') ||
      _voices.find(v => v.lang === 'es-MX') ||
      _voices.find(v => v.lang.startsWith('es-')) ||
      _voices.find(v => v.lang.startsWith('es')) ||
      null;
    // 영어 음성 우선순위: en-US > en-GB > en
    _englishVoice =
      _voices.find(v => v.lang === 'en-US') ||
      _voices.find(v => v.lang === 'en-GB') ||
      _voices.find(v => v.lang.startsWith('en-')) ||
      _voices.find(v => v.lang.startsWith('en')) ||
      null;
  }

  if (window.speechSynthesis) {
    _loadVoices();
    window.speechSynthesis.onvoiceschanged = _loadVoices;
  }

  // ── Chrome 자동재생 잠금 해제 ────────────────────────────────
  // Chrome/Edge 는 첫 사용자 제스처 없이 speak() 호출을 차단함.
  // 첫 클릭/터치 시 빈 utterance 로 잠금 해제 → 이후 자동재생 모두 정상.
  let _unlocked = false;
  function _unlock() {
    if (_unlocked || !window.speechSynthesis) return;
    _unlocked = true;
    const silent = new SpeechSynthesisUtterance('');
    silent.volume = 0;
    window.speechSynthesis.speak(silent);
  }
  document.addEventListener('click',      _unlock, { once: true, capture: true });
  document.addEventListener('touchstart', _unlock, { once: true, capture: true });
  document.addEventListener('keydown',    _unlock, { once: true, capture: true });
  // ─────────────────────────────────────────────────────────────

  function isSupported() {
    return 'speechSynthesis' in window;
  }

  function say(text, { rate = 0.8, pitch = 1.1 } = {}) {
    if (!isSupported()) return;
    window.speechSynthesis.cancel();
    // 끝 클리핑 방지: 뒤에 긴 침묵 패딩 추가
    const utt = new SpeechSynthesisUtterance(text + ' . . .');
    utt.lang  = 'es-419';
    utt.rate  = rate;
    utt.pitch = pitch;
    if (_spanishVoice) utt.voice = _spanishVoice;
    window.speechSynthesis.speak(utt);
    // Chrome: 15초 이상 silence 시 자동 pause 버그 방지
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else {
        clearInterval(keepAlive);
      }
    }, 10000);
    utt.onend = () => clearInterval(keepAlive);
    return utt;
  }

  function sayNumber(n, opts = {}) {
    const word = numberToSpanish(n);
    return say(word, opts);
  }

  // ── 영어 TTS ──────────────────────────────────────────────
  function sayEnglish(text, { rate = 0.85, pitch = 1.0 } = {}) {
    if (!isSupported()) return;
    window.speechSynthesis.cancel();
    // 끝 클리핑 방지: 뒤에 긴 침묵 패딩 추가 (스페인어 say()와 동일하게)
    const utt = new SpeechSynthesisUtterance(text + ' . . . . .');
    utt.lang  = 'en-US';
    utt.rate  = rate;
    utt.pitch = pitch;
    if (_englishVoice) utt.voice = _englishVoice;
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else {
        clearInterval(keepAlive);
      }
    }, 10000);
    utt.addEventListener('end', () => clearInterval(keepAlive));
    window.speechSynthesis.speak(utt);
    return utt;
  }

  // 알파벳 한 글자를 영어로 읽어주는 함수
  function sayLetter(letter, opts = {}) {
    return sayEnglish(letter, { rate: 0.7, pitch: 1.1, ...opts });
  }

  function getWord(n) {
    return numberToSpanish(n);
  }

  function getAvailableVoices() {
    return _voices.filter(v => v.lang.startsWith('es'));
  }

  return { isSupported, say, sayNumber, sayEnglish, sayLetter, getWord, getAvailableVoices, NUMBERS_ES };
})();
