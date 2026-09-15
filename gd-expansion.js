/* ============================================================================
   GEOMETRY RUSH — EXPANSION PACK
   Tambahkan file ini SETELAH script.js di index.html.
   Tidak mengganti kode lama; semua fitur dipasang sebagai extension/patch.
   ============================================================================ */

'use strict';

(() => {
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function G(n) {
    return 'G'.repeat(n);
  }

  const LEVELS = [
    {
      key: 'easy',
      name: 'Stereo Start',
      difficulty: 'EASY',
      color: '#39ff88',
      speed: 4.4,
      icon: '■',
      mode: 'cube',
      unlock: null,
      pattern:
        G(12) + 'X' + G(16) + 'X' + G(18) + 'X' +
        G(15) + 'X' + G(18) + 'X' + G(16) + 'X' + G(20),
      music: [130.81, 164.81, 196, 164.81, 220, 196, 164.81, 130.81]
    },

    {
      key: 'normal',
      name: 'Neon Steps',
      difficulty: 'NORMAL',
      color: '#fff44d',
      speed: 6.2,
      icon: '■',
      mode: 'cube',
      unlock: 'easy',
      pattern:
        G(9) + 'XX' + G(10) + 'X' + G(7) +
        '.BB.' + G(9) + 'XX' + G(9) + 'X' + G(7) +
        '.BBB.' + G(10) + 'XX' + G(8) + 'X' + G(12),
      music: [146.83, 174.61, 220, 174.61, 246.94, 220, 174.61, 146.83]
    },

    {
      key: 'hard',
      name: 'Sky Machine',
      difficulty: 'HARD',
      color: '#ffad5c',
      speed: 6.7,
      icon: '➤',
      mode: 'cube',
      unlock: 'normal',
      pattern:
        G(10) + 'X' + G(7) + 'XX' + G(10) +
        '.BBBB.' + G(8) + 'X' + G(6) + 'XX' + G(8) +
        '.BB.' + G(10) + 'X' + G(8) + 'XX' + G(12),

      transitions: [
        { at: 0.34, mode: 'ship' },
        { at: 0.68, mode: 'cube' }
      ],

      music: [110, 146.83, 164.81, 220, 164.81, 146.83, 110, 82.41]
    },

    {
      key: 'harder',
      name: 'Gravity Pop',
      difficulty: 'HARDER',
      color: '#ff735c',
      speed: 7.1,
      icon: '●',
      mode: 'cube',
      unlock: 'hard',

      pattern:
        G(8) + 'X' + G(8) + 'XX' + G(8) +
        '.BBB.' + G(7) + 'X' + G(7) + 'XX' + G(8) +
        '.BB.' + G(7) + 'X' + G(7) + 'XX' + G(10),

      transitions: [
        { at: 0.28, mode: 'ufo' },
        { at: 0.56, mode: 'robot' },
        { at: 0.82, mode: 'cube' }
      ],

      music: [196, 246.94, 293.66, 246.94, 329.63, 293.66, 246.94, 196]
    },

    {
      key: 'insane',
      name: 'Pulse Factory',
      difficulty: 'INSANE',
      color: '#ff4d8d',
      speed: 7.7,
      icon: '◆',
      mode: 'robot',
      unlock: 'harder',

      pattern:
        G(7) + 'XX' + G(7) + 'X' + G(6) +
        '.BBB.' + G(7) + 'XX' + G(6) + 'X' + G(6) +
        '.BB.' + G(6) + 'XX' + G(7) + 'X' + G(7) +
        '.BBB.' + G(8),

      transitions: [
        { at: 0.25, mode: 'robot' },
        { at: 0.50, mode: 'ship' },
        { at: 0.75, mode: 'ufo' }
      ],

      music: [164.81, 207.65, 246.94, 311.13, 246.94, 207.65, 164.81, 123.47]
    },

    {
      key: 'demon',
      name: 'Final Overdrive',
      difficulty: 'DEMON',
      color: '#c77dff',
      speed: 8.4,
      icon: '☠',
      mode: 'cube',
      unlock: 'insane',

      pattern:
        G(6) + 'XX' + G(6) + 'X' + G(5) +
        '.BB.' + G(6) + 'XX' + G(5) + 'X' + G(5) +
        '.BBB.' + G(6) + 'XX' + G(5) + 'X' + G(5) +
        '.BB.' + G(6) + 'XX' + G(7),

      transitions: [
        { at: 0.18, mode: 'ship' },
        { at: 0.38, mode: 'cube' },
        { at: 0.58, mode: 'ufo' },
        { at: 0.78, mode: 'robot' }
      ],

      music: [98, 123.47, 146.83, 196, 146.83, 123.47, 98, 73.42]
    }
  ];

  const MODE = {
    cube: {
      label: 'CUBE',
      icon: '■'
    },

    ship: {
      label: 'SHIP',
      icon: '➤'
    },

    ufo: {
      label: 'UFO',
      icon: '●'
    },

    robot: {
      label: 'ROBOT',
      icon: '◆'
    }
  };

  const I18N = {
    id: {
      subtitle: 'Runner ritme neon bergaya Geometry Dash',
      play: 'MAIN',
      locked: 'TERKUNCI',
      best: 'Rekor',
      attempts: 'Percobaan',
      total: 'Total Percobaan',
      sound: 'SUARA',
      language: 'BAHASA',
      controls: 'SPACE / KLIK / TAP',
      pause: 'JEDA',
      resume: 'LANJUTKAN',
      retry: 'ULANGI',
      home: 'MENU UTAMA',
      next: 'LEVEL BERIKUTNYA',
      complete: 'LEVEL SELESAI!',
      gameover: 'GAME OVER',
      progress: 'Progress',
      attempt: 'Percobaan',
      record: 'Rekor Terbaik',
      unlock: 'LEVEL BERIKUTNYA TERBUKA!',
      mode: 'MODE',

      hint:
        'CUBE: tap untuk lompat • SHIP: tahan untuk naik • ' +
        'UFO: tap untuk flap • ROBOT: tap untuk lompat'
    },

    en: {
      subtitle: 'Neon rhythm runner inspired by Geometry Dash',
      play: 'PLAY',
      locked: 'LOCKED',
      best: 'Best',
      attempts: 'Attempts',
      total: 'Total Attempts',
      sound: 'SOUND',
      language: 'LANGUAGE',
      controls: 'SPACE / CLICK / TAP',
      pause: 'PAUSE',
      resume: 'RESUME',
      retry: 'RETRY',
      home: 'MAIN MENU',
      next: 'NEXT LEVEL',
      complete: 'LEVEL COMPLETE!',
      gameover: 'GAME OVER',
      progress: 'Progress',
      attempt: 'Attempt',
      record: 'Best Record',
      unlock: 'NEXT LEVEL UNLOCKED!',
      mode: 'MODE',

      hint:
        'CUBE: tap to jump • SHIP: hold to rise • ' +
        'UFO: tap to flap • ROBOT: tap to jump'
    }
  };

  function levelByKey(key) {
    return LEVELS.find(level => level.key === key) || LEVELS[0];
  }

  function levelIndex(key) {
    return Math.max(
      0,
      LEVELS.findIndex(level => level.key === key)
    );
  }

  /* ==========================================================================
     STORAGE EXTENSION
     ========================================================================== */

  function ensureSave(storage) {
    storage.data.bestProgress ||= {};
    storage.data.attempts ||= {};
    storage.data.unlocked ||= {};

    LEVELS.forEach((level, index) => {
      if (!(level.key in storage.data.bestProgress)) {
        storage.data.bestProgress[level.key] = 0;
      }

      if (!(level.key in storage.data.attempts)) {
        storage.data.attempts[level.key] = 0;
      }

      if (!(level.key in storage.data.unlocked)) {
        storage.data.unlocked[level.key] = index === 0;
      }
    });

    storage.data.unlocked.easy = true;

    if (storage.data.unlocked.normal === undefined) {
      storage.data.unlocked.normal = false;
    }

    storage._save();
  }

  /* ==========================================================================
     UI / UX
     ========================================================================== */

  function buildExpansionUI() {
    const menu = document.querySelector(
      '#menu-screen .menu-box'
    );

    if (!menu || $('gd-expansion-ui')) return;

    /*
      ID tambahan agar teks lama bisa diterjemahkan.
    */

    const pauseTitle =
      document.querySelector('#pause-overlay h2');

    if (pauseTitle) {
      pauseTitle.id = 'pause-title';
    }

    const goTitle =
      document.querySelector('#gameover-screen .go-title');

    if (goTitle) {
      goTitle.id = 'go-title';
    }

    const goDesc =
      document.querySelector('#gameover-screen .result-desc');

    if (goDesc) {
      goDesc.id = 'go-desc';
    }

    const winTitle =
      document.querySelector('#victory-screen .win-title');

    if (winTitle) {
      winTitle.id = 'win-title';
    }

    /*
      Sembunyikan selector lama tanpa menghapusnya.
    */

    const oldLevel =
      document.querySelector(
        '#menu-screen > .menu-box > .level-select'
      );

    if (oldLevel) {
      oldLevel.hidden = true;
    }

    const wrap = document.createElement('div');

    wrap.id = 'gd-expansion-ui';

    wrap.innerHTML = `
      <div class="gd-top-controls">

        <button
          id="gd-lang"
          class="gd-control"
          type="button">
          🌐 ID / EN
        </button>

        <button
          id="gd-sound"
          class="gd-control"
          type="button">
          🔊 <span>SUARA ON</span>
        </button>

      </div>

      <div class="gd-level-heading">

        <span id="gd-level-caption">
          LEVEL SELECT
        </span>

        <span id="gd-level-counter">
          1 / 6
        </span>

      </div>

      <div class="gd-level-browser">

        <button
          id="gd-prev"
          class="gd-arrow"
          type="button"
          aria-label="Previous level">
          ‹
        </button>

        <div class="gd-level-window">
          <div id="gd-level-track"></div>
        </div>

        <button
          id="gd-next"
          class="gd-arrow"
          type="button"
          aria-label="Next level">
          ›
        </button>

      </div>

      <div
        id="gd-dots"
        class="gd-dots"
        aria-label="Level navigation">
      </div>

      <p
        id="gd-hint"
        class="gd-hint">
      </p>
    `;

    menu.insertBefore(
      wrap,
      document.querySelector(
        '#menu-screen .global-stats'
      )
    );

    const track = $('gd-level-track');

    LEVELS.forEach((level, index) => {
      const card = document.createElement('button');

      card.type = 'button';
      card.className = 'gd-level-card';
      card.dataset.index = index;

      card.innerHTML = `
        <span class="gd-card-icon">
          ${level.icon}
        </span>

        <span class="gd-card-main">

          <strong>
            LEVEL ${index + 1}
          </strong>

          <b>
            ${level.name}
          </b>

          <small>
            ${level.difficulty} • ${level.speed.toFixed(1)}×
          </small>

          <em id="gd-stats-${level.key}">
            0% • 0 attempts
          </em>

        </span>

        <span class="gd-card-mode">
          ${MODE[level.mode].icon}
          ${MODE[level.mode].label}
        </span>

        <span
          class="gd-lock"
          id="gd-lock-${level.key}">
          🔒
        </span>
      `;

      card.addEventListener('click', () => {
        const game = window.gameInstance;

        if (!game) return;

        ensureSave(game.storage);

        if (!game.storage.isUnlocked(level.key)) {
          return;
        }

        game.startLevel(level.key);
      });

      track.appendChild(card);

      const dot = document.createElement('button');

      dot.type = 'button';
      dot.className = 'gd-dot';
      dot.dataset.index = index;

      dot.setAttribute(
        'aria-label',
        `Level ${index + 1}`
      );

      dot.addEventListener(
        'click',
        () => goTo(index)
      );

      $('gd-dots').appendChild(dot);
    });

    /*
      Tombol retry tambahan pada pause.
    */

    const pauseBox =
      document.querySelector(
        '#pause-overlay .overlay-box'
      );

    if (pauseBox && !$('gd-pause-retry')) {
      const button =
        document.createElement('button');

      button.id = 'gd-pause-retry';
      button.className = 'btn btn-outline';
      button.textContent = '↻ ULANGI';

      button.addEventListener(
        'click',
        () => {
          window.gameInstance?.startLevel(
            window.gameInstance.currentLevelKey
          );
        }
      );

      const menuButton =
        $('btn-pause-menu');

      if (menuButton) {
        pauseBox.insertBefore(
          button,
          menuButton
        );
      } else {
        pauseBox.appendChild(button);
      }
    }

    let current = 0;

    function goTo(index) {
      current =
        (index + LEVELS.length) %
        LEVELS.length;

      track.style.transform =
        `translateX(-${current * 100}%)`;

      $('gd-level-counter').textContent =
        `${current + 1} / ${LEVELS.length}`;

      document
        .querySelectorAll('.gd-dot')
        .forEach((dot, i) => {
          dot.classList.toggle(
            'active',
            i === current
          );
        });

      document
        .querySelectorAll('.gd-level-card')
        .forEach((card, i) => {
          card.classList.toggle(
            'selected',
            i === current
          );
        });
    }

    $('gd-prev').addEventListener(
      'click',
      () => goTo(current - 1)
    );

    $('gd-next').addEventListener(
      'click',
      () => goTo(current + 1)
    );

    document.addEventListener(
      'keydown',
      event => {
        if (event.key === 'ArrowLeft') {
          goTo(current - 1);
        }

        if (event.key === 'ArrowRight') {
          goTo(current + 1);
        }
      }
    );

    let startX = 0;

    track.addEventListener(
      'touchstart',
      event => {
        startX = event.touches[0].clientX;
      },
      { passive: true }
    );

    track.addEventListener(
      'touchend',
      event => {
        const endX =
          event.changedTouches[0].clientX;

        const distance =
          endX - startX;

        if (Math.abs(distance) > 45) {
          goTo(
            current +
            (distance < 0 ? 1 : -1)
          );
        }
      },
      { passive: true }
    );

    $('gd-lang').addEventListener(
      'click',
      () => {
        window.gdLang =
          window.gdLang === 'en'
            ? 'id'
            : 'en';

        localStorage.setItem(
          'geometry_rush_lang',
          window.gdLang
        );

        applyLanguage();
      }
    );

    $('gd-sound').addEventListener(
      'click',
      () => {
        const game =
          window.gameInstance;

        if (!game) return;

        const muted =
          game.audio.toggleMute();

        $('gd-sound').innerHTML =
          muted
            ? '🔇 <span>SOUND OFF</span>'
            : '🔊 <span>SOUND ON</span>';
      }
    );

    goTo(0);
  }

  function applyLanguage() {
    const language =
      window.gdLang || 'id';

    const t =
      I18N[language];

    const subtitle =
      document.querySelector('.subtitle');

    if (subtitle) {
      subtitle.textContent =
        t.subtitle;
    }

    const hint =
      $('gd-hint');

    if (hint) {
      hint.textContent =
        t.hint;
    }

    const lang =
      $('gd-lang');

    if (lang) {
      lang.textContent =
        `🌐 ${t.language}: ${language.toUpperCase()}`;
    }

    const total =
      document.querySelector(
        '#menu-screen .global-stats span:first-child'
      );

    if (total) {
      total.childNodes[0].textContent =
        `${t.total}: `;
    }

    if ($('pause-title')) {
      $('pause-title').textContent =
        t.pause;
    }

    if ($('btn-resume')) {
      $('btn-resume').textContent =
        `▶ ${t.resume}`;
    }

    if ($('btn-retry')) {
      $('btn-retry').textContent =
        `↻ ${t.retry}`;
    }

    if ($('btn-gohome')) {
      $('btn-gohome').textContent =
        `⌂ ${t.home}`;
    }

    if ($('btn-victory-home')) {
      $('btn-victory-home').textContent =
        `⌂ ${t.home}`;
    }

    if ($('btn-next')) {
      $('btn-next').textContent =
        `→ ${t.next}`;
    }

    if ($('go-title')) {
      $('go-title').textContent =
        t.gameover;
    }

    if ($('win-title')) {
      $('win-title').textContent =
        t.complete;
    }

    if ($('go-desc')) {
      $('go-desc').textContent =
        language === 'en'
          ? 'You crashed!'
          : 'Kamu menabrak rintangan!';
    }

    if ($('win-desc')) {
      $('win-desc').textContent =
        language === 'en'
          ? 'You reached the finish line!'
          : 'Kamu mencapai garis finish!';
    }
  }

  /* ==========================================================================
     PLAYER MODES
     ========================================================================== */

  const originalJump =
    Player.prototype.jump;

  const originalUpdate =
    Player.prototype.update;

  const originalDraw =
    Player.prototype.draw;

  Player.prototype.jump =
    function(audio, particles) {

      const mode =
        this.mode || 'cube';

      /*
        SHIP
        Tahan tombol untuk naik.
      */

      if (mode === 'ship') {
        this.shipInput = true;
        audio.playJump();
        return;
      }

      /*
        UFO
        Setiap klik memberi flap.
      */

      if (mode === 'ufo') {

        if (!this.alive) return;

        this.vy = -10.2;
        this.onGround = false;

        audio.playJump();

        this.targetRotation +=
          Math.PI / 4;

        particles.spawnJumpBurst(
          CONFIG.PLAYER_X +
            this.size / 2,

          this.y +
            this.size,

          '#fff44d'
        );

        return;
      }

      /*
        ROBOT
        Lompatan lebih tinggi.
      */

      if (mode === 'robot') {

        if (
          this.onGround &&
          this.alive
        ) {
          this.vy = -15.2;

          this.onGround = false;

          this.targetRotation +=
            Math.PI / 2;

          audio.playJump();

          particles.spawnJumpBurst(
            CONFIG.PLAYER_X +
              this.size / 2,

            this.y +
              this.size,

            '#c77dff'
          );
        }

        return;
      }

      originalJump.call(
        this,
        audio,
        particles
      );
    };

  Player.prototype.update =
    function(particles) {

      const mode =
        this.mode || 'cube';

      /*
        SHIP PHYSICS
      */

      if (mode === 'ship') {

        if (!this.alive) return;

        const held =
          !!this.shipInput;

        this.vy +=
          held
            ? -0.52
            : 0.44;

        this.vy =
          clamp(
            this.vy,
            -8.5,
            8.5
          );

        this.y += this.vy;

        this.rotation +=
          (
            this.vy * 0.055 -
            this.rotation
          ) * 0.16;

        this.trailTimer++;

        if (
          this.trailTimer % 3 === 0
        ) {
          particles.spawnTrail(
            CONFIG.PLAYER_X,
            this.y +
              this.size / 2,
            'rgba(255,173,92,.6)'
          );
        }

        return;
      }

      /*
        UFO PHYSICS
      */

      if (mode === 'ufo') {

        if (!this.alive) return;

        this.vy += 0.65;
        this.y += this.vy;

        this.rotation +=
          (
            Math.sin(
              this.worldX * 0.08
            ) * 0.12 -
            this.rotation
          ) * 0.2;

        this.trailTimer++;

        if (
          this.trailTimer % 4 === 0
        ) {
          particles.spawnTrail(
            CONFIG.PLAYER_X,
            this.y +
              this.size / 2,
            'rgba(255,244,77,.55)'
          );
        }

        return;
      }

      /*
        ROBOT PHYSICS
      */

      if (mode === 'robot') {

        if (!this.alive) return;

        this.vy +=
          CONFIG.GRAVITY;

        this.y +=
          this.vy;

        const diff =
          this.targetRotation -
          this.rotation;

        this.rotation +=
          diff * 0.25;

        this.trailTimer++;

        if (
          this.trailTimer % 3 === 0
        ) {
          particles.spawnTrail(
            CONFIG.PLAYER_X,
            this.y +
              this.size / 2,
            'rgba(199,125,255,.55)'
          );
        }

        return;
      }

      originalUpdate.call(
        this,
        particles
      );
    };

  Player.prototype.draw =
    function(ctx) {

      const mode =
        this.mode || 'cube';

      if (
        mode === 'cube' ||
        mode === 'robot'
      ) {
        return drawPlayerBody(
          this,
          ctx,
          mode
        );
      }

      if (mode === 'ship') {
        return drawShip(
          this,
          ctx
        );
      }

      if (mode === 'ufo') {
        return drawUfo(
          this,
          ctx
        );
      }

      originalDraw.call(
        this,
        ctx
      );
    };

  function drawPlayerBody(
    player,
    ctx,
    mode
  ) {
    const r =
      player.getScreenRect();

    const cx =
      r.x + r.w / 2;

    const cy =
      r.y + r.h / 2;

    ctx.save();

    ctx.translate(cx, cy);
    ctx.rotate(player.rotation);

    const grad =
      ctx.createLinearGradient(
        -r.w / 2,
        -r.h / 2,
        r.w / 2,
        r.h / 2
      );

    grad.addColorStop(
      0,
      mode === 'robot'
        ? '#c77dff'
        : '#00f0ff'
    );

    grad.addColorStop(
      1,
      '#ff2ee6'
    );

    ctx.fillStyle = grad;

    ctx.shadowColor =
      mode === 'robot'
        ? '#c77dff'
        : '#00f0ff';

    ctx.shadowBlur = 18;

    ctx.fillRect(
      -r.w / 2,
      -r.h / 2,
      r.w,
      r.h
    );

    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;

    ctx.strokeRect(
      -r.w / 2,
      -r.h / 2,
      r.w,
      r.h
    );

    ctx.fillStyle =
      'rgba(255,255,255,.9)';

    ctx.fillRect(
      -10,
      -7,
      5,
      5
    );

    ctx.fillRect(
      6,
      -7,
      5,
      5
    );

    ctx.fillRect(
      -8,
      8,
      16,
      3
    );

    if (mode === 'robot') {

      ctx.fillRect(
        -18,
        11,
        5,
        8
      );

      ctx.fillRect(
        13,
        11,
        5,
        8
      );
    }

    ctx.restore();
  }

  function drawShip(
    player,
    ctx
  ) {
    const r =
      player.getScreenRect();

    const cx =
      r.x + r.w / 2;

    const cy =
      r.y + r.h / 2;

    ctx.save();

    ctx.translate(cx, cy);
    ctx.rotate(player.rotation);

    ctx.shadowColor =
      '#ffad5c';

    ctx.shadowBlur = 18;
    ctx.fillStyle =
      '#ffad5c';

    ctx.beginPath();

    ctx.moveTo(18, 0);
    ctx.lineTo(-14, -13);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-14, 13);

    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;

    ctx.stroke();

    ctx.fillStyle = '#fff';

    ctx.beginPath();

    ctx.arc(
      4,
      -2,
      3,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
  }

  function drawUfo(
    player,
    ctx
  ) {
    const r =
      player.getScreenRect();

    const cx =
      r.x + r.w / 2;

    const cy =
      r.y + r.h / 2;

    ctx.save();

    ctx.translate(cx, cy);
    ctx.rotate(player.rotation);

    ctx.shadowColor =
      '#fff44d';

    ctx.shadowBlur = 18;
    ctx.fillStyle =
      '#fff44d';

    ctx.beginPath();

    ctx.ellipse(
      0,
      2,
      18,
      8,
      0,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
      0,
      -3,
      9,
      Math.PI,
      0
    );

    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';

    ctx.beginPath();

    ctx.arc(
      4,
      -3,
      2.5,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
  }

  /* ==========================================================================
     GAME PATCHES
     ========================================================================== */

  const originalCheckCollisions =
    Game.prototype.checkCollisions;

  const originalDrawWorld =
    Game.prototype.drawWorld;

  Game.prototype._bindUI =
    function() {

      const safe =
        (id, fn) => {
          const element = $(id);

          if (element) {
            element.addEventListener(
              'click',
              fn
            );
          }
        };

      safe(
        'btn-pause',
        () => this.pauseGame()
      );

      safe(
        'btn-resume',
        () => this.resumeGame()
      );

      safe(
        'btn-pause-menu',
        () => this.goToMenu()
      );

      safe(
        'btn-retry',
        () => this.startLevel(
          this.currentLevelKey
        )
      );

      safe(
        'btn-gohome',
        () => this.goToMenu()
      );

      safe(
        'btn-victory-home',
        () => this.goToMenu()
      );

      safe(
        'btn-next',
        () => {
          const index =
            levelIndex(
              this.currentLevelKey
            );

          const next =
            LEVELS[index + 1];

          if (
            next &&
            this.storage.isUnlocked(
              next.key
            )
          ) {
            this.startLevel(
              next.key
            );
          } else {
            this.goToMenu();
          }
        }
      );
    };

  Game.prototype._bindInput =
    function() {

      this._inputHeld = false;

      const press = () => {

        if (
          this.state !== 'playing'
        ) {
          return;
        }

        this._inputHeld = true;
        this.player.shipInput = true;

        if (
          (this.player.mode || 'cube') !==
          'ship'
        ) {
          this.player.jump(
            this.audio,
            this.particles
          );
        }
      };

      const release = () => {
        this._inputHeld = false;
        this.player.shipInput = false;
      };

      window.addEventListener(
        'keydown',
        event => {

          if (
            event.code === 'Space' ||
            event.code === 'ArrowUp'
          ) {
            event.preventDefault();
            press();
          }

          if (
            event.code === 'Escape' &&
            this.state === 'playing'
          ) {
            this.pauseGame();
          }
        }
      );

      window.addEventListener(
        'keyup',
        event => {

          if (
            event.code === 'Space' ||
            event.code === 'ArrowUp'
          ) {
            release();
          }
        }
      );

      this.canvas.addEventListener(
        'mousedown',
        press
      );

      window.addEventListener(
        'mouseup',
        release
      );

      this.canvas.addEventListener(
        'touchstart',
        event => {
          event.preventDefault();
          press();
        },
        { passive: false }
      );

      this.canvas.addEventListener(
        'touchend',
        event => {
          event.preventDefault();
          release();
        },
        { passive: false }
      );
    };

  Game.prototype.startLevel =
    function(levelKey) {

      const config =
        levelByKey(levelKey);

      ensureSave(
        this.storage
      );

      if (
        !this.storage.isUnlocked(
          config.key
        )
      ) {
        return;
      }

      this.currentLevelKey =
        config.key;

      this.level =
        LevelBuilder.build(
          config.pattern,
          config.speed,
          config.name
        );

      this.level.expansion =
        config;

      this.player.reset();

      this.player.mode =
        config.mode;

      this.player.shipInput =
        false;

      this.particles.clear();

      this.cameraX = 0;

      this.bestAtStart =
        this.storage.getBest(
          config.key
        );

      this.currentAttemptNumber =
        this.storage.registerAttempt(
          config.key
        );

      if ($('attempt-badge')) {
        $('attempt-badge').textContent =
          `Attempt #${this.currentAttemptNumber}`;
      }

      this.state = 'playing';

      this._lastMode =
        config.mode;

      this.audio.startBGM(
        config.music
      );

      this.showScreen(
        'game-screen'
      );

      updateHud(
        this,
        config.mode
      );
    };

  Game.prototype._refreshMenuStats =
    function() {

      ensureSave(
        this.storage
      );

      LEVELS.forEach(level => {

        const stat =
          $(`gd-stats-${level.key}`);

        if (stat) {
          stat.textContent =
            `${this.storage.getBest(level.key)}% • ` +
            `${this.storage.getAttempts(level.key)} attempts`;
        }

        const lock =
          $(`gd-lock-${level.key}`);

        const card =
          document.querySelector(
            `.gd-level-card[data-index="${levelIndex(level.key)}"]`
          );

        if (lock) {
          lock.textContent =
            this.storage.isUnlocked(
              level.key
            )
              ? '✓'
              : '🔒';
        }

        if (card) {
          card.classList.toggle(
            'locked',
            !this.storage.isUnlocked(
              level.key
            )
          );
        }
      });

      const total =
        $('stat-total-attempts');

      if (total) {
        total.textContent =
          this.storage.getTotalAttempts();
      }
    };

  Game.prototype.checkCollisions =
    function() {

      const mode =
        this.player.mode || 'cube';

      if (
        mode === 'cube' ||
        mode === 'robot'
      ) {
        return originalCheckCollisions.call(
          this
        );
      }

      const player =
        this.player;

      const rect = {
        x: player.worldX,
        y: player.y,
        w: player.size,
        h: player.size
      };

      const overlap =
        (a, b) =>
          a.x < b.x + b.w &&
          a.x + a.w > b.x &&
          a.y < b.y + b.h &&
          a.y + a.h > b.y;

      for (
        const spike of
        this.level.spikeRects
      ) {
        if (
          overlap(
            rect,
            spike
          )
        ) {
          player.die();
          return;
        }
      }

      /*
        SHIP:
        Menyentuh lantai/platform/atas/bawah
        = mati.
      */

      if (mode === 'ship') {

        if (
          player.y <= 0 ||
          player.y + player.size >=
            CONFIG.CANVAS_H
        ) {
          player.die();
          return;
        }

        for (
          const solid of [
            ...this.level.groundRects,
            ...this.level.blockRects
          ]
        ) {
          if (
            overlap(
              rect,
              solid
            )
          ) {
            player.die();
            return;
          }
        }

        return;
      }

      /*
        UFO:
        Bisa mendarat di platform.
      */

      let landed = false;

      for (
        const solid of [
          ...this.level.groundRects,
          ...this.level.blockRects
        ]
      ) {

        if (
          !overlap(
            rect,
            solid
          )
        ) {
          continue;
        }

        const previousBottom =
          rect.y +
          rect.h -
          player.vy;

        if (
          player.vy >= 0 &&
          previousBottom <=
            solid.y + 5
        ) {
          player.land(
            solid.y
          );

          landed = true;

        } else {
          player.die();
          return;
        }
      }

      if (
        !landed &&
        player.y + player.size >=
          CONFIG.CANVAS_H
      ) {
        player.die();
        return;
      }

      if (
        !landed &&
        player.onGround
      ) {
        const column =
          Math.floor(
            player.worldX /
            CONFIG.TILE
          );

        if (
          this.level.isGapAt(
            column
          )
        ) {
          player.onGround = false;
        }
      }
    };

  Game.prototype.update =
    function() {

      if (
        this.state !== 'playing'
      ) {
        return;
      }

      const player =
        this.player;

      const config =
        this.level.expansion ||
        levelByKey(
          this.currentLevelKey
        );

      player.worldX +=
        this.level.speed;

      this.cameraX =
        player.worldX -
        CONFIG.PLAYER_X;

      const progress =
        player.worldX /
        this.level.lengthPx;

      let mode =
        config.mode;

      (
        config.transitions || []
      ).forEach(transition => {

        if (
          progress >=
          transition.at
        ) {
          mode =
            transition.mode;
        }
      });

      if (
        mode !== player.mode
      ) {

        player.mode =
          mode;

        player.onGround =
          false;

        player.vy = 0;

        player.shipInput =
          this._inputHeld;

        /*
          Agar pergantian ke Ship/UFO
          tidak langsung menabrak lantai.
        */

        if (
          mode === 'ship' ||
          mode === 'ufo'
        ) {
          player.y = 180;

          player.vy =
            mode === 'ship'
              ? -2
              : 0;
        }

        this._lastMode =
          mode;

        portalFlash();

        if (
          this.audio.playPortal
        ) {
          this.audio.playPortal();
        }
      }

      player.shipInput =
        this._inputHeld;

      player.update(
        this.particles
      );

      this.checkCollisions();

      if (!player.alive) {
        this.triggerGameOver();
        return;
      }

      const percent =
        clamp(
          Math.round(
            progress * 100
          ),
          0,
          100
        );

      if ($('progress-fill')) {
        $('progress-fill').style.width =
          `${percent}%`;
      }

      if ($('progress-percent')) {
        $('progress-percent').textContent =
          `${percent}%`;
      }

      updateHud(
        this,
        player.mode
      );

      if (
        player.worldX >=
        this.level.lengthPx
      ) {
        this.triggerVictory();
      }
    };

  Game.prototype.triggerVictory =
    function() {

      this.state = 'victory';

      this.audio.stopBGM();
      this.audio.playVictory();

      this.storage.updateBestProgress(
        this.currentLevelKey,
        100
      );

      const index =
        levelIndex(
          this.currentLevelKey
        );

      const next =
        LEVELS[index + 1];

      let didUnlock = false;

      if (next) {
        didUnlock =
          this.storage.unlockLevel(
            next.key
          );
      }

      if ($('win-attempt')) {
        $('win-attempt').textContent =
          `#${this.currentAttemptNumber}`;
      }

      if ($('unlock-msg')) {

        $('unlock-msg').textContent =
          didUnlock
            ? I18N[
                window.gdLang || 'id'
              ].unlock
            : '';

        $('unlock-msg').classList.toggle(
          'hidden',
          !didUnlock
        );
      }

      const button =
        $('btn-next');

      if (button) {

        button.style.display =
          next
            ? 'block'
            : 'none';

        button.textContent =
          I18N[
            window.gdLang || 'id'
          ].next;
      }

      this._refreshMenuStats();

      this.showScreen(
        'victory-screen'
      );
    };

  Game.prototype.pauseGame =
    function() {

      if (
        this.state !== 'playing'
      ) {
        return;
      }

      this.state = 'paused';

      this.audio.stopBGM();

      $('pause-overlay')
        ?.classList
        .remove('hidden');
    };

  Game.prototype.resumeGame =
    function() {

      if (
        this.state !== 'paused'
      ) {
        return;
      }

      this.state = 'playing';

      this.audio.startBGM(
        this.level?.expansion?.music
      );

      $('pause-overlay')
        ?.classList
        .add('hidden');
    };

  /* ==========================================================================
     AUDIO
     ========================================================================== */

  const originalStartBGM =
    AudioManager.prototype.startBGM;

  AudioManager.prototype.startBGM =
    function(pattern) {

      if (!pattern) {
        return originalStartBGM.call(
          this
        );
      }

      if (this.muted) {
        return;
      }

      this._ensureContext();

      this.stopBGM();

      this.bgmStep = 0;

      const stepTime = 145;

      const playStep = () => {

        if (
          this.muted ||
          !this.ctx
        ) {
          return;
        }

        const frequency =
          pattern[
            this.bgmStep %
            pattern.length
          ];

        const time =
          this.ctx.currentTime;

        const oscillator =
          this.ctx.createOscillator();

        const gain =
          this.ctx.createGain();

        oscillator.type =
          'triangle';

        oscillator.frequency
          .setValueAtTime(
            frequency * 2,
            time
          );

        gain.gain.setValueAtTime(
          0.045,
          time
        );

        gain.gain
          .exponentialRampToValueAtTime(
            0.001,
            time + 0.13
          );

        oscillator
          .connect(gain)
          .connect(
            this.ctx.destination
          );

        oscillator.start(time);

        oscillator.stop(
          time + 0.14
        );

        if (
          this.bgmStep % 4 === 0
        ) {

          const bass =
            this.ctx.createOscillator();

          const bassGain =
            this.ctx.createGain();

          bass.type =
            'sawtooth';

          bass.frequency
            .setValueAtTime(
              frequency / 2,
              time
            );

          bassGain.gain
            .setValueAtTime(
              0.055,
              time
            );

          bassGain.gain
            .exponentialRampToValueAtTime(
              0.001,
              time + 0.4
            );

          bass
            .connect(bassGain)
            .connect(
              this.ctx.destination
            );

          bass.start(time);

          bass.stop(
            time + 0.4
          );
        }

        this.bgmStep++;
      };

      playStep();

      this.bgmTimer =
        setInterval(
          playStep,
          stepTime
        );
    };

  AudioManager.prototype.playPortal =
    function() {

      if (this.muted) {
        return;
      }

      this._ensureContext();

      const time =
        this.ctx.currentTime;

      const oscillator =
        this.ctx.createOscillator();

      const gain =
        this.ctx.createGain();

      oscillator.type =
        'sine';

      oscillator.frequency
        .setValueAtTime(
          280,
          time
        );

      oscillator.frequency
        .exponentialRampToValueAtTime(
          900,
          time + 0.18
        );

      gain.gain.setValueAtTime(
        0.09,
        time
      );

      gain.gain
        .exponentialRampToValueAtTime(
          0.001,
          time + 0.2
        );

      oscillator
        .connect(gain)
        .connect(
          this.ctx.destination
        );

      oscillator.start(time);

      oscillator.stop(
        time + 0.21
      );
    };

  function portalFlash() {

    const element =
      $('portal-flash');

    if (!element) {
      return;
    }

    element.style.opacity = '1';

    setTimeout(() => {
      element.style.opacity = '0';
    }, 160);
  }

  function updateHud(
    game,
    mode
  ) {

    const config =
      levelByKey(
        game.currentLevelKey
      );

    const currentMode =
      MODE[mode] ||
      MODE.cube;

    const levelName =
      $('hud-level-name');

    if (levelName) {

      levelName.textContent =
        `LVL ${levelIndex(config.key) + 1} • ${config.name}`;
    }

    const badge =
      $('hud-mode-badge');

    if (badge) {

      badge.className =
        `mode-badge mode-${mode}`;

      badge.innerHTML = `
        <span class="mode-icon">
          ${currentMode.icon}
        </span>

        <span class="mode-text">
          ${currentMode.label}
        </span>
      `;
    }
  }

  /* ==========================================================================
     PORTALS
     ========================================================================== */

  Game.prototype.drawWorld =
    function() {

      originalDrawWorld.call(
        this
      );

      const config =
        this.level?.expansion;

      if (
        !config ||
        !config.transitions ||
        !config.transitions.length
      ) {
        return;
      }

      const ctx =
        this.ctx;

      const total =
        this.level.lengthPx;

      ctx.save();

      ctx.translate(
        -this.cameraX,
        0
      );

      config.transitions.forEach(
        transition => {

          const x =
            total *
            transition.at;

          const mode =
            MODE[
              transition.mode
            ] ||
            MODE.cube;

          let portalColor =
            '#c77dff';

          if (
            transition.mode ===
            'ship'
          ) {
            portalColor =
              '#ffad5c';
          }

          if (
            transition.mode ===
            'ufo'
          ) {
            portalColor =
              '#fff44d';
          }

          ctx.strokeStyle =
            portalColor;

          ctx.shadowColor =
            portalColor;

          ctx.shadowBlur = 18;

          ctx.lineWidth = 5;

          ctx.beginPath();

          ctx.ellipse(
            x,
            180,
            18,
            120,
            0,
            0,
            Math.PI * 2
          );

          ctx.stroke();

          ctx.shadowBlur = 0;

          ctx.fillStyle = '#fff';

          ctx.font =
            'bold 12px Segoe UI';

          ctx.textAlign =
            'center';

          ctx.fillText(
            mode.label,
            x,
            178
          );
        }
      );

      ctx.restore();
    };

  /* ==========================================================================
     BOOT
     ========================================================================== */

  window.gdLang =
    localStorage.getItem(
      'geometry_rush_lang'
    ) || 'id';

  localStorage.setItem(
    'geometry_rush_lang',
    window.gdLang
  );

  window.addEventListener(
    'DOMContentLoaded',
    () => {

      buildExpansionUI();

      const game =
        window.gameInstance;

      if (!game) {
        return;
      }

      ensureSave(
        game.storage
      );

      game._refreshMenuStats();

      applyLanguage();
    }
  );

})();