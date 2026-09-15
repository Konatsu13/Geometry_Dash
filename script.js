/* ==========================================================================
   GEOMETRY RUSH - script.js
   Clone sederhana "Geometry Dash" menggunakan Vanilla JS + Canvas API.
   Struktur kode dibagi menjadi beberapa "modul" berbasis Class:
     1. StorageManager -> mengurus penyimpanan LocalStorage
     2. AudioManager    -> mengurus SFX & BGM sintetis via Web Audio API
     3. ParticleSystem  -> efek partikel (trail & ledakan hancur)
     4. LevelBuilder    -> mengubah "tilemap" (matrix) menjadi data obstacle
     5. Player          -> fisika, animasi rotasi, dan collider kubus
     6. Game            -> game loop utama, state machine, rendering, UI
   ========================================================================== */

'use strict';

/* ==========================================================================
   1. KONFIGURASI GLOBAL
   ========================================================================== */
const CONFIG = {
  TILE: 40,               // ukuran 1 tile dalam pixel
  CANVAS_W: 800,
  CANVAS_H: 400,
  GROUND_Y: 360,           // posisi Y (atas) dari lantai/ground
  GRAVITY: 0.72,           // percepatan gravitasi per frame
  JUMP_VELOCITY: -13.2,    // kecepatan awal lompatan (negatif = ke atas)
  PLAYER_SIZE: 32,         // lebar & tinggi kubus pemain
  PLAYER_X: 140,           // posisi X pemain tetap (kamera yang bergerak)
  SPEED_EASY: 4.4,
  SPEED_NORMAL: 6.2,
};

/* ==========================================================================
   2. STORAGE MANAGER
   Mengelola semua data yang disimpan permanen di LocalStorage:
   - Best progress (%) tiap level
   - Status unlock level Normal
   - Jumlah attempt tiap level & total keseluruhan
   ========================================================================== */
class StorageManager {
  constructor() {
    this.KEY = 'geometry_rush_save_v1';
    this.data = this._load();
  }

  _defaultData() {
    return {
      bestProgress: { easy: 0, normal: 0 },
      attempts: { easy: 0, normal: 0 },
      unlocked: { easy: true, normal: false },
      totalAttempts: 0,
    };
  }

  _load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return this._defaultData();
      const parsed = JSON.parse(raw);
      // Merge dengan default agar tahan terhadap versi data lama/rusak
      return Object.assign(this._defaultData(), parsed);
    } catch (e) {
      return this._defaultData();
    }
  }

  _save() {
    localStorage.setItem(this.KEY, JSON.stringify(this.data));
  }

  getBest(level) { return this.data.bestProgress[level] || 0; }
  getAttempts(level) { return this.data.attempts[level] || 0; }
  isUnlocked(level) { return !!this.data.unlocked[level]; }
  getTotalAttempts() { return this.data.totalAttempts || 0; }

  // Dipanggil setiap kali pemain memulai/mengulang percobaan baru
  registerAttempt(level) {
    this.data.attempts[level] = (this.data.attempts[level] || 0) + 1;
    this.data.totalAttempts = (this.data.totalAttempts || 0) + 1;
    this._save();
    return this.data.attempts[level];
  }

  // Update skor terbaik, kembalikan true jika ada rekor baru
  updateBestProgress(level, percent) {
    const current = this.data.bestProgress[level] || 0;
    if (percent > current) {
      this.data.bestProgress[level] = percent;
      this._save();
      return true;
    }
    return false;
  }

  unlockLevel(level) {
    if (!this.data.unlocked[level]) {
      this.data.unlocked[level] = true;
      this._save();
      return true;
    }
    return false;
  }
}

/* ==========================================================================
   3. AUDIO MANAGER
   Semua suara dibuat secara SINTETIS memakai Web Audio API (OscillatorNode),
   jadi tidak butuh file .mp3 eksternal sama sekali.
   ========================================================================== */
