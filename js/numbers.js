/**
 * numbers.js — Latidos Niños
 * Three modes: Count, Compare, Quiz
 */

(function () {
  App.initPage('numbers');

  const OBJECTS = ['🫀','⭐','🍎','🌸','🦋','🍭','🎈','🐠','🐣','🌺'];

  /* ─── Utility ──────────────────────────────────────────── */
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function wrongOptions(correct, count = 3, min = 0, max = 20) {
    const opts = new Set([correct]);
    while (opts.size < count + 1) {
      const o = Math.max(min, Math.min(max, correct + randInt(-5, 5)));
      if (o !== correct) opts.add(o);
    }
    return shuffle([...opts]);
  }

  function makeAnswerGrid(container, options, correctVal, onResult) {
    container.innerHTML = '';
    container.style.display = 'grid';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => {
        if (container.dataset.answered) return;
        container.dataset.answered = '1';
        const isCorrect = opt === correctVal;
        btn.classList.add(isCorrect ? 'correct' : 'wrong');
        if (isCorrect) Sounds.correct(); else Sounds.wrong();
        // Highlight correct if wrong chosen
        if (!isCorrect) {
          [...container.children].forEach(b => {
            if (Number(b.textContent) === correctVal) b.classList.add('correct');
          });
        }
        setTimeout(() => {
          container.dataset.answered = '';
          onResult(isCorrect);
        }, 900);
      });
      container.appendChild(btn);
    });
  }

  /* ─── GAME STATE FACTORY ────────────────────────────────── */
  function makeGameState(onFinish) {
    return { score: 0, lives: 3, q: 0, total: 10, onFinish };
  }

  function endGame(gs, module) {
    const stars = gs.lives === 3 ? 3 : gs.lives === 2 ? 2 : gs.score >= 5 ? 1 : 0;
    const hearts = gs.score * 3;
    App.setStars(module, stars);
    const { leveledUp, newLevel } = App.addHearts(hearts);
    if (gs.score >= 8) App.addBadge('numbers_master');
    App.launchConfetti(50);
    App.showModal({
      emoji: stars === 3 ? '🌟' : stars >= 1 ? '😊' : '💪',
      title: stars === 3 ? '¡Perfecto!' : stars >= 1 ? '¡Bien hecho!' : '¡Sigue intentando!',
      message: `Respondiste ${gs.score} de ${gs.total} correctas`,
      stars, heartsEarned: hearts,
      onNext: gs.onFinish,
    });
    if (leveledUp) {
      Sounds.levelUp();
      App.showToast(`🎉 ¡Subiste al nivel ${newLevel}!`);
    }
  }

  /* ══════════════════════════════════════════════
     MODE 1: CONTAR
  ══════════════════════════════════════════════ */
  const COUNT = {
    gs: null, correct: 0, obj: '',
    init() {
      this.gs = makeGameState(() => this.start());
      this.start();
    },
    start() {
      this.gs = makeGameState(() => this.start());
      this.updateUI();
      this.nextQ();
    },
    updateUI() {
      const g = this.gs;
      document.getElementById('count-score').textContent = g.score;
      document.getElementById('count-lives').textContent = '💖'.repeat(g.lives);
      document.getElementById('count-q').textContent = g.q + 1;
      document.getElementById('count-progress').style.width = (g.q / g.total * 100) + '%';
    },
    nextQ() {
      const g = this.gs;
      if (g.q >= g.total) { endGame(g, 'numbers'); return; }
      this.correct = randInt(1, 12);
      this.obj = OBJECTS[g.q % OBJECTS.length];
      // render objects
      const objs = document.getElementById('count-objects');
      objs.innerHTML = '';
      for (let i = 0; i < this.correct; i++) {
        const s = document.createElement('span');
        s.className = 'count-obj';
        s.textContent = this.obj;
        s.style.animationDelay = (i * 0.05) + 's';
        objs.appendChild(s);
      }
      // answer options
      const opts = wrongOptions(this.correct, 3, 1, 15);
      const grid = document.getElementById('count-answer-grid');
      makeAnswerGrid(grid, opts, this.correct, (ok) => {
        if (ok) { g.score++; Sounds.pop(); }
        else { g.lives = Math.max(0, g.lives - 1); }
        if (g.lives === 0) { endGame(g, 'numbers'); return; }
        g.q++;
        this.updateUI();
        this.nextQ();
      });
    },
  };

  /* ══════════════════════════════════════════════
     MODE 2: COMPARAR
  ══════════════════════════════════════════════ */
  const CMP = {
    gs: null, a: 0, b: 0, askMajor: true,
    init() { this.start(); },
    start() {
      this.gs = makeGameState(() => this.start());
      this.updateUI();
      this.nextQ();
    },
    updateUI() {
      const g = this.gs;
      document.getElementById('cmp-score').textContent = g.score;
      document.getElementById('cmp-lives').textContent = '💖'.repeat(g.lives);
      document.getElementById('cmp-q').textContent = g.q + 1;
      document.getElementById('cmp-progress').style.width = (g.q / g.total * 100) + '%';
    },
    nextQ() {
      const g = this.gs;
      if (g.q >= g.total) { endGame(g, 'numbers'); return; }
      do {
        this.a = randInt(0, 50);
        this.b = randInt(0, 50);
      } while (this.a === this.b);
      this.askMajor = Math.random() > 0.5;

      const dir = document.getElementById('cmp-direction');
      dir.textContent = this.askMajor ? 'mayor' : 'menor';

      const elA = document.getElementById('cmp-a');
      const elB = document.getElementById('cmp-b');
      elA.textContent = this.a;
      elB.textContent = this.b;
      elA.className = 'compare-num';
      elB.className = 'compare-num';

      const correct = this.askMajor
        ? (this.a > this.b ? this.a : this.b)
        : (this.a < this.b ? this.a : this.b);

      const handle = (el, val) => {
        el.onclick = null;
        elA.onclick = null;
        elB.onclick = null;
        const ok = val === correct;
        el.classList.add(ok ? 'correct' : 'wrong');
        if (!ok) {
          const other = (el === elA) ? elB : elA;
          other.classList.add('correct');
        }
        if (ok) { Sounds.correct(); g.score++; } else Sounds.wrong();
        g.lives = ok ? g.lives : Math.max(0, g.lives - 1);
        if (g.lives === 0) { setTimeout(() => endGame(g, 'numbers'), 800); return; }
        g.q++;
        this.updateUI();
        setTimeout(() => this.nextQ(), 900);
      };

      elA.onclick = () => handle(elA, this.a);
      elB.onclick = () => handle(elB, this.b);
    },
  };

  /* ══════════════════════════════════════════════
     MODE 3: QUIZ — ¿Cómo se dice? (스페인어 단어 맞히기)
     숫자를 보여주고 스페인어 단어 4개 중 선택
  ══════════════════════════════════════════════ */
  const QUIZ = {
    gs: null, correct: 0,
    init() { this.start(); },

    start() {
      this.gs = makeGameState(() => this.start());
      this.updateUI();
      this._bindListenBtn();
      this.nextQ();
    },

    updateUI() {
      const g = this.gs;
      document.getElementById('quiz-score').textContent  = g.score;
      document.getElementById('quiz-lives').textContent  = '💖'.repeat(g.lives);
      document.getElementById('quiz-q').textContent      = g.q + 1;
      document.getElementById('quiz-progress').style.width = (g.q / g.total * 100) + '%';
    },

    _bindListenBtn() {
      const btn = document.getElementById('quiz-listen-btn');
      if (btn) btn.onclick = () => {
        if (Speech.isSupported()) Speech.sayNumber(this.correct, { rate: 0.8 });
      };
    },

    nextQ() {
      const g = this.gs;
      if (g.q >= g.total) { endGame(g, 'numbers'); return; }

      // 정답 숫자 (1~100에서 랜덤)
      this.correct = randInt(1, 100);
      const numEl = document.getElementById('quiz-number');
      numEl.textContent = this.correct;
      numEl.animate([
        { transform: 'scale(0.6)', opacity: 0 },
        { transform: 'scale(1.1)', opacity: 1 },
        { transform: 'scale(1)',   opacity: 1 }
      ], { duration: 300, easing: 'ease-out' });

      // 음성으로 읽기 (자동)
      if (Speech.isSupported()) Speech.sayNumber(this.correct, { rate: 0.85 });

      // 오답 3개: 스페인어 단어가 중복되지 않아야 함
      const correctWord = Speech.getWord(this.correct);
      const usedWords   = new Set([correctWord]);
      const wrongNums   = [];
      let   attempts    = 0;
      while (wrongNums.length < 3 && attempts < 300) {
        attempts++;
        const candidate = randInt(1, 100);
        if (candidate === this.correct) continue;
        const w = Speech.getWord(candidate);
        if (usedWords.has(w)) continue;
        usedWords.add(w);
        wrongNums.push(candidate);
      }
      const options = shuffle4([this.correct, ...wrongNums]);


      // 4지선다 버튼 렌더링
      const grid = document.getElementById('quiz-word-grid');
      grid.innerHTML = '';
      options.forEach(n => {
        const btn = document.createElement('button');
        btn.className   = 'quiz-word-btn';
        btn.textContent = Speech.getWord(n);   // 스페인어 단어 표시
        btn.dataset.n   = n;
        btn.onclick = () => this._answer(btn, n);
        grid.appendChild(btn);
      });
    },

    _answer(btn, chosen) {
      // 모든 버튼 비활성화
      document.querySelectorAll('.quiz-word-btn').forEach(b => b.onclick = null);

      const ok = chosen === this.correct;
      btn.classList.add(ok ? 'qw-correct' : 'qw-wrong');

      if (!ok) {
        // 정답 버튼 표시
        document.querySelectorAll('.quiz-word-btn').forEach(b => {
          if (Number(b.dataset.n) === this.correct) b.classList.add('qw-correct');
        });
      }

      // 음성: 정답 단어 읽기
      if (Speech.isSupported()) Speech.sayNumber(this.correct, { rate: 0.85 });

      if (ok) { Sounds.correct?.(); this.gs.score++; }
      else    { Sounds.wrong?.(); this.gs.lives = Math.max(0, this.gs.lives - 1); }

      if (this.gs.lives === 0) {
        setTimeout(() => endGame(this.gs, 'numbers'), 900);
        return;
      }
      this.gs.q++;
      this.updateUI();
      setTimeout(() => this.nextQ(), 1100);
    },
  };

  /* Helper: Fisher-Yates shuffle for 4 items */
  function shuffle4(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }


  /* ══════════════════════════════════════════════
     LEER: 숫자 학습 카드 (숫자 + 손가락 + 음성)
  ══════════════════════════════════════════════ */
  const LEER = {
    numbers: [], idx: 0, mode: '1-10',

    init() {
      this.setMode('1-10');
    },

    setMode(mode) {
      this.mode = mode;
      const [min, max] = mode.split('-').map(Number);
      this.numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      this.idx = 0;
      this._renderGrid();
      this._show();
    },

    _show() {
      const n    = this.numbers[this.idx];
      const word = Speech.getWord(n);

      // 큰 숫자
      const numEl = document.getElementById('leer-number');
      if (!numEl) return;
      numEl.textContent = n;
      numEl.animate([
        { transform: 'scale(0.7)', opacity: 0 },
        { transform: 'scale(1.05)', opacity: 1 },
        { transform: 'scale(1)',    opacity: 1 }
      ], { duration: 280, easing: 'ease-out' });

      // 스페인어 단어
      const wordEl = document.getElementById('leer-word');
      if (wordEl) wordEl.innerHTML = word.split('').map((ch, i) =>
        `<span class="letter${ch === ' ' ? ' space' : ''}" style="animation-delay:${i * 0.05}s">${ch === ' ' ? '&nbsp;' : ch}</span>`
      ).join('');

      // 손가락 이미지 합성
      const visual   = document.getElementById('leer-visual');
      const complete = Math.floor(n / 10);
      const remain   = n % 10;
      const total    = complete + (remain > 0 ? 1 : 0);
      if (visual) {
        visual.className = 'leer-visual-wrap' +
          (total >= 3 ? ` count-${Math.min(total, 10)}` : '');
        let html = '';
        for (let i = 0; i < complete; i++)
          html += `<img src="../assets/fingers/finger_10.png" class="vis-person"
                        alt="10" style="animation-delay:${i*0.06}s">`;
        if (remain > 0)
          html += `<img src="../assets/fingers/finger_${remain}.png" class="vis-finger"
                        alt="${remain}" style="animation-delay:${complete*0.06}s">`;
        visual.innerHTML = html;
      }

      // 카운터
      const ctr = document.getElementById('leer-counter');
      if (ctr) ctr.textContent = `${this.idx + 1} / ${this.numbers.length}`;

      // 그리드 하이라이트
      document.querySelectorAll('.leer-mini-num').forEach(el => {
        const active = Number(el.dataset.n) === n;
        el.style.borderColor = active ? 'var(--coral)' : 'transparent';
        el.style.background  = active ? 'var(--coral-light)' : '#fff';
      });

      // 자동 읽기
      if (Speech.isSupported()) Speech.sayNumber(n, { rate: 0.85, pitch: 1.1 });
    },

    _renderGrid() {
      const grid = document.getElementById('leer-grid');
      if (!grid) return;
      grid.innerHTML = '';
      this.numbers.forEach(n => {
        const cell = document.createElement('div');
        cell.className = 'leer-mini-num';
        cell.dataset.n = n;
        cell.innerHTML = `<div class="mini-n">${n}</div><div class="mini-w">${Speech.getWord(n)}</div>`;
        cell.addEventListener('click', () => {
          this.idx = this.numbers.indexOf(n);
          this._show();
        });
        grid.appendChild(cell);
      });
    },

    _bindEvents() {
      const speak = () => {
        if (Speech.isSupported()) Speech.sayNumber(this.numbers[this.idx], { rate: 0.85 });
      };
      const prev = () => {
        this.idx = (this.idx - 1 + this.numbers.length) % this.numbers.length;
        this._show();
      };
      const next = () => {
        this.idx = (this.idx + 1) % this.numbers.length;
        this._show();
      };

      // onclick 직접 할당 = 중복 등록 불가, 항상 1개만 유지
      const numEl  = document.getElementById('leer-number');
      const speakEl= document.getElementById('leer-speak-btn');
      const prevEl = document.getElementById('leer-prev');
      const nextEl = document.getElementById('leer-next');

      if (numEl)   numEl.onclick   = speak;
      if (speakEl) speakEl.onclick = speak;
      if (prevEl)  prevEl.onclick  = prev;
      if (nextEl)  nextEl.onclick  = next;
    },
  };

  /* ══════════════════════════════════════════════
     MODE 4: MATCH (숫자↔스페인어 메모리 게임)
  ══════════════════════════════════════════════ */
  const MATCH = {
    mode:    '1-10',
    pairs:   0,       // 맞춘 쌍 수
    moves:   0,       // 시도 횟수
    flipped: [],      // 현재 뒤집힌 카드 el 배열 (최대 2)
    locked:  false,   // 확인 중 잠금

    /* 모드 범위의 숫자 배열 */
    _nums() {
      const [min, max] = this.mode.split('-').map(Number);
      return Array.from({ length: max - min + 1 }, (_, i) => min + i);
    },

    init() {
      this.setMode('1-10');
      this._bindEvents();
    },

    setMode(mode) {
      this.mode = mode;
      document.querySelectorAll('.leer-mode-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.lmode === mode));
      this._startGame();
    },

    _startGame() {
      this.pairs   = 0;
      this.moves   = 0;
      this.flipped = [];
      this.locked  = false;

      // 완성 배너 숨김
      const done = document.getElementById('match-complete');
      if (done) done.style.display = 'none';

      this._updateStats();
      this._buildGrid();
    },

    _updateStats() {
      const nums = this._nums();
      document.getElementById('match-moves-display').textContent =
        `🃏 ${this.moves} intentos`;
      document.getElementById('match-pairs-display').textContent =
        `⭐ ${this.pairs} / ${nums.length} pares`;
    },

    _buildGrid() {
      const nums = this._nums();
      // 카드 데이터: 숫자 카드 + 단어 카드 각 10장
      const cards = [];
      nums.forEach(n => {
        cards.push({ pair: n, type: 'number', display: String(n) });
        cards.push({ pair: n, type: 'word',   display: Speech.getWord(n) });
      });

      // Fisher-Yates 셔플
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }

      // 그리드 렌더링
      const grid = document.getElementById('match-grid');
      grid.innerHTML = '';
      cards.forEach((c, idx) => {
        const el = document.createElement('div');
        el.className = 'mc';
        el.dataset.pair = c.pair;
        el.dataset.type = c.type;
        el.innerHTML = `
          <div class="mc-inner">
            <div class="mc-front">?</div>
            <div class="mc-back type-${c.type}">${c.display}</div>
          </div>`;
        el.style.animationDelay = (idx * 0.03) + 's';
        el.addEventListener('click', () => this._onCardClick(el));
        grid.appendChild(el);
      });
    },

    _onCardClick(el) {
      // 잠금 중 / 이미 매치됨 / 이미 뒤집힌 카드 클릭 무시
      if (this.locked) return;
      if (el.classList.contains('matched')) return;
      if (this.flipped.includes(el)) return;

      // 카드 뒤집기
      el.classList.add('flipped');
      this.flipped.push(el);
      Sounds?.click?.();

      // 🔊 카드 뒤집을 때 숫자 음성 재생
      if (Speech.isSupported()) {
        Speech.sayNumber(Number(el.dataset.pair), { rate: 0.9, pitch: 1.1 });
      }

      if (this.flipped.length === 2) {
        this.moves++;
        this._updateStats();
        this._checkMatch();
      }
    },

    _checkMatch() {
      const [c1, c2] = this.flipped;
      const samePair   = c1.dataset.pair === c2.dataset.pair;
      const diffType   = c1.dataset.type !== c2.dataset.type;

      if (samePair && diffType) {
        // ✅ 매치 성공
        c1.classList.add('matched');
        c2.classList.add('matched');
        this.pairs++;
        this._updateStats();
        this.flipped = [];

        // 음성 읽기
        if (Speech.isSupported()) {
          Speech.sayNumber(Number(c1.dataset.pair), { rate: 0.9 });
        }

        // 게임 완료 체크
        if (this.pairs === this._nums().length) {
          setTimeout(() => this._showComplete(), 500);
        }
      } else {
        // ❌ 불일치 - 흔들기 후 뒤집어 돌아감
        this.locked = true;
        c1.classList.add('wrong');
        c2.classList.add('wrong');
        setTimeout(() => {
          c1.classList.remove('flipped', 'wrong');
          c2.classList.remove('flipped', 'wrong');
          this.flipped = [];
          this.locked  = false;
        }, 900);
      }
    },

    _showComplete() {
      const el = document.getElementById('match-complete');
      document.getElementById('match-complete-moves').textContent = this.moves;
      el.style.display = 'block';
    },

    _bindEvents() {
      // 범위 버튼 → LEER 카드 + MATCH 게임 동시 업데이트
      document.querySelectorAll('.leer-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          Sounds?.click?.();
          const m = btn.dataset.lmode;
          LEER.setMode(m);
          this.setMode(m);
        });
      });

      // LEER 버튼 이벤트
      LEER._bindEvents();

      // 다시 시작
      document.getElementById('match-restart-btn')?.addEventListener('click', () => {
        Sounds?.click?.();
        this._startGame();
      });

      // 다음 범위
      document.getElementById('match-next-range-btn')?.addEventListener('click', () => {
        const btns   = [...document.querySelectorAll('.leer-mode-btn')];
        const curIdx = btns.findIndex(b => b.dataset.lmode === this.mode);
        const next   = btns[(curIdx + 1) % btns.length];
        Sounds?.click?.();
        LEER.setMode(next.dataset.lmode);
        this.setMode(next.dataset.lmode);
        next.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    },
  };

  /* combined leer tab entry */
  const LEER_TAB = {
    _ready: false,
    init() {
      LEER.init();
      MATCH.init();
      if (!this._ready) {
        MATCH._bindEvents();
        this._ready = true;
      }
    },
  };

  /* ─── TAB SWITCHING ─────────────────────────────────────── */
  const TABS = { count: COUNT, compare: CMP, leer: LEER_TAB, quiz: QUIZ };
  let activeTab = 'leer';

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      Sounds.click();
      const tab = btn.dataset.tab;
      if (tab === activeTab) return;
      activeTab = tab;

      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
      document.querySelector('[data-tab-panel="' + tab + '"]').style.display = '';

      TABS[tab].init();
    });
  });

  // Start first tab
  LEER_TAB.init();
})();
