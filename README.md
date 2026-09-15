# ⬛ Cube Runner - Neon Cyberpunk Dash

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

**Cube Runner** adalah game rhythm runner platformer 2D berbasis web yang terinspirasi oleh mekanik *Geometry Dash*. Dibangun murni menggunakan teknologi web modern vanilla (HTML5 Canvas, CSS3 Glassmorphism, dan JavaScript ES6+) tanpa framework/engine eksternal.

---

## 🚀 Fitur Utama

- **Multi-Gamemode Mechanics (Geometry Dash Style)**:
  - ⬛ **Cube Mode**: Gravitasi responsif, rotasi flip 90°, coyote time, dan jump buffering.
  - 🚀 **Ship / Fly Mode**: Tahan lompat/klik untuk terbang naik dengan akselerasi propulsi, efek semburan api roket, dan rotasi pitch dinamis.
  - 🛸 **UFO Mode**: Mengepak di udara (*mid-air pulse hop*) untuk menavigasi terowongan rintangan sempit.
  - 🌀 **Warp Portals**: Gerbang portal bercahaya yang mentransformasi mode karakter secara instan di dalam level.
- **6 Level Unik & Akses Terbuka Default**:
  1. 🟢 **Level 1: Stereo Start** (Easy) — Audio BGM dari file `./assets/level1.mp3`.
  2. 🟡 **Level 2: Neon Steps** (Normal) — Platform bertingkat dan lompatan ritmis.
  3. 🟢 **Level 3: Sky Machine** (Hard) — Pengenalan mode Ship (Fly) menembus lorong langit.
  4. 🟠 **Level 4: Cosmic Pulse** (Harder) — Mode UFO & manuver lompat udara.
  5. 🔴 **Level 5: Factory Overheat** (Insane) — Tantangan berkecepatan tinggi multi-mode.
  6. 🟣 **Level 6: Demon Overdrive** (Demon) — Ujian pamungkas refleks dan presisi ekstrem.
- **UI/UX Cyberpunk Glassmorphism Spektakuler**:
  - Carousel Level interaktif dengan efek 3D Card glow & swipe gesture.
  - HUD In-Game dinamis (Progress bar neon, Attempt counter, Indikator Gamemode aktif).
  - Modal Pause, Crash Game Over, dan Level Complete Victory yang memukau.
  - Semantik `<footer>` copyright modern.
- **Sistem Audio Canggih**:
  - Integrasi berkas `./assets/level1.mp3` untuk Level 1.
  - Multi-track Synthwave Web Audio synthesizer dinamis untuk Level 2–6.
  - SFX lompat, ledakan, portal warp, kemenangan, dan toggle Sound Mute.
- **Penyimpanan Lokal (LocalStorage)**:
  - Menyimpan rekor persentase (Best Record) dan jumlah percobaan (Attempts) per level secara permanen.

---

## 🎮 Kontrol Game

- **Lompat / Terbang**: `[SPACE]`, `[PANAH ATAS]`, `[W]`, atau `[KLIK MOUSE]` / `[SENTUH LAYAR]`
- **Pause**: `[ESC]` atau tombol pause ⏸ di HUD
- **Navigasi Level**: Tombol panah ‹ ›, swipe layar, atau klik langsung kartu level

---

## 📁 Struktur Berkas

```text
Geometry_Dash/
│
├── index.html          # Markup antarmuka, canvas, HUD, dan modal
├── style.css           # Tema Cyberpunk Neon, Glassmorphism, dan tata letak responsif
├── script.js           # Engine game terpadu (Fisika, Level Builder, Audio, Partikel, Kolisi)
└── assets/
    └── level1.mp3      # Audio musik latar Level 1
```

---

© 2026 Cube Runner. Built with Vanilla JS & HTML5 Canvas.