class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
  }

  // AudioContext baru boleh dibuat setelah ada interaksi user (kebijakan browser)
  _ensureContext() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopBGM();
    return this.muted;
  }

  // SFX melompat: nada naik cepat (bright "blip")
  playJump() {
    if (this.muted) return;
    this._ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.09);
    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  // SFX mati: noise burst pendek + nada turun (efek "hancur")
  playDeath() {
    if (this.muted) return;
    this._ensureContext();
    const t = this.ctx.currentTime;

    // Bagian noise (white noise buffer pendek) untuk kesan "pecah"
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.22, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    noise.connect(noiseGain).connect(this.ctx.destination);
    noise.start(t);

    // Bagian nada turun (descending pitch) untuk kesan "gagal"
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.35);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  // SFX kemenangan: arpeggio naik pendek
  playVictory() {
    if (this.muted) return;
    this._ensureContext();
    const notes = [523, 659, 784, 1046];
    notes.forEach((freq, i) => {
      const t = this.ctx.currentTime + i * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.13, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  // Background music: pola arpeggio synthwave 8-bit yang looping
  // Dijadwalkan manual pakai setInterval agar tidak butuh file audio.
  startBGM() {
    if (this.muted) return;
    this._ensureContext();
    this.stopBGM();
    const pattern = [130.81, 164.81, 196.00, 164.81, 220.00, 196.00, 164.81, 130.81]; // C3 arpeggio minor-ish
    const stepTime = 180; // ms per not
    this.bgmStep = 0;

    const playStep = () => {
      if (this.muted || !this.ctx) return;
      const freq = pattern[this.bgmStep % pattern.length];
      const t = this.ctx.currentTime;

      // Lead synth (gelombang persegi ala 8-bit)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq * 2, t);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.17);

      // Bass drone di bawahnya (nuansa synthwave)
      if (this.bgmStep % 4 === 0) {
        const bass = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bass.type = 'sawtooth';
        bass.frequency.setValueAtTime(freq / 2, t);
        bGain.gain.setValueAtTime(0.06, t);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        bass.connect(bGain).connect(this.ctx.destination);
        bass.start(t);
        bass.stop(t + 0.5);
      }

      this.bgmStep++;
    };

    playStep();
    this.bgmTimer = setInterval(playStep, stepTime);
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

/* ==========================================================================
   4. PARTICLE SYSTEM
   Menangani efek trail (jejak) di belakang kubus & partikel ledakan saat mati.
   ========================================================================== */
class Particle {
  constructor(x, y, vx, vy, color, life, size) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.15; // sedikit gravitasi untuk partikel
    this.life--;
  }
  get alpha() { return Math.max(this.life / this.maxLife, 0); }
  get dead() { return this.life <= 0; }
}

class ParticleSystem {
  constructor() { this.particles = []; }

  // Jejak kecil yang muncul terus-menerus di belakang kubus
  spawnTrail(x, y, color) {
    this.particles.push(new Particle(
      x, y,
      -1.5 - Math.random(), (Math.random() - 0.5) * 1.5,
      color, 22, 3 + Math.random() * 2
    ));
  }

  // Ledakan besar berkeping-keping saat kubus mati menabrak duri/balok
  spawnExplosion(x, y, color) {
    for (let i = 0; i < 26; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        color, 35 + Math.random() * 20, 3 + Math.random() * 4
      ));
    }
  }

  // Percikan kecil saat kubus mulai melompat
  spawnJumpBurst(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.PI * 0.5 + (Math.random() - 0.5) * 1.6;
      const speed = 1.5 + Math.random() * 2.5;
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        color, 18, 2 + Math.random() * 2
      ));
    }
  }

  update() {
    this.particles.forEach(p => p.update());
    this.particles = this.particles.filter(p => !p.dead);
  }

  draw(ctx) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.restore();
    });
  }

  clear() { this.particles = []; }
}

