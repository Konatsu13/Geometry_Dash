/* ==========================================================================
   CUBE RUNNER - MODERN WEB GAME ENGINE (VANILLA JS + HTML5 CANVAS)
   ==========================================================================
   Dokumentasi & Arsitektur Kode:
   Game ini dibangun menggunakan paradigma Object-Oriented Programming (OOP)
   dengan pemisahan modul yang terstruktur:
   
   1. CONFIG & LEVEL DATA   -> Parameter fisika & konfigurasi 6 level unik
   2. StorageManager        -> Pengelolaan penyimpanan permanen (LocalStorage)
   3. AudioManager          -> Web Audio API & pemutaran file musik eksternal
   4. ParticleSystem        -> Efek visual partikel (Trail, Thruster, Ledakan)
   5. BackgroundRenderer    -> Render background tematik artistik (City, Space, dll)
   6. LevelBuilder          -> Generator matrix rintangan & portal gamemode
   7. Player                -> Fisika multi-mode (Cube, Ship, UFO) & animasi visual
   8. Game Engine           -> State Machine, Loop Utama, Collision Presisi & UI
   ========================================================================== */

'use strict';

/* ==========================================================================
   1. KONFIGURASI GLOBAL & DEFINISI 6 LEVEL
   ========================================================================== */
const CONFIG = {
  // Dimensi dasar Canvas (Virtual Resolution 800x400)
  CANVAS_W: 800,
  CANVAS_H: 400,
  TILE: 40,               // Ukuran 1 grid satuan tile dalam pixel
  GROUND_Y: 360,           // Koordinat Y permukaan lantai
  CEILING_Y: 20,           // Koordinat Y batas tertinggi langit-langit
  PLAYER_SIZE: 32,         // Ukuran lebar & tinggi karakter pemain
  PLAYER_X: 150,           // Posisi horizontal karakter tetap di layar (kamera bergerak)

  // Parameter Fisika: Mode Cube (Kubus Tradisional)
  CUBE_GRAVITY: 0.68,      // Tarikan gravitasi per frame
  CUBE_JUMP_VEL: -13.6,    // Kecepatan awal lompatan ke atas

  // Parameter Fisika: Mode Ship (Pesawat Terbang / Fly)
  SHIP_GRAVITY: 0.38,      // Gravitasi saat tombol dilepas (meluncur turun)
  SHIP_THRUST: -0.72,      // Tenaga dorong ke atas saat tombol ditahan (terbang naik)
  SHIP_MAX_VY: 7.5,        // Batas kecepatan vertikal maksimum agar tidak terlalu liar

  // Parameter Fisika: Mode UFO (Piring Terbang Flapping)
  UFO_GRAVITY: 0.58,       // Gravitasi mode UFO
  UFO_HOP_VEL: -9.8,       // Dorongan impuls setiap kali tombol diketuk di udara
};

// Helper generator string pola tilemap level
const G = (n) => 'G'.repeat(Math.max(0, n));     // G = Ground datar aman (Lantai y:360)
const X = (n) => 'X'.repeat(Math.max(0, n));     // X = Ground + Duri bawah (Floor Spike)
const U = (n) => 'U'.repeat(Math.max(0, n));     // U = Langit-langit + Duri gantung atas (Ceiling Spike)
const W = (n) => 'W'.repeat(Math.max(0, n));     // W = Struktur atap/langit-langit (Ceiling Roof y:0)
const K = (n) => 'K'.repeat(Math.max(0, n));     // K = Struktur langit-langit tebal (Double Ceiling)
const H = (n) => 'H'.repeat(Math.max(0, n));     // H = Balok melayang atas (High Platform y:120)
const M = (n) => 'M'.repeat(Math.max(0, n));     // M = Balok melayang tengah (Mid Platform y:200)
const B = (n) => 'B'.repeat(Math.max(0, n));     // B = Balok melayang bawah (Low Platform y:240)
const V = (n) => 'V'.repeat(Math.max(0, n));     // V = Balok atas + Duri gantung di bawahnya
const T = (n) => 'T'.repeat(Math.max(0, n));     // T = Balok ganda atas & bawah
const D = (n) => 'D'.repeat(Math.max(0, n));     // D = Balok atas + Duri di atasnya
const E = (n) => 'E'.repeat(Math.max(0, n));     // E = Balok tengah + Duri di atasnya
const GAP = (n) => '.'.repeat(Math.max(0, n));   // . = Jurang kosong (Gap)

/* --------------------------------------------------------------------------
   DATA 6 LEVEL (DURASI MINIMAL 1,5 MENIT / 90+ DETIK PER LEVEL):
   - Level 1: 680 tiles (Kecepatan 4.8 => ~94.4 detik)
   - Level 2: 750 tiles (Kecepatan 5.4 => ~92.6 detik)
   - Level 3: 820 tiles (Kecepatan 5.9 => ~92.6 detik)
   - Level 4: 880 tiles (Kecepatan 6.3 => ~93.1 detik)
   - Level 5: 900 tiles (Kecepatan 6.4 => ~93.8 detik - Nerfed)
   - Level 6: 950 tiles (Kecepatan 6.8 => ~93.1 detik - Nerfed)
   - Seluruh atap dilapisi duri langit-langit kristal secara otomatis oleh LevelBuilder
   -------------------------------------------------------------------------- */
