/**
 * speech.js — Latidos Niños English
 * Web Speech API — English + Spanish TTS
 *
 * 브라우저 호환성:
 *   Chrome/Edge  : keepAlive 루프로 15초 pause 버그 방지
 *   iOS Safari   : keepAlive 스킵 (pause/resume이 오히려 끊김 유발)
 *   Android      : Chrome 방식과 동일
 *
 * 자동재생 정책:
 *   사용자가 처음 클릭/터치하기 전엔 speak() 호출하지 않음.
 *   첫 제스처 후 모든 소리 정상 작동 (자동재생 포함).
 */

const Speech = (function () {

  /* ── 환경 감지 ──────────────────────────────────────────────── */
  const isIOS     = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isSafari  = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const useKeepAlive = !(isIOS || isSafari); // iOS/Safari 에선 keepAlive 안 씀

  /* ── 음성 목록 ──────────────────────────────────────────────── */
  const NUMBERS_ES = {
    0:'cero',1:'uno',2:'dos',3:'tres',4:'cuatro',
    5:'cinco',6:'seis',7:'siete',8:'ocho',9:'nueve',
    10:'diez',11:'once',12:'doce',13:'trece',14:'catorce',
    15:'quince',16:'dieciséis',17:'diecisiete',18:'dieciocho',
    19:'diecinueve',20:'veinte',21:'veintiuno',22:'veintidós',
    23:'veintitrés',24:'veinticuatro',25:'veinticinco',
    26:'veintiséis',27:'veintisiete',28:'veintiocho',29:'veintinueve',
    30:'treinta',40:'cuarenta',50:'cincuenta',
    60:'sesenta',70:'setenta',80:'ochenta',90:'noventa',100:'cien',
  };

  function numberToSpanish(n) {
    if (NUMBERS_ES[n] !== undefined) return NUMBERS_ES[n];
    if (n > 20 && n < 30) return 'veinti' + NUMBERS_ES[n - 20];
    if (n >= 31 && n <= 99) {
      const tens = Math.floor(n / 10) * 10;
      const ones = n % 10;
      return ones === 0 ? NUMBERS_ES[tens] : NUMBERS_ES[tens] + ' y ' + NUMBERS_ES[ones];
    }
    return String(n);
  }

  let _voices       = [];
  let _spanishVoice = null;
  let _englishVoice = null;

  function _loadVoices() {
    _voices = window.speechSynthesis.getVoices();
    _spanishVoice =
      _voices.find(v => v.lang === 'es-419') ||
      _voices.find(v => v.lang === 'es-MX')  ||
      _voices.find(v => v.lang.startsWith('es-')) ||
      _voices.find(v => v.lang.startsWith('es'))  || null;
    _englishVoice =
      _voices.find(v => v.lang === 'en-US') ||
      _voices.find(v => v.lang === 'en-GB') ||
      _voices.find(v => v.lang.startsWith('en-')) ||
      _voices.find(v => v.lang.startsWith('en'))  || null;
  }

  if (window.speechSynthesis) {
    _loadVoices();
    window.speechSynthesis.onvoiceschanged = _loadVoices;
  }

  /* ── 사용자 제스처 잠금 ─────────────────────────────────────────
     Chrome/iOS 모두 첫 사용자 상호작용 전엔 speech를 차단함.
     이 플래그가 false면 모든 say*()가 조용히 무시됨.
     첫 클릭/터치 이후 모든 소리 정상 작동.
  ──────────────────────────────────────────────────────────────── */
  let _userGestured = false;

  function _onFirstGesture() {
    if (_userGestured) return;
    _userGestured = true;
    // 음성 엔진 활성화 (빈 utterance)
    if (window.speechSynthesis) {
      const silent = new SpeechSynthesisUtterance('');
      silent.volume = 0;
      window.speechSynthesis.speak(silent);
    }
  }

  document.addEventListener('click',      _onFirstGesture, { capture: true });
  document.addEventListener('touchstart', _onFirstGesture, { capture: true });
  document.addEventListener('keydown',    _onFirstGesture, { capture: true });

  /* ── 공통 speak 헬퍼 ─────────────────────────────────────────── */
  function _speak(utt) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);

    // Chrome/Edge 전용: 15초 이상 발화 시 자동 pause 버그 방지
    // iOS/Safari에선 pause/resume이 오히려 소리를 끊으므로 스킵
    if (useKeepAlive) {
      const keepAlive = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } else {
          clearInterval(keepAlive);
        }
      }, 10000);
      utt.addEventListener('end',   () => clearInterval(keepAlive));
      utt.addEventListener('error', () => clearInterval(keepAlive));
    }

    return utt;
  }

  /* ── Public API ──────────────────────────────────────────────── */
  function isSupported() {
    return 'speechSynthesis' in window;
  }

  /** 스페인어 TTS */
  function say(text, { rate = 0.8, pitch = 1.1 } = {}) {
    if (!isSupported() || !_userGestured) return;
    const utt = new SpeechSynthesisUtterance(isIOS ? text : text + ' . . .');
    utt.lang  = 'es-419';
    utt.rate  = rate;
    utt.pitch = pitch;
    if (_spanishVoice) utt.voice = _spanishVoice;
    return _speak(utt);
  }

  function sayNumber(n, opts = {}) {
    return say(numberToSpanish(n), opts);
  }

  /** 영어 TTS */
  function sayEnglish(text, { rate = 0.85, pitch = 1.0 } = {}) {
    if (!isSupported() || !_userGestured) return;
    // iOS는 패딩 없이 그대로, 그 외는 끝 클리핑 방지 패딩 추가
    const utt = new SpeechSynthesisUtterance(isIOS ? text : text + ' . . . . .');
    utt.lang  = 'en-US';
    utt.rate  = rate;
    utt.pitch = pitch;
    if (_englishVoice) utt.voice = _englishVoice;
    return _speak(utt);
  }

  /** 알파벳 한 글자 → 영어 발음명으로 읽기
   *  H → "aitch", W → "double you" 등 TTS가 정확하게 발음하도록 */
  const LETTER_PHONETICS = {
    A:'ay',    B:'bee',       C:'see',     D:'dee',    E:'ee',
    F:'eff',   G:'jee',       H:'aitch',   I:'eye',    J:'jay',
    K:'kay',   L:'el',        M:'em',      N:'en',     O:'oh',
    P:'pee',   Q:'cue',       R:'ar',      S:'ess',    T:'tee',
    U:'you',   V:'vee',       W:'double you', X:'ex',  Y:'why',
    Z:'zee',
  };

  function sayLetter(letter, opts = {}) {
    const name = LETTER_PHONETICS[letter.toUpperCase()] || letter;
    return sayEnglish(name, { rate: 0.72, pitch: 1.05, ...opts });
  }

  function getWord(n)            { return numberToSpanish(n); }
  function getAvailableVoices()  { return _voices.filter(v => v.lang.startsWith('es')); }

  return { isSupported, say, sayNumber, sayEnglish, sayLetter, getWord, getAvailableVoices, NUMBERS_ES };

})();