/* ==========================================================================
   5. LEVEL BUILDER (TILEMAP / MATRIX)
   Level didefinisikan sebagai STRING POLA per-kolom (1 karakter = 1 tile
   selebar CONFIG.TILE). Fungsi buildLevel() mengubah pola tersebut menjadi
   MATRIX 2 dimensi (baris x kolom) lalu menghasilkan daftar objek rect
   (ground, spike, block) yang dipakai untuk rendering & collision.

   Legenda karakter pola:
     'G' = tanah datar aman
     'X' = tanah + 1 duri (spike) di atasnya -> mati jika tersentuh
     '.' = jurang/gap, tidak ada tanah -> mati jika terjatuh
     'B' = platform balok melayang (dipakai bersama gap '.') -> pemain harus
           melompat tepat di atasnya
   ========================================================================== */
class LevelBuilder {
  static build(pattern, speed, name) {
    const TILE = CONFIG.TILE;
    const ROWS = 10; // tinggi grid vertikal (matrix), row terakhir = level tanah dasar
    const cols = pattern.length;

    // ---- Bangun MATRIX 2D (ROWS x COLS) sesuai instruksi tilemap ----
    // 0 = kosong, 1 = solid (tanah/block), 2 = spike
    const matrix = [];
    for (let r = 0; r < ROWS; r++) matrix.push(new Array(cols).fill(0));

    const GROUND_ROW = ROWS - 1;     // baris paling bawah = permukaan tanah normal
    const BLOCK_ROW = ROWS - 3;      // baris platform melayang (lebih tinggi)

    for (let c = 0; c < cols; c++) {
      const ch = pattern[c];
      if (ch === 'G') {
        matrix[GROUND_ROW][c] = 1;
      } else if (ch === 'X') {
        matrix[GROUND_ROW][c] = 1;
        matrix[GROUND_ROW - 1][c] = 2; // spike menempel di atas tanah
      } else if (ch === '.') {
        // jurang -> tidak diisi apapun (tetap 0)
      } else if (ch === 'B') {
        matrix[BLOCK_ROW][c] = 1; // platform melayang, tanpa tanah di bawahnya
      }
    }

    // ---- Konversi matrix menjadi daftar rect siap-render & collision ----
    const groundRects = [];
    const spikeRects = [];
    const blockRects = [];

    for (let r = 0; r < ROWS; r++) {
      let runStart = -1;
      for (let c = 0; c <= cols; c++) {
        const val = matrix[r][c];
        const isSolid = val === 1;
        if (isSolid && runStart === -1) runStart = c;
        if ((!isSolid || c === cols) && runStart !== -1) {
          // gabungkan tile solid yang berurutan jadi satu rect (efisien & rapi)
          const rect = {
            x: runStart * TILE,
            y: r * TILE,
            w: (c - runStart) * TILE,
            h: TILE,
          };
          if (r === GROUND_ROW) groundRects.push(rect);
          else blockRects.push(rect);
          runStart = -1;
        }
      }
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < cols; c++) {
        if (matrix[r][c] === 2) {
          // Hitbox duri dibuat sedikit lebih kecil dari tile agar terasa "fair"
          const pad = 8;
          spikeRects.push({
            x: c * TILE + pad,
            y: r * TILE + pad,
            w: TILE - pad * 2,
            h: TILE - pad * 2,
            drawX: c * TILE,
            drawY: r * TILE,
          });
        }
      }
    }

    return {
      name,
      matrix,
      speed,
      pattern,
      cols,
      lengthPx: cols * TILE,
      groundRects,
      spikeRects,
      blockRects,
      // Deteksi apakah suatu kolom tile adalah gap (untuk cek jatuh ke jurang)
      isGapAt(colIndex) {
        if (colIndex < 0 || colIndex >= cols) return false;
        return matrix[GROUND_ROW][colIndex] === 0;
      },
    };
  }
}

// ---- Helper singkat untuk menyusun pola level secara rapi ----
const G = (n) => 'G'.repeat(n);