const LEVELS = [
  {
    id: 'easy',
    number: 1,
    name: 'STEREO START',
    difficulty: 'EASY',
    icon: '\u25B2',
    color: '#00f0ff',
    secColor: '#38bdf8',
    bgTheme: 'city', // Kota Cyberpunk Malam Hari
    speed: 4.8,
    audioFile: './assets/level1.mp3',
    defaultMode: 'cube',
    // 680 Tiles (~94.4 Detik @ 60 FPS)
    pattern:
      // Tahap 1: Pengenalan ritme dasar & lompatan lantai (130 tiles)
      G(16) + 'X' + G(10) + 'X' + G(12) + 'XX' + G(10) +
      GAP(1) + B(3) + GAP(1) + G(10) + 'X' + G(12) +
      GAP(1) + B(3) + GAP(1) + G(10) + 'XX' + G(12) +
      GAP(1) + M(3) + GAP(1) + G(12) + 'X' + G(10) +
      // Tahap 2: Platform bertingkat melayang & celah berirama (130 tiles)
      GAP(1) + B(3) + GAP(1) + M(3) + GAP(1) + G(12) +
      'X' + G(10) + 'XX' + G(12) +
      GAP(1) + B(2) + GAP(1) + M(2) + GAP(1) + H(2) + GAP(1) + G(12) +
      'X' + G(10) + 'X' + G(10) + 'XX' + G(12) +
      GAP(1) + B(3) + GAP(1) + G(12) +
      // Tahap 3: Penerbangan Mode Ship Gelombang 1 (140 tiles)
      'S' +
      GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) +
      GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) +
      GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) +
      // Tahap 4: Platforming Cube Menengah & Hanging Hazards (140 tiles)
      'C' +
      G(12) + 'X' + G(10) + 'XX' + G(10) +
      GAP(1) + M(3) + GAP(1) + G(10) +
      V(2) + G(10) + 'X' + G(12) +
      GAP(1) + B(3) + GAP(1) + M(3) + GAP(1) + G(10) +
      'XX' + G(10) + 'X' + G(12) +
      GAP(1) + H(3) + GAP(1) + G(12) +
      // Tahap 5: Penerbangan Mode Ship Gelombang 2 (90 tiles)
      'S' +
      GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) +
      GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) +
      // Tahap 6: Sprint Akhir Cube ke Garis Finish (50 tiles)
      'C' +
      G(10) + 'X' + G(8) + 'XX' + G(10) + 'X' + G(20)
  },
  {
    id: 'normal',
    number: 2,
    name: 'NEON STEPS',
    difficulty: 'NORMAL',
    icon: '\u25A0',
    color: '#ffe45c',
    secColor: '#f59e0b',
    bgTheme: 'sunset', // Synthwave Sunset & Pegunungan Retro
    speed: 5.4,
    audioFile: null,
    defaultMode: 'cube',
    // 750 Tiles (~92.6 Detik @ 60 FPS)
    pattern:
      // Tahap 1: Tangga Ritmik & Duri Tanah (140 tiles)
      G(16) + 'X' + G(10) + 'XX' + G(10) + 'X' + G(12) +
      GAP(1) + B(3) + GAP(1) + G(10) + 'XX' + G(12) +
      GAP(1) + M(3) + GAP(1) + G(10) + 'X' + G(12) +
      GAP(1) + B(2) + GAP(1) + M(2) + GAP(1) + G(12) + 'XX' + G(10) +
      // Tahap 2: Platform Melayang Ganda & Hanging Spikes (150 tiles)
      GAP(1) + B(3) + GAP(1) + M(3) + GAP(1) + H(3) + GAP(1) + G(12) +
      V(2) + G(10) + 'XX' + G(12) +
      GAP(1) + M(3) + GAP(1) + G(10) + 'X' + G(12) +
      GAP(1) + B(3) + GAP(1) + G(10) + 'XX' + G(12) +
      V(2) + G(10) + 'X' + G(12) +
      // Tahap 3: Penerbangan Ship Cavern Gelombang 1 (150 tiles)
      'S' +
      GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) +
      GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) +
      GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) +
      // Tahap 4: Platforming Menengah & Lompatan Jurang (140 tiles)
      'C' +
      G(12) + 'XX' + G(10) + 'X' + G(10) +
      GAP(1) + B(3) + GAP(1) + M(3) + GAP(1) + G(10) +
      'XX' + G(10) + 'X' + G(12) +
      GAP(1) + H(3) + GAP(1) + G(10) +
      V(2) + G(10) + 'XX' + G(12) +
      // Tahap 5: Penerbangan Ship Cavern Gelombang 2 (110 tiles)
      'S' +
      GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) +
      GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) +
      // Tahap 6: Sprint Akhir Synthwave Cube (60 tiles)
      'C' +
      G(10) + 'XX' + G(8) + 'X' + G(10) + 'XX' + G(8) + 'X' + G(22)
  },
  {
    id: 'hard',
    number: 3,
    name: 'SKY MACHINE',
    difficulty: 'HARD',
    icon: '\u{1F680}',
    color: '#39ff88',
    secColor: '#10b981',
    bgTheme: 'nebula', // Nebula Kosmik Hijau Emerald & Stasiun Orbital
    speed: 5.9,
    audioFile: null,
    defaultMode: 'cube',
    // 820 Tiles (~92.65 Detik @ 60 FPS)
    pattern:
      // Tahap 1: Orbital Entrance Cube (150 tiles)
      G(16) + 'X' + G(10) + 'XX' + G(10) + 'X' + G(12) +
      GAP(1) + B(3) + GAP(1) + G(10) + 'XX' + G(12) +
      GAP(1) + M(3) + GAP(1) + G(10) + 'X' + G(12) +
      GAP(1) + B(2) + GAP(1) + M(2) + GAP(1) + H(2) + GAP(1) + G(12) +
      'XX' + G(10) + 'X' + G(12) +
      // Tahap 2: Orbital Flight Wave 1 (160 tiles)
      'S' +
      GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) +
      GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) +
      GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) +
      // Tahap 3: Mid Station High Platforming (160 tiles)
      'C' +
      G(12) + 'XX' + G(10) + 'X' + G(10) +
      GAP(1) + M(3) + GAP(1) + G(10) +
      V(2) + G(10) + 'XX' + G(12) +
      GAP(1) + B(3) + GAP(1) + M(3) + GAP(1) + H(3) + GAP(1) + G(10) +
      'XX' + G(10) + 'X' + G(12) +
      V(2) + G(10) + 'X' + G(12) +
      // Tahap 4: Orbital Flight Wave 2 (160 tiles)
      'S' +
      GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) +
      GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) +
      GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) +
      // Tahap 5: Rapid Station Platforming (120 tiles)
      'C' +
      G(10) + 'XX' + G(8) + 'X' + G(10) +
      GAP(1) + M(3) + GAP(1) + G(10) +
      V(2) + G(10) + 'XX' + G(10) +
      GAP(1) + B(3) + GAP(1) + G(12) +
      // Tahap 6: Final Orbital Dash (70 tiles)
      G(10) + 'XX' + G(8) + 'X' + G(10) + 'XX' + G(8) + 'X' + G(24)
  },
  {
    id: 'harder',
    number: 4,
    name: 'COSMIC PULSE',
    difficulty: 'HARDER',
    icon: '\u{1F6F8}',
    color: '#ff683b',
    secColor: '#f97316',
    bgTheme: 'galaxy', // Galaksi Deep Space & Planet Bercincin Ungu
    speed: 6.3,
    audioFile: null,
    defaultMode: 'cube',
    // 880 Tiles (~93.12 Detik @ 60 FPS)
    pattern:
      // Tahap 1: Deep Space Entrance Cube (150 tiles)
      G(16) + 'X' + G(10) + 'XX' + G(10) + 'X' + G(12) +
      GAP(1) + B(3) + GAP(1) + G(10) + 'XX' + G(12) +
      GAP(1) + M(3) + GAP(1) + G(10) + 'X' + G(12) +
      GAP(1) + B(2) + GAP(1) + M(2) + GAP(1) + H(2) + GAP(1) + G(12) +
      'XX' + G(10) + 'X' + G(12) +
      // Tahap 2: UFO Flap Gateway Section 1 (170 tiles)
      'F' +
      GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) +
      GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) +
      GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) +
      // Tahap 3: Mid Cosmic Platform Hop (160 tiles)
      'C' +
      G(12) + 'XX' + G(10) + 'X' + G(10) +
      GAP(1) + M(3) + GAP(1) + G(10) +
      V(2) + G(10) + 'XX' + G(12) +
      GAP(1) + B(3) + GAP(1) + M(3) + GAP(1) + H(3) + GAP(1) + G(10) +
      'XX' + G(10) + 'X' + G(12) +
      V(2) + G(10) + 'X' + G(12) +
      // Tahap 4: UFO Flap Gateway Section 2 (170 tiles)
      'F' +
      GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) +
      GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) +
      GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) +
      // Tahap 5: High Velocity Cosmic Cube (150 tiles)
      'C' +
      G(10) + 'XX' + G(8) + 'X' + G(10) +
      GAP(1) + M(3) + GAP(1) + G(10) +
      V(2) + G(10) + 'XX' + G(10) +
      GAP(1) + B(3) + GAP(1) + M(3) + GAP(1) + G(10) +
      'XX' + G(10) + 'X' + G(12) +
      // Tahap 6: Galaxy Beacon Finale (80 tiles)
      G(10) + 'XX' + G(8) + 'X' + G(10) + 'XX' + G(8) + 'X' + G(28)
  },
  {
    id: 'insane',
    number: 5,
    name: 'FACTORY OVERHEAT',
    difficulty: 'INSANE',
    icon: '\u26A1',
    color: '#ff2a55',
    secColor: '#f43f5e',
    bgTheme: 'magma', // Pabrik Vulkanik Magma & Pipa Uap Membara
    speed: 6.4, // NERFED: Kecepatan 6.4 (adil, seimbang, dan 100% winnable)
    audioFile: null,
    defaultMode: 'cube',
    // 900 Tiles (~93.75 Detik @ 60 FPS)
    pattern:
      // Tahap 1: Industrial Lava Entrance (150 tiles)
      G(16) + 'XX' + G(10) + 'X' + G(10) + 'XX' + G(12) +
      GAP(1) + B(3) + GAP(1) + G(10) + 'XX' + G(12) +
      GAP(1) + M(3) + GAP(1) + G(10) + 'X' + G(12) +
      GAP(1) + B(2) + GAP(1) + M(2) + GAP(1) + H(2) + GAP(1) + G(12) +
      'XX' + G(10) + 'X' + G(12) +
      // Tahap 2: Steam Tunnel Ship Flight (170 tiles) - Koridor lapang 6 tiles
      'S' +
      GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) +
      GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) +
      GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) +
      // Tahap 3: Industrial Platforms & Steam Hazards (160 tiles)
      'C' +
      G(12) + 'XX' + G(10) + 'X' + G(10) +
      GAP(1) + M(3) + GAP(1) + G(10) +
      V(2) + G(10) + 'XX' + G(12) +
      GAP(1) + B(3) + GAP(1) + M(3) + GAP(1) + H(3) + GAP(1) + G(10) +
      'XX' + G(10) + 'X' + G(12) +
      V(2) + G(10) + 'X' + G(12) +
      // Tahap 4: UFO Reactor Chamber Navigation (170 tiles) - Ritme 3-hop stabil
      'F' +
      GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) +
      GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) +
      GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) +
      // Tahap 5: Core Overload Platform Hop (160 tiles)
      'C' +
      G(10) + 'XX' + G(8) + 'X' + G(10) +
      GAP(1) + M(3) + GAP(1) + G(10) +
      V(2) + G(10) + 'XX' + G(10) +
      GAP(1) + B(3) + GAP(1) + M(3) + GAP(1) + G(10) +
      'XX' + G(10) + 'X' + G(12) +
      // Tahap 6: Factory Escape Sprint (90 tiles)
      G(10) + 'XX' + G(8) + 'X' + G(10) + 'XX' + G(8) + 'XX' + G(8) + 'X' + G(30)
  },
  {
    id: 'demon',
    number: 6,
    name: 'DEMON OVERDRIVE',
    difficulty: 'DEMON',
    icon: '\u2620',
    color: '#8b5cf6',
    secColor: '#a855f7',
    bgTheme: 'void', // Dimensi Abyss Demon & Kristal Mengambang
    speed: 6.8, // NERFED: Kecepatan 6.8 (kecepatan adil, presisi tinggi tanpa frustasi)
    audioFile: null,
    defaultMode: 'cube',
    // 950 Tiles (~93.14 Detik @ 60 FPS)
    pattern:
      // Tahap 1: Void Abyss Entrance (160 tiles)
      G(16) + 'XX' + G(10) + 'X' + G(10) + 'XX' + G(12) +
      GAP(1) + B(3) + GAP(1) + G(10) + 'XX' + G(12) +
      GAP(1) + M(3) + GAP(1) + G(10) + 'X' + G(12) +
      GAP(1) + B(2) + GAP(1) + M(2) + GAP(1) + H(2) + GAP(1) + G(12) +
      'XX' + G(10) + 'X' + G(12) +
      // Tahap 2: Demon Flight Corridor Wave 1 (180 tiles) - Koridor gelombang lapang
      'S' +
      GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) +
      GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) +
      GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) +
      // Tahap 3: Void Floating Crystals & Hanging Hazards (170 tiles)
      'C' +
      G(12) + 'XX' + G(10) + 'X' + G(10) +
      GAP(1) + M(3) + GAP(1) + G(10) +
      V(2) + G(10) + 'XX' + G(12) +
      GAP(1) + B(3) + GAP(1) + M(3) + GAP(1) + H(3) + GAP(1) + G(10) +
      'XX' + G(10) + 'X' + G(12) +
      V(2) + G(10) + 'X' + G(12) +
      // Tahap 4: Demon Dimension UFO Gate (180 tiles)
      'F' +
      GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) +
      GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) +
      GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) +
      // Tahap 5: Climax Demon Ship Flight Wave 2 (160 tiles)
      'S' +
      GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) +
      GAP(6) + H(2) + GAP(6) + B(2) + GAP(6) + H(2) + GAP(6) + B(2) +
      GAP(6) +
      // Tahap 6: Grand Champion Victory Run (100 tiles)
      'C' +
      G(10) + 'XX' + G(8) + 'X' + G(10) + 'XX' + G(8) + 'X' + G(10) + 'XX' + G(8) + 'X' + G(32)
  }
];