// LEVEL 1 - EASY: kecepatan lambat, duri tunggal berjauhan, tanpa jurang.
const PATTERN_EASY =
  G(12) + 'X' + G(18) + 'X' + G(18) + 'X' + G(16) +
  'X' + G(16) + 'X' + G(18) + 'X' + G(14) + 'X' + G(20);

// LEVEL 2 - NORMAL: lebih cepat, duri ganda ('XX'), dan platform melayang
// yang mengharuskan pemain melompati jurang ('.' + 'BB' + '.').
const PATTERN_NORMAL =
  G(10) + 'XX' + G(12) + 'X' + G(8) +
  '.' + 'BB' + '.' + G(10) +
  'XX' + G(10) + 'X' + G(6) + 'X' + G(8) +
  '.' + 'BBB' + '.' + G(10) +
  'XX' + G(8) + 'XX' + G(10) +
  '.' + 'BB' + '.' + G(8) + 'X' + G(14);

/* ==========================================================================
   6. PLAYER (kubus yang dikendalikan pemain)
   ========================================================================== */
class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.worldX = 0;                       // posisi horizontal di dalam "dunia" level
    this.y = CONFIG.GROUND_Y - CONFIG.PLAYER_SIZE; // posisi vertikal di canvas
    this.vy = 0;                           // kecepatan vertikal saat ini
    this.size = CONFIG.PLAYER_SIZE;
    this.rotation = 0;                     // sudut rotasi kubus (radian)
    this.targetRotation = 0;               // target rotasi (kelipatan 90 derajat)
    this.onGround = true;
    this.alive = true;
    this.trailTimer = 0;
  }

  // Rect collider di posisi tetap layar (kamera mengikuti worldX)
  getScreenRect() {
    return { x: CONFIG.PLAYER_X, y: this.y, w: this.size, h: this.size };
  }

  jump(audio, particles) {
    if (this.onGround && this.alive) {
      this.vy = CONFIG.JUMP_VELOCITY;
      this.onGround = false;
      this.targetRotation += Math.PI / 2; // berputar 90 derajat setiap lompat
      audio.playJump();
      particles.spawnJumpBurst(CONFIG.PLAYER_X + this.size / 2, this.y + this.size, '#00f0ff');
    }
  }

  update(particles) {
    if (!this.alive) return;

    // --- Fisika gravitasi ---
    this.vy += CONFIG.GRAVITY;
    this.y += this.vy;

    // --- Animasi rotasi mulus menuju target (efek smooth flip) ---
    const diff = this.targetRotation - this.rotation;
    this.rotation += diff * 0.25;

    // --- Trail/jejak partikel di belakang kubus ---
    this.trailTimer++;
    if (this.trailTimer % 3 === 0) {
      particles.spawnTrail(
        CONFIG.PLAYER_X, this.y + this.size / 2, 'rgba(0, 240, 255, 0.55)'
      );
    }
  }

  land(groundTopY) {
    this.y = groundTopY - this.size;
    this.vy = 0;
    this.onGround = true;
    // Snap rotasi ke kelipatan 90 derajat terdekat agar terlihat rapi saat mendarat
    this.targetRotation = Math.round(this.targetRotation / (Math.PI / 2)) * (Math.PI / 2);
    this.rotation = this.targetRotation;
  }

  die() { this.alive = false; }

  draw(ctx) {
    const r = this.getScreenRect();
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);

    // Body kubus dengan gradient neon
    const grad = ctx.createLinearGradient(-r.w / 2, -r.h / 2, r.w / 2, r.h / 2);
    grad.addColorStop(0, '#00f0ff');
    grad.addColorStop(1, '#ff2ee6');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 18;
    ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h);

    // Border putih tipis + "wajah" segitiga khas geometry dash
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-r.w / 2, -r.h / 2, r.w, r.h);

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(-4, -4);
    ctx.lineTo(8, 4);
    ctx.lineTo(-4, 12);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

/* ==========================================================================
   7. GAME (state machine, game loop, rendering, koneksi ke UI/DOM)
   ========================================================================== */
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.storage = new StorageManager();
    this.audio = new AudioManager();
    this.particles = new ParticleSystem();
    this.player = new Player();

    this.state = 'menu';      // 'menu' | 'playing' | 'paused' | 'gameover' | 'victory'
    this.currentLevelKey = null;
    this.level = null;
    this.cameraX = 0;
    this.bgOffset = 0;
    this.currentAttemptNumber = 1;
    this.bestAtStart = 0;

    this._bindUI();
    this._bindInput();
    this._refreshMenuStats();

    requestAnimationFrame(this._loop.bind(this));
  }

  /* ---------------- UI BINDING ---------------- */
  _bindUI() {
    document.getElementById('btn-level-easy').addEventListener('click', () => this.startLevel('easy'));
    document.getElementById('btn-level-normal').addEventListener('click', () => {
      if (this.storage.isUnlocked('normal')) this.startLevel('normal');
    });

    document.getElementById('btn-pause').addEventListener('click', () => this.pauseGame());
    document.getElementById('btn-resume').addEventListener('click', () => this.resumeGame());
    document.getElementById('btn-pause-menu').addEventListener('click', () => this.goToMenu());

    document.getElementById('btn-retry').addEventListener('click', () => this.startLevel(this.currentLevelKey));
    document.getElementById('btn-gohome').addEventListener('click', () => this.goToMenu());

    document.getElementById('btn-next').addEventListener('click', () => {
      if (this.currentLevelKey === 'easy' && this.storage.isUnlocked('normal')) {
        this.startLevel('normal');
      } else {
        this.goToMenu();
      }
    });
    document.getElementById('btn-victory-home').addEventListener('click', () => this.goToMenu());

    document.getElementById('mute-toggle').addEventListener('click', (e) => {
      const muted = this.audio.toggleMute();
      e.target.textContent = muted ? '🔇 SOUND OFF' : '🔊 SOUND ON';
    });
  }

  _bindInput() {
    const doJump = () => {
      if (this.state === 'playing') this.player.jump(this.audio, this.particles);
    };

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        doJump();
      }
      if (e.code === 'Escape' && this.state === 'playing') this.pauseGame();
    });

    this.canvas.addEventListener('mousedown', doJump);
    this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); doJump(); }, { passive: false });
  }

  /* ---------------- STATE TRANSITIONS ---------------- */
  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  goToMenu() {
    this.state = 'menu';
    this.audio.stopBGM();
    document.getElementById('pause-overlay').classList.add('hidden');
    this._refreshMenuStats();
    this.showScreen('menu-screen');
  }

  startLevel(levelKey) {
    this.currentLevelKey = levelKey;
    const pattern = levelKey === 'easy' ? PATTERN_EASY : PATTERN_NORMAL;
    const speed = levelKey === 'easy' ? CONFIG.SPEED_EASY : CONFIG.SPEED_NORMAL;
    this.level = LevelBuilder.build(pattern, speed, levelKey);

    this.player.reset();
    this.particles.clear();
    this.cameraX = 0;
    this.bestAtStart = this.storage.getBest(levelKey);

    this.currentAttemptNumber = this.storage.registerAttempt(levelKey);
    document.getElementById('attempt-badge').textContent = `Attempt #${this.currentAttemptNumber}`;

    this.state = 'playing';
    this.audio.startBGM();
    this.showScreen('game-screen');
  }

  pauseGame() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.audio.stopBGM();
    document.getElementById('pause-overlay').classList.remove('hidden');
  }

  resumeGame() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.audio.startBGM();
    document.getElementById('pause-overlay').classList.add('hidden');
  }

  triggerGameOver() {
    this.state = 'gameover';
    this.audio.stopBGM();
    this.audio.playDeath();
    this.particles.spawnExplosion(
      CONFIG.PLAYER_X + this.player.size / 2,
      this.player.y + this.player.size / 2,
      '#ff2ee6'
    );

    const percent = this.getProgressPercent();
    this.storage.updateBestProgress(this.currentLevelKey, percent);

    // Beri jeda sedikit agar animasi ledakan terlihat sebelum modal muncul
    setTimeout(() => {
      document.getElementById('go-percent').textContent = `${percent}%`;
      document.getElementById('go-attempt').textContent = `#${this.currentAttemptNumber}`;
      document.getElementById('go-best').textContent = `${this.storage.getBest(this.currentLevelKey)}%`;
      this.showScreen('gameover-screen');
    }, 550);
  }

  triggerVictory() {
    this.state = 'victory';
    this.audio.stopBGM();
    this.audio.playVictory();
    this.storage.updateBestProgress(this.currentLevelKey, 100);

    let didUnlock = false;
    if (this.currentLevelKey === 'easy') {
      didUnlock = this.storage.unlockLevel('normal');
    }

    document.getElementById('win-attempt').textContent = `#${this.currentAttemptNumber}`;
    const unlockMsg = document.getElementById('unlock-msg');
    const nextBtn = document.getElementById('btn-next');
    if (didUnlock) {
      unlockMsg.classList.remove('hidden');
      nextBtn.textContent = '→ LEVEL BERIKUTNYA';
      nextBtn.style.display = 'block';
    } else if (this.currentLevelKey === 'normal') {
      unlockMsg.classList.add('hidden');
      nextBtn.style.display = 'none';
    } else {
      unlockMsg.classList.add('hidden');
      nextBtn.style.display = 'block';
      nextBtn.textContent = this.storage.isUnlocked('normal') ? '→ LEVEL BERIKUTNYA' : '⌂ MENU UTAMA';
    }

    this.showScreen('victory-screen');
  }

  /* ---------------- HELPER ---------------- */
  getProgressPercent() {
    const pct = (this.player.worldX / this.level.lengthPx) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  _refreshMenuStats() {
    document.getElementById('stat-best-easy').textContent = `${this.storage.getBest('easy')}%`;
    document.getElementById('stat-attempt-easy').textContent = this.storage.getAttempts('easy');
    document.getElementById('stat-best-normal').textContent = `${this.storage.getBest('normal')}%`;
    document.getElementById('stat-attempt-normal').textContent = this.storage.getAttempts('normal');
    document.getElementById('stat-total-attempts').textContent = this.storage.getTotalAttempts();

    const normalCard = document.getElementById('btn-level-normal');
    if (this.storage.isUnlocked('normal')) {
      normalCard.classList.remove('locked');
    } else {
      normalCard.classList.add('locked');
    }
  }

  /* ---------------- COLLISION DETECTION ---------------- */
  checkCollisions() {
    const p = this.player;
    const playerRect = {
      x: p.worldX,               // gunakan koordinat DUNIA (bukan layar) untuk cek presisi
      y: p.y,
      w: p.size,
      h: p.size,
    };

    const rectsOverlap = (a, b) =>
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

    // --- Cek tabrakan dengan DURI (selalu fatal) ---
    for (const spike of this.level.spikeRects) {
      if (rectsOverlap(playerRect, spike)) {
        this.player.die();
        return;
      }
    }

    // --- Cek tabrakan dengan TANAH & BALOK (solid) ---
    const allSolids = [...this.level.groundRects, ...this.level.blockRects];
    let landedOnSomething = false;

    for (const rect of allSolids) {
      if (!rectsOverlap(playerRect, rect)) continue;

      const prevBottom = playerRect.y + playerRect.h - p.vy; // posisi bawah sebelum gerak vertikal frame ini
      const fallingOntoTop = p.vy >= 0 && prevBottom <= rect.y + 4;

      if (fallingOntoTop) {
        // Mendarat rapi di atas permukaan -> aman, kubus berjalan di atasnya
        p.land(rect.y);
        landedOnSomething = true;
      } else {
        // Menabrak sisi samping / bawah balok -> game over
        this.player.die();
        return;
      }
    }

    // --- Cek jatuh ke jurang (tidak ada tanah sama sekali di bawah kubus) ---
    if (!landedOnSomething && p.y + p.size >= CONFIG.CANVAS_H) {
      this.player.die();
    }

    // Jika sebelumnya di tanah tapi sekarang tidak ada rect ground di bawahnya -> mulai jatuh
    if (!landedOnSomething && p.onGround) {
      const col = Math.floor(p.worldX / CONFIG.TILE);
      if (this.level.isGapAt(col)) {
        p.onGround = false;
      }
    }
  }

  /* ---------------- UPDATE & RENDER LOOP ---------------- */
  update() {
    if (this.state !== 'playing') return;

    const p = this.player;
    p.worldX += this.level.speed;   // pemain otomatis maju terus ke kanan
    this.cameraX = p.worldX - CONFIG.PLAYER_X;

    p.update(this.particles);
    this.checkCollisions();

    if (!p.alive) {
      this.triggerGameOver();
      return;
    }

    // Update UI progress bar setiap frame
    const percent = this.getProgressPercent();
    document.getElementById('progress-fill').style.width = `${percent}%`;
    document.getElementById('progress-percent').textContent = `${percent}%`;

    if (p.worldX >= this.level.lengthPx) {
      this.triggerVictory();
    }
  }

  drawBackground() {
    const ctx = this.ctx;
    // Parallax garis-garis vertikal neon bergerak lambat sebagai dekorasi
    ctx.save();
    ctx.strokeStyle = 'rgba(168, 107, 255, 0.12)';
    ctx.lineWidth = 2;
    const parallaxOffset = (this.cameraX * 0.3) % 60;
    for (let x = -parallaxOffset; x < CONFIG.CANVAS_W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CONFIG.CANVAS_H);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawWorld() {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(-this.cameraX, 0);

    // --- Gambar tanah ---
    this.level.groundRects.forEach(r => {
      const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      grad.addColorStop(0, '#1c1c34');
      grad.addColorStop(1, '#0a0a14');
      ctx.fillStyle = grad;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x, r.y, r.w, 2); // garis neon di permukaan atas
    });

    // --- Gambar platform/balok melayang ---
    this.level.blockRects.forEach(r => {
      ctx.fillStyle = '#241a3d';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = '#a86bff';
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
    });

    // --- Gambar duri (segitiga neon) ---
    this.level.spikeRects.forEach(s => {
      const baseX = s.drawX, baseY = s.drawY + CONFIG.TILE;
      ctx.beginPath();
      ctx.moveTo(baseX + 4, baseY);
      ctx.lineTo(baseX + CONFIG.TILE / 2, baseY - CONFIG.TILE + 6);
      ctx.lineTo(baseX + CONFIG.TILE - 4, baseY);
      ctx.closePath();
      ctx.fillStyle = '#ff2ee6';
      ctx.shadowColor = '#ff2ee6';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // --- Garis finish ---
    const finishX = this.level.lengthPx;
    ctx.fillStyle = '#fff44d';
    ctx.shadowColor = '#fff44d';
    ctx.shadowBlur = 15;
    ctx.fillRect(finishX, 0, 6, CONFIG.CANVAS_H);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

    this.drawBackground();

    if (this.state === 'playing' || this.state === 'paused') {
      this.drawWorld();

      // Partikel digambar di ruang layar (mengikuti posisi world - camera secara manual)
      ctx.save();
      ctx.translate(-this.cameraX, 0);
      this.particles.draw(ctx);
      ctx.restore();

      this.player.draw(ctx);
    }
  }

  _loop() {
    this.update();
    if (this.state === 'playing') this.particles.update();
    this.draw();
    requestAnimationFrame(this._loop.bind(this));
  }
}

/* ==========================================================================
   BOOTSTRAP
   ========================================================================== */
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new Game();
});