/* ==========================================================================
   2. STORAGE MANAGER (LocalStorage - Semua Level Terbuka Default)
   ========================================================================== */
class StorageManager {
  constructor() {
    this.KEY = 'cube_runner_save_v1';
    this.data = this._load();
  }

  // Struktur default: Seluruh level 1–6 terbuka (true)
  _defaultData() {
    return {
      bestProgress: { easy: 0, normal: 0, hard: 0, harder: 0, insane: 0, demon: 0 },
      attempts: { easy: 0, normal: 0, hard: 0, harder: 0, insane: 0, demon: 0 },
      unlocked: { easy: true, normal: true, hard: true, harder: true, insane: true, demon: true },
      totalAttempts: 0,
    };
  }

  // Muat data dari browser LocalStorage
  _load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return this._defaultData();
      const parsed = JSON.parse(raw);
      const defaults = this._defaultData();
      return {
        bestProgress: Object.assign(defaults.bestProgress, parsed.bestProgress || {}),
        attempts: Object.assign(defaults.attempts, parsed.attempts || {}),
        unlocked: Object.assign(defaults.unlocked, parsed.unlocked || {}),
        totalAttempts: typeof parsed.totalAttempts === 'number' ? parsed.totalAttempts : 0,
      };
    } catch (e) {
      return this._defaultData();
    }
  }

  // Simpan data permanen ke LocalStorage
  _save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Gagal menyimpan ke LocalStorage:', e);
    }
  }

  getBest(levelId) { return this.data.bestProgress[levelId] || 0; }
  getAttempts(levelId) { return this.data.attempts[levelId] || 0; }
  isUnlocked(levelId) { return true; } // Buka semua akses level secara default
  getTotalAttempts() { return this.data.totalAttempts || 0; }

  // Periksa apakah seluruh 6 level sudah berhasil ditamatkan 100%
  isAllCompleted() {
    return ['easy', 'normal', 'hard', 'harder', 'insane', 'demon'].every(
      (id) => (this.data.bestProgress[id] || 0) >= 100
    );
  }

  // Catat setiap kali pemain menekan tombol Mulai/Retry
  registerAttempt(levelId) {
    this.data.attempts[levelId] = (this.data.attempts[levelId] || 0) + 1;
    this.data.totalAttempts = (this.data.totalAttempts || 0) + 1;
    this._save();
    return this.data.attempts[levelId];
  }

  // Perbarui rekor progress tertinggi (%)
  updateBestProgress(levelId, percent) {
    const current = this.data.bestProgress[levelId] || 0;
    if (percent > current) {
      this.data.bestProgress[levelId] = percent;
      this._save();
      return true;
    }
    return false;
  }
}

/* ==========================================================================
   3. AUDIO MANAGER (Web Audio API & HTML5 Audio Element)
   ========================================================================== */
class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.bgmAudioElement = null;
    this.isPlayingAudioFile = false;
  }

  // Mengaktifkan konteks audio setelah ada interaksi pemain (aturan browser)
  _ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Toggle Mute On/Off
  toggleMute() {
    this.muted = !this.muted;
    if (this.bgmAudioElement) {
      this.bgmAudioElement.muted = this.muted;
    }
    if (this.muted) {
      this.stopBGM();
    }
    return this.muted;
  }

  // SFX Lompat Karakter (Frekuensi Square Wave Cepat)
  playJump() {
    if (this.muted) return;
    this._ensureContext();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(340, t);
      osc.frequency.exponentialRampToValueAtTime(740, t + 0.08);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch (e) {}
  }

  // SFX UFO Flap
  playUFOHop() {
    if (this.muted) return;
    this._ensureContext();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.exponentialRampToValueAtTime(900, t + 0.09);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    } catch (e) {}
  }

  // SFX Portal Warp
  playPortal() {
    if (this.muted) return;
    this._ensureContext();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.2);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch (e) {}
  }

  // SFX Hancur / Tabrakan (White Noise + Descending Pitch)
  playDeath() {
    if (this.muted) return;
    this._ensureContext();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.25;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.24, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      noise.connect(nGain).connect(this.ctx.destination);
      noise.start(t);

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.35);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.38);
    } catch (e) {}
  }

  // SFX Level Complete
  playVictory() {
    if (this.muted) return;
    this._ensureContext();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, i) => {
        const t = this.ctx.currentTime + i * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.14, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      });
    } catch (e) {}
  }

  playClick() {
    if (this.muted) return;
    this._ensureContext();
    if (!this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {}
  }

  // Memulai Background Music (Level 1 mengambil ./assets/level1.mp3, level lain via Web Audio API)
  startBGM(levelConfig) {
    if (this.muted) return;
    this.stopBGM();
    this._ensureContext();

    if (levelConfig && levelConfig.audioFile) {
      try {
        if (!this.bgmAudioElement) {
          this.bgmAudioElement = new Audio();
          this.bgmAudioElement.loop = true;
        }
        this.bgmAudioElement.src = levelConfig.audioFile;
        this.bgmAudioElement.currentTime = 0;
        this.bgmAudioElement.volume = 0.55;
        this.bgmAudioElement.muted = this.muted;

        const playPromise = this.bgmAudioElement.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              this.isPlayingAudioFile = true;
            })
            .catch(() => {
              this._startSyntheticBGM(levelConfig);
            });
          return;
        }
      } catch (err) {
        console.warn('Gagal memuat file audio, beralih ke Synth BGM:', err);
      }
    }

    this._startSyntheticBGM(levelConfig);
  }

  _startSyntheticBGM(levelConfig) {
    if (!this.ctx || this.muted) return;
    this.isPlayingAudioFile = false;

    const speed = levelConfig?.speed || 5;
    const baseFreq = levelConfig?.number === 6 ? 110 : levelConfig?.number === 5 ? 123.47 : 130.81;
    const chords = [
      [baseFreq, baseFreq * 1.5, baseFreq * 2],
      [baseFreq * 1.2, baseFreq * 1.6, baseFreq * 2.4],
      [baseFreq * 1.33, baseFreq * 1.8, baseFreq * 2.66],
      [baseFreq * 1.5, baseFreq * 2, baseFreq * 3],
    ];

    const stepTime = Math.max(110, 200 - speed * 11);
    this.bgmStep = 0;

    const playStep = () => {
      if (this.muted || !this.ctx || this.ctx.state === 'suspended') return;
      const t = this.ctx.currentTime;
      const chord = chords[Math.floor(this.bgmStep / 8) % chords.length];
      const noteFreq = chord[this.bgmStep % chord.length];

      // Lead Synth Melodis
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(noteFreq * 2, t);
      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);

      // Bass Drone Rhythm
      if (this.bgmStep % 4 === 0) {
        const bass = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bass.type = 'sawtooth';
        bass.frequency.setValueAtTime(chord[0], t);
        bGain.gain.setValueAtTime(0.06, t);
        bGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        bass.connect(bGain).connect(this.ctx.destination);
        bass.start(t);
        bass.stop(t + 0.45);
      }

      this.bgmStep++;
    };

    playStep();
    this.bgmTimer = setInterval(playStep, stepTime);
  }

  stopBGM() {
    if (this.bgmAudioElement) {
      try {
        this.bgmAudioElement.pause();
        this.bgmAudioElement.currentTime = 0;
      } catch (e) {}
    }
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.isPlayingAudioFile = false;
  }
}

/* ==========================================================================
   4. PARTICLE SYSTEM (Efek Visual Partikel & Semburan Api Roket)
   ========================================================================== */
class Particle {
  constructor(x, y, vx, vy, color, life, size, shape = 'square') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.shape = shape;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1;
    this.life--;
  }

  get alpha() { return Math.max(0, this.life / this.maxLife); }
  get dead() { return this.life <= 0; }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // Jejak bercahaya di belakang kubus
  spawnTrail(x, y, color) {
    this.particles.push(
      new Particle(
        x, y,
        -1.8 - Math.random() * 1.5,
        (Math.random() - 0.5) * 1.4,
        color, 18, 3 + Math.random() * 2
      )
    );
  }

  // Semburan api roket realistis untuk Mode Ship
  spawnShipThruster(x, y) {
    const colors = ['#ff8c00', '#ffe45c', '#ff2a55', '#00f0ff'];
    const chosen = colors[Math.floor(Math.random() * colors.length)];
    this.particles.push(
      new Particle(
        x, y,
        -5.0 - Math.random() * 3.5,
        (Math.random() - 0.5) * 2.4,
        chosen, 14, 4 + Math.random() * 3, 'circle'
      )
    );
  }

  // Efek percikan saat melompat
  spawnJumpBurst(x, y, color) {
    for (let i = 0; i < 9; i++) {
      const angle = Math.PI * 0.5 + (Math.random() - 0.5) * 1.6;
      const speed = 1.6 + Math.random() * 3;
      this.particles.push(
        new Particle(
          x, y,
          Math.cos(angle) * speed, Math.sin(angle) * speed,
          color, 18, 2.5 + Math.random() * 2.5
        )
      );
    }
  }

  // Percikan radial saat menabrak portal transformasi
  spawnPortalSparks(x, y, color) {
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5.5;
      this.particles.push(
        new Particle(
          x, y,
          Math.cos(angle) * speed, Math.sin(angle) * speed,
          color, 26, 3 + Math.random() * 3, 'circle'
        )
      );
    }
  }

  // Ledakan berkeping-keping saat menabrak duri/balok
  spawnExplosion(x, y, color) {
    for (let i = 0; i < 36; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      this.particles.push(
        new Particle(
          x, y,
          Math.cos(angle) * speed, Math.sin(angle) * speed,
          color, 38 + Math.random() * 25, 3 + Math.random() * 4
        )
      );
    }
  }

  update() {
    this.particles.forEach((p) => p.update());
    this.particles = this.particles.filter((p) => !p.dead);
  }

  draw(ctx) {
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.restore();
    });
  }

  clear() {
    this.particles = [];
  }
}

/* ==========================================================================
   5. BACKGROUND RENDERER (Render Background Tematik Artistik 6 Level)
   ========================================================================== */
class BackgroundRenderer {
  static draw(ctx, theme, cameraX, themeColor, secColor) {
    const W = CONFIG.CANVAS_W;
    const H = CONFIG.CANVAS_H;

    ctx.save();

    if (theme === 'city') {
      // LEVEL 1: Cyberpunk City Skyline Malam Hari
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#060714');
      skyGrad.addColorStop(0.6, '#0f1026');
      skyGrad.addColorStop(1, '#1b1236');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Bintang-bintang di langit
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 30; i++) {
        const sx = ((i * 67 + cameraX * 0.05) % W + W) % W;
        const sy = (i * 29) % 180;
        const sSize = (i % 3) + 1;
        ctx.globalAlpha = 0.4 + (Math.sin(Date.now() * 0.003 + i) * 0.3);
        ctx.fillRect(sx, sy, sSize, sSize);
      }

      // Siluet Gedung Pencakar Langit Jauh (Parallax Lambat)
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#14142b';
      const cityFarOffset = (cameraX * 0.15) % 120;
      for (let x = -cityFarOffset - 120; x < W + 120; x += 60) {
        const bH = 90 + ((Math.abs(Math.sin(x * 12)) * 80));
        ctx.fillRect(x, CONFIG.GROUND_Y - bH, 50, bH);
      }

      // Siluet Gedung Dekat dengan Jendela Neon (Parallax Sedang)
      ctx.globalAlpha = 0.75;
      const cityNearOffset = (cameraX * 0.35) % 160;
      for (let x = -cityNearOffset - 160; x < W + 160; x += 80) {
        const bH = 60 + ((Math.abs(Math.sin(x * 45)) * 70));
        ctx.fillStyle = '#1b1b38';
        ctx.fillRect(x, CONFIG.GROUND_Y - bH, 68, bH);

        // Jendela Neon Bercahaya
        ctx.fillStyle = themeColor;
        ctx.shadowColor = themeColor;
        ctx.shadowBlur = 4;
        for (let wy = CONFIG.GROUND_Y - bH + 12; wy < CONFIG.GROUND_Y - 10; wy += 16) {
          ctx.fillRect(x + 10, wy, 8, 8);
          ctx.fillRect(x + 28, wy, 8, 8);
          ctx.fillRect(x + 46, wy, 8, 8);
        }
        ctx.shadowBlur = 0;
      }
    } else if (theme === 'sunset') {
      // LEVEL 2: Synthwave Retro Sunset & Siluet Pegunungan
      const sunsetGrad = ctx.createLinearGradient(0, 0, 0, H);
      sunsetGrad.addColorStop(0, '#1a052e');
      sunsetGrad.addColorStop(0.4, '#4d0a3d');
      sunsetGrad.addColorStop(0.7, '#a32035');
      sunsetGrad.addColorStop(1, '#e66810');
      ctx.fillStyle = sunsetGrad;
      ctx.fillRect(0, 0, W, H);

      // Matahari Retro Raksasa Bergaris
      const sunX = W * 0.5;
      const sunY = 170;
      const sunR = 75;
      const sunGrad = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY + sunR);
      sunGrad.addColorStop(0, '#fff44d');
      sunGrad.addColorStop(1, '#ff2ee6');
      ctx.fillStyle = sunGrad;
      ctx.shadowColor = '#ff8c00';
      ctx.shadowBlur = 35;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Garis horizontal potong matahari khas Synthwave
      ctx.fillStyle = '#4d0a3d';
      for (let y = sunY - 10; y < sunY + sunR; y += 14) {
        const lineH = 3 + (y - sunY) * 0.08;
        ctx.fillRect(sunX - sunR, y, sunR * 2, lineH);
      }

      // Siluet Pegunungan Bergerak (Parallax)
      ctx.fillStyle = '#180424';
      ctx.beginPath();
      ctx.moveTo(0, CONFIG.GROUND_Y);
      const mOffset = (cameraX * 0.2) % W;
      for (let x = 0; x <= W + 40; x += 40) {
        const my = CONFIG.GROUND_Y - 40 - Math.abs(Math.sin((x + mOffset) * 0.015)) * 65;
        ctx.lineTo(x, my);
      }
      ctx.lineTo(W, CONFIG.GROUND_Y);
      ctx.closePath();
      ctx.fill();
    } else if (theme === 'nebula') {
      // LEVEL 3: Nebula Kosmik Hijau Emerald & Stasiun Luar Angkasa
      const nebGrad = ctx.createRadialGradient(W * 0.3, H * 0.4, 20, W * 0.5, H * 0.5, W * 0.8);
      nebGrad.addColorStop(0, '#0a2e1d');
      nebGrad.addColorStop(0.5, '#051710');
      nebGrad.addColorStop(1, '#020806');
      ctx.fillStyle = nebGrad;
      ctx.fillRect(0, 0, W, H);

      // Awan Nebula Emerald
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#00ff88';
      ctx.filter = 'blur(40px)';
      ctx.beginPath();
      ctx.arc(W * 0.35, 140, 120, 0, Math.PI * 2);
      ctx.arc(W * 0.75, 180, 140, 0, Math.PI * 2);
      ctx.fill();
      ctx.filter = 'none';
      ctx.globalAlpha = 1.0;

      // Stasiun Orbital Geometris
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
      ctx.lineWidth = 2;
      const orbX = ((W * 0.8 - cameraX * 0.08) % W + W) % W;
      ctx.strokeRect(orbX - 25, 60, 50, 50);
      ctx.beginPath();
      ctx.arc(orbX, 85, 40, 0, Math.PI * 2);
      ctx.stroke();
    } else if (theme === 'galaxy') {
      // LEVEL 4: Galaksi Deep Space & Planet Bercincin Ungu
      const galGrad = ctx.createLinearGradient(0, 0, 0, H);
      galGrad.addColorStop(0, '#08031a');
      galGrad.addColorStop(0.6, '#180738');
      galGrad.addColorStop(1, '#2d0a4e');
      ctx.fillStyle = galGrad;
      ctx.fillRect(0, 0, W, H);

      // Planet Bercincin Spektakuler
      const px = ((W * 0.25 - cameraX * 0.06) % W + W) % W;
      const py = 120;
      ctx.save();
      ctx.fillStyle = '#9b30ff';
      ctx.shadowColor = '#b84dff';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(px, py, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Cincin Planet
      ctx.strokeStyle = 'rgba(255, 104, 235, 0.75)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(px, py, 80, 18, -Math.PI / 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (theme === 'magma') {
      // LEVEL 5: Pabrik Vulkanik Magma & Pipa Industri
      const magGrad = ctx.createLinearGradient(0, 0, 0, H);
      magGrad.addColorStop(0, '#1f0404');
      magGrad.addColorStop(0.5, '#400909');
      magGrad.addColorStop(1, '#661406');
      ctx.fillStyle = magGrad;
      ctx.fillRect(0, 0, W, H);

      // Pipa & Rangka Pabrik Siluet
      ctx.strokeStyle = '#2b0707';
      ctx.lineWidth = 8;
      const facOffset = (cameraX * 0.25) % 100;
      for (let x = -facOffset; x < W + 100; x += 90) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CONFIG.GROUND_Y);
        ctx.stroke();
        ctx.strokeRect(x - 20, 80, 40, 40);
      }

      // Percikan Bara Api Magma Mengambang
      ctx.fillStyle = '#ff8c00';
      for (let i = 0; i < 20; i++) {
        const fx = ((i * 43 + cameraX * 0.15) % W + W) % W;
        const fy = 100 + (Math.sin(Date.now() * 0.002 + i) * 60);
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.005 + i) * 0.4;
        ctx.fillRect(fx, fy, 4, 4);
      }
    } else {
      // LEVEL 6: Dimensi Abyss Demon & Kristal Mengambang
      const voidGrad = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W);
      voidGrad.addColorStop(0, '#260438');
      voidGrad.addColorStop(0.6, '#10011c');
      voidGrad.addColorStop(1, '#05000a');
      ctx.fillStyle = voidGrad;
      ctx.fillRect(0, 0, W, H);

      // Kristal Dimensi Melayang
      ctx.fillStyle = 'rgba(168, 107, 255, 0.3)';
      ctx.strokeStyle = '#a86bff';
      ctx.lineWidth = 1.5;
      const cryOffset = (cameraX * 0.18) % 140;
      for (let x = -cryOffset; x < W + 140; x += 110) {
        const cy = 130 + Math.sin(x + Date.now() * 0.002) * 45;
        ctx.beginPath();
        ctx.moveTo(x, cy - 25);
        ctx.lineTo(x + 15, cy);
        ctx.lineTo(x, cy + 25);
        ctx.lineTo(x - 15, cy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // Grid Lantai Perspektif Cyberpunk Bergerak
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 1.5;
    const gridOffset = (cameraX * 0.4) % 60;
    for (let x = -gridOffset; x < W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    ctx.restore();
  }
}

/* ==========================================================================
   6. LEVEL BUILDER (Penerjemah Pola Menjadi Objek Render & Kolisi)
   ========================================================================== */
class LevelBuilder {
  static build(levelConfig) {
    const pattern = levelConfig.pattern;
    const speed = levelConfig.speed;
    const TILE = CONFIG.TILE;
    const ROWS = 10;
    const cols = pattern.length;

    const GROUND_ROW = ROWS - 1; // y: 360 (Row 9 - Lantai)
    const BLOCK_ROW = ROWS - 4;  // y: 240 (Row 6 - Balok Bawah)
    const MID_ROW = ROWS - 5;    // y: 200 (Row 5 - Balok Tengah)
    const HIGH_ROW = ROWS - 7;   // y: 120 (Row 3 - Balok Atas)
    const CEILING_ROW = 0;       // y: 0 (Row 0 - Atap Langit-langit)

    const groundRects = [];
    const blockRects = [];
    const spikeRects = [];
    const portals = [];

    const matrix = [];
    for (let r = 0; r < ROWS; r++) matrix.push(new Array(cols).fill(0));

    // DURI DI SEMUA ATAP (Full Continuous Ceiling Spikes):
    // Seluruh langit-langit (Row 0) memiliki balok atap solid dan (Row 1) duri gantung tajam
    for (let c = 0; c < cols; c++) {
      matrix[0][c] = 1; // Balok atap solid
      matrix[1][c] = 3; // Duri gantung di sepanjang langit-langit
    }

    for (let c = 0; c < cols; c++) {
      const ch = pattern[c];
      if (ch === 'G') {
        matrix[GROUND_ROW][c] = 1;
      } else if (ch === 'X') {
        matrix[GROUND_ROW][c] = 1;
        matrix[GROUND_ROW - 1][c] = 2; // Spike di atas lantai
      } else if (ch === 'U') {
        // Ceiling Spike menunjuk ke bawah dari atap
        matrix[0][c] = 1;
        matrix[1][c] = 3;
      } else if (ch === 'W') {
        // Struktur balok langit-langit (Ceiling Roof)
        matrix[0][c] = 1;
      } else if (ch === 'K') {
        // Balok langit-langit tebal ganda
        matrix[0][c] = 1;
        matrix[1][c] = 1;
      } else if (ch === 'B') {
        matrix[BLOCK_ROW][c] = 1; // Balok bawah
      } else if (ch === 'M') {
        matrix[MID_ROW][c] = 1;   // Balok tengah
      } else if (ch === 'H') {
        matrix[HIGH_ROW][c] = 1;  // Balok atas
      } else if (ch === 'V') {
        matrix[HIGH_ROW][c] = 1;  // Balok atas
        matrix[HIGH_ROW + 1][c] = 3; // Duri gantung di bawah balok atas
      } else if (ch === 'T') {
        matrix[HIGH_ROW][c] = 1;  // Balok ganda atas
        matrix[BLOCK_ROW][c] = 1; // Balok ganda bawah
      } else if (ch === 'D') {
        matrix[HIGH_ROW][c] = 1;
        matrix[HIGH_ROW - 1][c] = 2; // Spike di atas balok atas
      } else if (ch === 'E') {
        matrix[MID_ROW][c] = 1;
        matrix[MID_ROW - 1][c] = 2; // Spike di atas balok tengah
      } else if (ch === 'S' || ch === 'P') {
        // Portal Ship
        matrix[GROUND_ROW][c] = 1;
        portals.push({ x: c * TILE, y: 130, type: 'ship', w: 36, h: 120 });
      } else if (ch === 'C') {
        // Portal Cube
        matrix[GROUND_ROW][c] = 1;
        portals.push({ x: c * TILE, y: 130, type: 'cube', w: 36, h: 120 });
      } else if (ch === 'F') {
        // Portal UFO
        matrix[GROUND_ROW][c] = 1;
        portals.push({ x: c * TILE, y: 130, type: 'ufo', w: 36, h: 120 });
      }
    }

    // Gabungkan balok/tanah horizontal agar rendering & kalkulasi tabrakan sangat efisien
    for (let r = 0; r < ROWS; r++) {
      let runStart = -1;
      for (let c = 0; c <= cols; c++) {
        const val = matrix[r][c];
        const isSolid = val === 1;
        if (isSolid && runStart === -1) runStart = c;
        if ((!isSolid || c === cols) && runStart !== -1) {
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

    // Hitbox Duri (Hitbox adil dengan toleransi 6px)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < cols; c++) {
        if (matrix[r][c] === 2 || matrix[r][c] === 3) {
          const isCeiling = matrix[r][c] === 3;
          const pad = 6;
          spikeRects.push({
            x: c * TILE + pad,
            y: r * TILE + pad,
            w: TILE - pad * 2,
            h: TILE - pad * 2,
            drawX: c * TILE,
            drawY: r * TILE,
            isCeiling,
          });
        }
      }
    }

    return {
      config: levelConfig,
      name: levelConfig.name,
      speed,
      lengthPx: cols * TILE,
      cols,
      groundRects,
      blockRects,
      spikeRects,
      portals,
      isGapAt(colIndex) {
        if (colIndex < 0 || colIndex >= cols) return false;
        return matrix[GROUND_ROW][colIndex] === 0;
      },
    };
  }
}

/* ==========================================================================
   7. PLAYER (Karakter Multi-Gamemode dengan Animasi Rotasi Autentik GD)
   ========================================================================== */
class Player {
  constructor() {
    this.reset();
  }

  reset(initialMode = 'cube') {
    this.worldX = 0;
    this.y = CONFIG.GROUND_Y - CONFIG.PLAYER_SIZE;
    this.vy = 0;
    this.size = CONFIG.PLAYER_SIZE;
    this.mode = initialMode; // 'cube' | 'ship' | 'ufo'
    this.rotation = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.onGround = true;
    this.alive = true;
    this.isHoldingJump = false;
    this.coyoteTimer = 10;
    this.jumpBufferTimer = 0;
    this.trailTimer = 0;
  }

  getScreenRect() {
    return { x: CONFIG.PLAYER_X, y: this.y, w: this.size, h: this.size };
  }

  pressJump(audio, particles) {
    if (!this.alive) return;
    this.isHoldingJump = true;

    if (this.mode === 'cube') {
      this.jumpBufferTimer = 10;
      if (this.onGround || this.coyoteTimer > 0) {
        this._executeCubeJump(audio, particles);
      }
    } else if (this.mode === 'ufo') {
      this.vy = CONFIG.UFO_HOP_VEL;
      this.onGround = false;
      this.scaleX = 1.15;
      this.scaleY = 0.88;
      audio?.playUFOHop();
      particles?.spawnJumpBurst(CONFIG.PLAYER_X + this.size / 2, this.y + this.size, '#ffe45c');
    }
  }

  releaseJump() {
    this.isHoldingJump = false;
  }

  _executeCubeJump(audio, particles) {
    this.vy = CONFIG.CUBE_JUMP_VEL;
    this.onGround = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    // Stretch deformasi saat lompatan awal (Takeoff)
    this.scaleX = 0.84;
    this.scaleY = 1.18;
    audio?.playJump();
    particles?.spawnJumpBurst(CONFIG.PLAYER_X + this.size / 2, this.y + this.size, '#00f0ff');
  }

  land(groundTopY) {
    this.y = groundTopY - this.size;
    this.vy = 0;
    this.onGround = true;
    this.coyoteTimer = 10;

    if (this.mode === 'cube') {
      if (this.jumpBufferTimer > 0 && this.alive) {
        this._executeCubeJump(window.gameInstance?.audio, window.gameInstance?.particles);
        return;
      }
      // Snap rotasi sudut kelipatan 90 derajat (Math.PI / 2) persis seperti Geometry Dash
      this.rotation = Math.round(this.rotation / (Math.PI / 2)) * (Math.PI / 2);
      // Efek squash pendaratan elastis
      this.scaleX = 1.25;
      this.scaleY = 0.78;
    }
  }

  setMode(newMode, audio, particles) {
    if (this.mode === newMode) return;
    this.mode = newMode;
    audio?.playPortal();
    particles?.spawnPortalSparks(CONFIG.PLAYER_X + this.size / 2, this.y + this.size / 2, '#00f0ff');

    const flashEl = document.getElementById('portal-flash');
    if (flashEl) {
      flashEl.classList.remove('flash-active');
      void flashEl.offsetWidth;
      flashEl.classList.add('flash-active');
    }
  }

  update(particles) {
    if (!this.alive) return;

    if (this.mode === 'cube') {
      if (this.onGround) {
        this.coyoteTimer = 10;
        // Rebound scale ke ukuran normal secara halus saat di lantai
        this.scaleX += (1 - this.scaleX) * 0.22;
        this.scaleY += (1 - this.scaleY) * 0.22;
      } else {
        if (this.coyoteTimer > 0) this.coyoteTimer--;
        // Putaran rotasi konstan saat melompat di udara ala Geometry Dash (~8.7 derajat/frame)
        this.rotation += 0.152;
        this.scaleX += (1 - this.scaleX) * 0.12;
        this.scaleY += (1 - this.scaleY) * 0.12;
      }

      if (this.jumpBufferTimer > 0) this.jumpBufferTimer--;

      this.vy += CONFIG.CUBE_GRAVITY;
      this.y += this.vy;

      this.trailTimer++;
      if (this.trailTimer % 3 === 0) {
        particles.spawnTrail(CONFIG.PLAYER_X, this.y + this.size / 2, 'rgba(0, 240, 255, 0.6)');
      }
    } else if (this.mode === 'ship') {
      // Mode Ship: Tahan untuk naik, lepas untuk turun
      if (this.isHoldingJump) {
        this.vy += CONFIG.SHIP_THRUST;
      } else {
        this.vy += CONFIG.SHIP_GRAVITY;
      }
      this.vy = Math.max(-CONFIG.SHIP_MAX_VY, Math.min(CONFIG.SHIP_MAX_VY, this.vy));
      this.y += this.vy;

      // Pitch angle dinamis sesuai kecepatan vertikal
      this.rotation = Math.max(-0.55, Math.min(0.55, this.vy * 0.08));
      this.scaleX += (1 - this.scaleX) * 0.2;
      this.scaleY += (1 - this.scaleY) * 0.2;

      // Semburan api roket dari knalpot belakang
      particles.spawnShipThruster(CONFIG.PLAYER_X - 6, this.y + this.size / 2);
    } else if (this.mode === 'ufo') {
      this.vy += CONFIG.UFO_GRAVITY;
      this.y += this.vy;

      // Goyangan rotasi mengambang UFO
      this.rotation = Math.sin(Date.now() * 0.008) * 0.12;
      this.scaleX += (1 - this.scaleX) * 0.18;
      this.scaleY += (1 - this.scaleY) * 0.18;

      this.trailTimer++;
      if (this.trailTimer % 2 === 0) {
        particles.spawnTrail(CONFIG.PLAYER_X, this.y + this.size / 2, 'rgba(255, 244, 77, 0.7)');
      }
    }
  }

  die() {
    this.alive = false;
  }

  // DESAIN KARAKTER DENGAN ROTASI DAN DEFORMASI ELASTIS
  draw(ctx) {
    const r = this.getScreenRect();
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);
    ctx.scale(this.scaleX, this.scaleY);

    if (this.mode === 'cube') {
      // 1. DESAIN CUBE PREMIUM BARU: Dual-Layer Neon Cyber Armor
      // Bayangan luar bercahaya (Outer Glow)
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 18;

      // Badan Luar (Outer Shield)
      const grad = ctx.createLinearGradient(-r.w / 2, -r.h / 2, r.w / 2, r.h / 2);
      grad.addColorStop(0, '#00f0ff');
      grad.addColorStop(0.5, '#00aaff');
      grad.addColorStop(1, '#ff2ee6');
      ctx.fillStyle = grad;
      ctx.fillRect(-r.w / 2, -r.h / 2, r.w, r.h);

      // Border Bevel
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-r.w / 2, -r.h / 2, r.w, r.h);

      // Inti Cyber Dalam (Inner Core)
      ctx.fillStyle = '#101328';
      ctx.fillRect(-r.w / 2 + 5, -r.h / 2 + 5, r.w - 10, r.h - 10);

      // Mata / Lensa Cyberpunk Ekspresif Bercahaya
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.fillRect(-2, -6, 10, 6);
      ctx.fillRect(-2, 2, 10, 6);
      ctx.shadowBlur = 0;

      // Pupil Putih
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, -5, 3, 4);
      ctx.fillRect(4, 3, 3, 4);
    } else if (this.mode === 'ship') {
      // 2. DESAIN SHIP PREMIUM BARU: Futuristic Stealth Jet Fighter
      ctx.shadowColor = '#ff8c00';
      ctx.shadowBlur = 20;

      // Sayap & Badan Aerodinamis
      const shipGrad = ctx.createLinearGradient(-r.w / 2, -r.h / 2, r.w / 2, r.h / 2);
      shipGrad.addColorStop(0, '#ff9900');
      shipGrad.addColorStop(0.6, '#ff4400');
      shipGrad.addColorStop(1, '#ff0055');
      ctx.fillStyle = shipGrad;

      ctx.beginPath();
      ctx.moveTo(r.w / 2 + 8, 0);          // Moncong Jet Depan
      ctx.lineTo(-r.w / 2, -r.h / 2 - 2);   // Ujung Sayap Atas
      ctx.lineTo(-r.w / 2 + 6, -3);         // Rongga Knalpot Atas
      ctx.lineTo(-r.w / 2 + 2, 0);          // Knalpot Utama
      ctx.lineTo(-r.w / 2 + 6, 3);          // Rongga Knalpot Bawah
      ctx.lineTo(-r.w / 2, r.h / 2 + 2);    // Ujung Sayap Bawah
      ctx.closePath();
      ctx.fill();

      // Border Garis Neon Putih
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Cockpit Kubah Kaca Cyan Bercahaya
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(2, 0, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (this.mode === 'ufo') {
      // 3. DESAIN UFO PREMIUM BARU: Antigravity Plasma Saucer
      ctx.shadowColor = '#ffe45c';
      ctx.shadowBlur = 18;

      // Kubah Kaca Atas
      const domeGrad = ctx.createRadialGradient(0, -6, 2, 0, -6, 12);
      domeGrad.addColorStop(0, '#ffffff');
      domeGrad.addColorStop(0.6, '#00f0ff');
      domeGrad.addColorStop(1, '#0088ff');
      ctx.fillStyle = domeGrad;
      ctx.beginPath();
      ctx.arc(0, -5, 11, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      // Piringan Emas Neon
      const discGrad = ctx.createLinearGradient(-r.w / 2, 0, r.w / 2, 0);
      discGrad.addColorStop(0, '#ff9900');
      discGrad.addColorStop(0.5, '#ffe45c');
      discGrad.addColorStop(1, '#ff9900');
      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.ellipse(0, 4, r.w / 2 + 6, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 3 Lampu Indikator Energi Berputar
      const lightPhase = Date.now() * 0.006;
      ctx.fillStyle = '#ff2ee6';
      ctx.shadowColor = '#ff2ee6';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(-10 + Math.sin(lightPhase) * 2, 4, 3, 0, Math.PI * 2);
      ctx.arc(0, 5, 3.5, 0, Math.PI * 2);
      ctx.arc(10 - Math.sin(lightPhase) * 2, 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

/* ==========================================================================
   8. GAME ENGINE (State Machine, Loop Utama, Collision & UI Controller)
   ========================================================================== */
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.storage = new StorageManager();
    this.audio = new AudioManager();
    this.particles = new ParticleSystem();
    this.player = new Player();

    this.state = 'menu'; // 'menu' | 'playing' | 'paused' | 'gameover' | 'victory'
    this.currentLevelConfig = null;
    this.level = null;
    this.cameraX = 0;
    this.currentAttemptNumber = 1;
    this.carouselIndex = 0;

    this._initLevelCarousel();
    this._bindUI();
    this._bindInput();
    this._refreshStats();

    requestAnimationFrame(this._loop.bind(this));
  }

  /* ---------------- INISIALISASI CAROUSEL LEVEL ---------------- */
  _initLevelCarousel() {
    const track = document.getElementById('level-carousel-track');
    const dots = document.getElementById('carousel-dots');
    if (!track) return;

    track.innerHTML = '';
    if (dots) dots.innerHTML = '';

    LEVELS.forEach((lvl, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'gd-level-card';
      card.dataset.index = index;
      card.dataset.id = lvl.id;

      card.innerHTML = `
        <div class="gd-card-glow" style="background: radial-gradient(circle, ${lvl.color}33, transparent 70%);"></div>
        <div class="gd-card-icon" style="color:${lvl.color}; border-color:${lvl.color}44; box-shadow: 0 0 20px ${lvl.color}33;">
          ${lvl.icon}
        </div>
        <div class="gd-card-number">LEVEL ${lvl.number}</div>
        <div class="gd-card-name">${lvl.name}</div>
        <div class="gd-card-mode-tag">TEMA: ${lvl.bgTheme.toUpperCase()} • MODE: ${lvl.defaultMode.toUpperCase()}</div>
        <div class="gd-card-difficulty diff-${lvl.difficulty.toLowerCase()}">${lvl.difficulty}</div>
        <div class="gd-card-stats">
          <span>REKOR <b id="card-best-${lvl.id}">0%</b></span>
          <span>PERCOBAAN <b id="card-attempt-${lvl.id}">0</b></span>
        </div>
        <div class="gd-card-action">MAIN SEKARANG ▶</div>
      `;

      card.addEventListener('click', () => {
        this.startLevel(lvl.id);
      });

      track.appendChild(card);

      if (dots) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Level ${lvl.number}`);
        dot.addEventListener('click', () => this.goToCarousel(index));
        dots.appendChild(dot);
      }
    });

    document.getElementById('btn-carousel-prev')?.addEventListener('click', () => {
      this.goToCarousel(this.carouselIndex - 1);
    });

    document.getElementById('btn-carousel-next')?.addEventListener('click', () => {
      this.goToCarousel(this.carouselIndex + 1);
    });

    this._updateCarouselUI();
  }

  goToCarousel(index) {
    this.carouselIndex = (index + LEVELS.length) % LEVELS.length;
    this._updateCarouselUI();
    this.audio.playClick();
  }

  _updateCarouselUI() {
    const track = document.getElementById('level-carousel-track');
    const dots = document.querySelectorAll('#carousel-dots .carousel-dot');
    if (track) {
      track.style.transform = `translateX(-${this.carouselIndex * 100}%)`;
    }
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === this.carouselIndex);
    });
  }

  /* ---------------- UI EVENT BINDINGS ---------------- */
  _bindUI() {
    document.getElementById('btn-pause')?.addEventListener('click', () => this.pauseGame());
    document.getElementById('btn-resume')?.addEventListener('click', () => this.resumeGame());
    document.getElementById('btn-pause-menu')?.addEventListener('click', () => this.goToMenu());

    document.getElementById('btn-retry')?.addEventListener('click', () => {
      if (this.currentLevelConfig) this.startLevel(this.currentLevelConfig.id);
    });
    document.getElementById('btn-gohome')?.addEventListener('click', () => this.goToMenu());

    document.getElementById('btn-next')?.addEventListener('click', () => {
      const currIdx = LEVELS.findIndex((l) => l.id === this.currentLevelConfig?.id);
      if (currIdx !== -1 && currIdx < LEVELS.length - 1) {
        this.startLevel(LEVELS[currIdx + 1].id);
      } else {
        this.goToMenu();
      }
    });
    document.getElementById('btn-victory-home')?.addEventListener('click', () => this.goToMenu());

    document.getElementById('mute-toggle')?.addEventListener('click', (e) => {
      const muted = this.audio.toggleMute();
      e.target.textContent = muted ? '🔇 SOUND OFF' : '🔊 SOUND ON';
    });
  }

  /* ---------------- INPUT MANAGEMENT (Keyboard & Touch) ---------------- */
  _bindInput() {
    const handleJumpStart = (e) => {
      if (e?.target?.closest('button') || e?.target?.closest('input')) return;
      if (this.state === 'playing') {
        if (e && e.cancelable) e.preventDefault();
        this.player.pressJump(this.audio, this.particles);
      }
    };

    const handleJumpEnd = (e) => {
      if (e?.target?.closest('button')) return;
      if (this.state === 'playing') {
        if (e && e.cancelable) e.preventDefault();
        this.player.releaseJump();
      }
    };

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (!e.repeat) handleJumpStart(e);
      }
      if (e.code === 'Escape' && this.state === 'playing') {
        this.pauseGame();
      }
    }, { passive: false });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        handleJumpEnd(e);
      }
    }, { passive: false });

    this.canvas.addEventListener('pointerdown', handleJumpStart, { passive: false });
    window.addEventListener('pointerup', handleJumpEnd, { passive: false });
    window.addEventListener('pointercancel', handleJumpEnd, { passive: false });

    // Swipe Mobile pada Menu Selector
    const viewport = document.getElementById('level-carousel-viewport');
    if (viewport) {
      let touchStartX = 0;
      viewport.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
      }, { passive: true });

      viewport.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchEndX - touchStartX;
        if (Math.abs(diff) > 40) {
          this.goToCarousel(this.carouselIndex + (diff < 0 ? 1 : -1));
        }
      }, { passive: true });
    }
  }

  /* ---------------- STATE MANAGEMENT ---------------- */
  showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
  }

  goToMenu() {
    this.state = 'menu';
    this.audio.stopBGM();
    document.getElementById('pause-overlay')?.classList.add('hidden');
    this._refreshStats();
    this.showScreen('menu-screen');
  }

  startLevel(levelId) {
    const config = LEVELS.find((l) => l.id === levelId) || LEVELS[0];
    this.currentLevelConfig = config;
    this.level = LevelBuilder.build(config);

    this.player.reset(config.defaultMode);
    this.particles.clear();
    this.cameraX = 0;

    this.currentAttemptNumber = this.storage.registerAttempt(config.id);

    // Update HUD
    const titleEl = document.getElementById('hud-level-title');
    if (titleEl) titleEl.textContent = `LVL ${config.number}: ${config.name}`;

    const badgeEl = document.getElementById('attempt-badge');
    if (badgeEl) badgeEl.textContent = `Attempt #${this.currentAttemptNumber}`;

    this._updateModeHUD();

    const progressFill = document.getElementById('progress-fill');
    if (progressFill) progressFill.style.width = '0%';
    const progressPercent = document.getElementById('progress-percent');
    if (progressPercent) progressPercent.textContent = '0%';

    document.getElementById('pause-overlay')?.classList.add('hidden');

    this.state = 'playing';
    this.audio.startBGM(config);
    this.showScreen('game-screen');
  }

  pauseGame() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.audio.stopBGM();
    document.getElementById('pause-overlay')?.classList.remove('hidden');
  }

  resumeGame() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.audio.startBGM(this.currentLevelConfig);
    document.getElementById('pause-overlay')?.classList.add('hidden');
  }

  triggerGameOver() {
    this.state = 'gameover';
    this.audio.stopBGM();
    this.audio.playDeath();
    this.particles.spawnExplosion(
      CONFIG.PLAYER_X + this.player.size / 2,
      this.player.y + this.player.size / 2,
      this.currentLevelConfig?.secColor || '#ff2ee6'
    );

    const percent = this.getProgressPercent();
    this.storage.updateBestProgress(this.currentLevelConfig.id, percent);

    setTimeout(() => {
      document.getElementById('go-percent').textContent = `${percent}%`;
      document.getElementById('go-attempt').textContent = `#${this.currentAttemptNumber}`;
      document.getElementById('go-best').textContent = `${this.storage.getBest(this.currentLevelConfig.id)}%`;
      this.showScreen('gameover-screen');
    }, 450);
  }

  triggerVictory() {
    this.state = 'victory';
    this.audio.stopBGM();
    this.audio.playVictory();
    this.storage.updateBestProgress(this.currentLevelConfig.id, 100);

    document.getElementById('win-attempt').textContent = `#${this.currentAttemptNumber}`;
    this.showScreen('victory-screen');
  }

  _updateModeHUD() {
    const badge = document.getElementById('hud-mode-badge');
    if (!badge) return;
    badge.className = `mode-badge mode-${this.player.mode}`;
    const icon = this.player.mode === 'ship' ? '\u{1F680}' : this.player.mode === 'ufo' ? '\u{1F6F8}' : '\u25A0';
    badge.innerHTML = `<span class="mode-icon">${icon}</span> <span class="mode-text">${this.player.mode.toUpperCase()}</span>`;
  }

  _refreshStats() {
    LEVELS.forEach((lvl) => {
      const bestEl = document.getElementById(`card-best-${lvl.id}`);
      const attEl = document.getElementById(`card-attempt-${lvl.id}`);
      if (bestEl) bestEl.textContent = `${this.storage.getBest(lvl.id)}%`;
      if (attEl) attEl.textContent = this.storage.getAttempts(lvl.id);
    });

    const totalEl = document.getElementById('stat-total-attempts');
    if (totalEl) totalEl.textContent = this.storage.getTotalAttempts();
  }

  getProgressPercent() {
    if (!this.level || this.level.lengthPx <= 0) return 0;
    const pct = (this.player.worldX / this.level.lengthPx) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  /* ---------------- DETEKSI TABRAKAN & PORTAL WARP ---------------- */
  checkCollisions() {
    const p = this.player;
    const playerRect = {
      x: p.worldX,
      y: p.y,
      w: p.size,
      h: p.size,
    };

    const rectsOverlap = (a, b) =>
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

    // 1. Cek Portal Warp
    for (const portal of this.level.portals) {
      if (rectsOverlap(playerRect, portal)) {
        if (p.mode !== portal.type) {
          p.setMode(portal.type, this.audio, this.particles);
          this._updateModeHUD();
        }
      }
    }

    // 2. Cek Duri (Bawah & Atas)
    for (const spike of this.level.spikeRects) {
      if (rectsOverlap(playerRect, spike)) {
        p.die();
        return;
      }
    }

    // 3. Batas Langit-Langit & Lantai Mode Ship
    if (p.mode === 'ship') {
      if (p.y <= CONFIG.CEILING_Y) {
        p.y = CONFIG.CEILING_Y;
        p.vy = 0;
      }
      if (p.y + p.size >= CONFIG.GROUND_Y) {
        p.y = CONFIG.GROUND_Y - p.size;
        p.vy = 0;
      }
    }

    // 4. Cek Balok & Tanah Solid
    const allSolids = [...this.level.groundRects, ...this.level.blockRects];
    let landedOnSomething = false;

    for (const rect of allSolids) {
      if (!rectsOverlap(playerRect, rect)) continue;

      const prevBottom = playerRect.y + playerRect.h - p.vy;
      const fallingOntoTop = p.vy >= 0 && prevBottom <= rect.y + 7;

      if (fallingOntoTop) {
        p.land(rect.y);
        landedOnSomething = true;
      } else {
        // Tabrakan fatal samping balok
        p.die();
        return;
      }
    }

    // Cek jatuh ke jurang
    if (!landedOnSomething && p.y + p.size >= CONFIG.CANVAS_H) {
      p.die();
    }
  }

  /* ---------------- UPDATE & RENDER LOOP ---------------- */
  update() {
    if (this.state !== 'playing') return;

    const p = this.player;
    p.worldX += this.level.speed;
    this.cameraX = p.worldX - CONFIG.PLAYER_X;

    p.update(this.particles);
    this.checkCollisions();

    if (!p.alive) {
      this.triggerGameOver();
      return;
    }

    // Update Progress Bar
    const percent = this.getProgressPercent();
    const fillEl = document.getElementById('progress-fill');
    const pctEl = document.getElementById('progress-percent');
    if (fillEl) fillEl.style.width = `${percent}%`;
    if (pctEl) pctEl.textContent = `${percent}%`;

    // Cek Garis Finish
    if (p.worldX >= this.level.lengthPx) {
      this.triggerVictory();
    }
  }

  // DESAIN BARU: Rendering Dunia & Rintangan Futuristik
  drawWorld() {
    const ctx = this.ctx;
    const themeColor = this.currentLevelConfig?.color || '#00f0ff';
    const secColor = this.currentLevelConfig?.secColor || '#ff2ee6';

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    // 1. DESAIN TANAH BARU: Cyber Grid Metal Floor
    this.level.groundRects.forEach((r) => {
      const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      grad.addColorStop(0, '#1c1b30');
      grad.addColorStop(1, '#090814');
      ctx.fillStyle = grad;
      ctx.fillRect(r.x, r.y, r.w, r.h);

      // Garis Neon Glow Atas Lantai
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = themeColor;
      ctx.shadowBlur = 10;
      ctx.strokeRect(r.x, r.y, r.w, 2);
      ctx.shadowBlur = 0;

      // Garis Pola Grid Vertikal di Lantai
      ctx.strokeStyle = `${themeColor}33`;
      ctx.lineWidth = 1;
      for (let gx = r.x; gx < r.x + r.w; gx += CONFIG.TILE) {
        ctx.beginPath();
        ctx.moveTo(gx, r.y);
        ctx.lineTo(gx, r.y + r.h);
        ctx.stroke();
      }
    });

    // 2. DESAIN BALOK BARU: Holographic High-Tech Circuit Platform
    this.level.blockRects.forEach((r) => {
      // Body Balok Metal Gelap
      const bGrad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
      bGrad.addColorStop(0, '#242042');
      bGrad.addColorStop(1, '#110e24');
      ctx.fillStyle = bGrad;
      ctx.fillRect(r.x, r.y, r.w, r.h);

      // Border Neon Bercahaya
      ctx.strokeStyle = secColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = secColor;
      ctx.shadowBlur = 8;
      ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      ctx.shadowBlur = 0;

      // Sirkuit Neon Inti Tengah
      ctx.fillStyle = `${secColor}28`;
      ctx.fillRect(r.x + 6, r.y + 6, r.w - 12, r.h - 12);
      ctx.strokeStyle = `${secColor}77`;
      ctx.strokeRect(r.x + 8, r.y + 8, r.w - 16, r.h - 16);
    });

    // 3. DESAIN PORTAL BARU: Spinning Quantum Warp Gate
    this.level.portals.forEach((pt) => {
      const pColor = pt.type === 'ship' ? '#ff8c00' : pt.type === 'ufo' ? '#ffe45c' : '#00f0ff';
      ctx.save();
      ctx.strokeStyle = pColor;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = pColor;
      ctx.shadowBlur = 22;

      // Bingkai Portal Kapsul Melengkung
      ctx.strokeRect(pt.x, pt.y, pt.w, pt.h);

      // Vortex Cahaya Partikel di Dalam Portal
      const vGrad = ctx.createLinearGradient(pt.x, pt.y, pt.x + pt.w, pt.y + pt.h);
      vGrad.addColorStop(0, `${pColor}44`);
      vGrad.addColorStop(0.5, `${pColor}11`);
      vGrad.addColorStop(1, `${pColor}44`);
      ctx.fillStyle = vGrad;
      ctx.fillRect(pt.x, pt.y, pt.w, pt.h);

      // Icon Gamemode di Tengah Portal
      ctx.fillStyle = '#ffffff';
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      const pIcon = pt.type === 'ship' ? '\u{1F680}' : pt.type === 'ufo' ? '\u{1F6F8}' : '\u25A0';
      ctx.fillText(pIcon, pt.x + pt.w / 2, pt.y + pt.h / 2 + 8);
      ctx.restore();
    });

    // 4. DESAIN DURI BARU: Glowing Crystal Neon Spikes
    this.level.spikeRects.forEach((s) => {
      const baseX = s.drawX;
      const baseY = s.isCeiling ? s.drawY : s.drawY + CONFIG.TILE;
      const tipY = s.isCeiling ? s.drawY + CONFIG.TILE - 6 : s.drawY + 6;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(baseX + 4, baseY);
      ctx.lineTo(baseX + CONFIG.TILE / 2, tipY);
      ctx.lineTo(baseX + CONFIG.TILE - 4, baseY);
      ctx.closePath();

      // Gradien Kristal Duri
      const sGrad = ctx.createLinearGradient(baseX, baseY, baseX, tipY);
      sGrad.addColorStop(0, secColor);
      sGrad.addColorStop(1, '#ffffff');
      ctx.fillStyle = sGrad;
      ctx.shadowColor = secColor;
      ctx.shadowBlur = 14;
      ctx.fill();

      // Highlight Garis Putih Tajam di Ujung
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Inti Garis Tengah Kristal
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(baseX + CONFIG.TILE / 2, baseY);
      ctx.lineTo(baseX + CONFIG.TILE / 2, tipY);
      ctx.stroke();
      ctx.restore();
    });

    // 5. DESAIN FINISH GATE BARU: Giant Rainbow Energy Beacon
    const finishX = this.level.lengthPx;
    ctx.save();
    const finGrad = ctx.createLinearGradient(finishX, 0, finishX + 12, 0);
    finGrad.addColorStop(0, '#fff44d');
    finGrad.addColorStop(0.5, '#00f0ff');
    finGrad.addColorStop(1, '#ff2ee6');
    ctx.fillStyle = finGrad;
    ctx.shadowColor = '#fff44d';
    ctx.shadowBlur = 25;
    ctx.fillRect(finishX, 0, 10, CONFIG.CANVAS_H);

    // Banner Finish Teks
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FINISH', finishX + 5, 50);
    ctx.restore();

    ctx.restore();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CONFIG.CANVAS_W, CONFIG.CANVAS_H);

    // Render Background Tematik Dinamis (City, Sunset, Nebula, Galaxy, Magma, Void)
    const theme = this.currentLevelConfig?.bgTheme || 'city';
    const themeColor = this.currentLevelConfig?.color || '#00f0ff';
    const secColor = this.currentLevelConfig?.secColor || '#ff2ee6';
    BackgroundRenderer.draw(ctx, theme, this.cameraX, themeColor, secColor);

    if (this.state === 'playing' || this.state === 'paused') {
      this.drawWorld();

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
   BOOTSTRAP (Inisialisasi Saat Dokumen Siap)
   ========================================================================== */
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new Game();
});
