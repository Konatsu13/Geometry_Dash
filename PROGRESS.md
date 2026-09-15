# PROGRESS.md — Geometry Rush (Geometry Dash Clone)


## Version 1.0.0 (Fathan)

Dokumen ini mencatat perkembangan pengerjaan proyek clone "Geometry Dash" berbasis Vanilla HTML5, CSS3, dan JavaScript (ES6+).

---

### 1. Status Umum

| Item | Status |
|---|---|
| Struktur project (3 file) | ✅ Selesai |
| Player mechanics (gravitasi, lompat, rotasi) | ✅ Selesai |
| Sistem 2 Level (Easy & Normal) | ✅ Selesai |
| Collision detection (ground, spike, block, jurang) | ✅ Selesai |
| Progress bar (%) & Attempt counter | ✅ Selesai |
| LocalStorage (best score, unlock, attempts) | ✅ Selesai |
| Audio sintetis (jump, death, victory, BGM) | ✅ Selesai |
| Efek visual (trail & partikel ledakan) | ✅ Selesai |
| UI (Menu, In-Game, Game Over, Victory, Pause) | ✅ Selesai |
| Testing manual di browser | ⏳ Belum dilakukan (perlu QA pemain) |
| Level tambahan / editor level | ⏹️ Belum dikerjakan |

---

### 2. File yang Dihasilkan

```
/index.html   -> Struktur UI: menu, canvas game, modal game over/victory/pause
/style.css    -> Tema visual Cyberpunk/Neon, layout responsif, animasi tombol
/script.js    -> Seluruh logika game (physics, collision, level, audio, storage)
```

Semua file berjalan langsung di browser tanpa build tool, tanpa dependency eksternal, dan tanpa file audio/gambar tambahan (audio dibuat sintetis via Web Audio API).

---

### 3. Rincian Arsitektur `script.js`

Kode dipecah menjadi 7 modul berbasis `class` agar mudah dipelajari dan dikembangkan lebih lanjut:

1. **`StorageManager`** — baca/tulis data ke `localStorage` (key: `geometry_rush_save_v1`). Menyimpan `bestProgress`, `attempts`, `unlocked`, `totalAttempts`.
2. **`AudioManager`** — menghasilkan semua suara secara sintetis pakai `OscillatorNode` & `AudioBuffer` (noise), termasuk BGM synthwave loop via `setInterval`.
3. **`ParticleSystem`** + `Particle` — mengelola efek trail dan ledakan partikel.
4. **`LevelBuilder`** — mengubah pola string level (`'G'`, `'X'`, `'.'`, `'B'`) menjadi **matrix 2D** lalu menghasilkan rect ground/spike/block siap pakai untuk render & collision.
5. **`Player`** — physics (gravitasi, kecepatan lompat), animasi rotasi 90° yang smooth, serta rendering kubus neon.
6. **`Game`** — game loop utama (`requestAnimationFrame`), state machine (`menu` → `playing` → `paused`/`gameover`/`victory`), collision detection, dan sinkronisasi ke DOM/UI.
7. **Bootstrap** — inisialisasi `Game` saat `DOMContentLoaded`.

---

### 4. Detail Level

- **Level 1 (Easy)** — kecepatan `4.4px/frame`, hanya duri tunggal (`X`) berjarak jauh, tidak ada jurang/platform.
- **Level 2 (Normal)** — kecepatan `6.2px/frame`, kombinasi duri ganda (`XX`), jurang (`.`), dan platform melayang (`B`/`BB`/`BBB`) yang menuntut timing lompat presisi.
- Level 2 terkunci secara default dan otomatis terbuka ketika pemain mencapai **100% di Level 1** (disimpan permanen di LocalStorage).

---

### 5. Known Limitations / Catatan Pengembangan Selanjutnya

- Belum ada dukungan untuk lompat ganda (double jump) atau mode gravitasi terbalik seperti pada Geometry Dash asli.
- Level masih statis (hardcoded pattern), belum ada level editor visual.
- Ukuran canvas tetap `800x400` yang di-scale via CSS (`aspect-ratio`) — belum diuji ekstensif di semua ukuran layar mobile.
- Belum ada unit test otomatis; verifikasi collision & progress bar dilakukan secara manual saat development.
- BGM masih berupa pola arpeggio sederhana; bisa dikembangkan jadi komposisi synthwave yang lebih kompleks (multi-track).

---

## 6. Saran Langkah Berikutnya

1. Uji coba manual end-to-end di browser (desktop & mobile) untuk memverifikasi feel jump/gravity dan hitbox duri.
2. Tambahkan Level 3 (Hard) jika dibutuhkan, menggunakan pola karakter yang sama (`G`/`X`/`.`/`B`) di `LevelBuilder`.
3. Pertimbangkan menambahkan efek screen-shake singkat saat game over untuk memperkuat impact.
4. Jika akan dikumpulkan sebagai tugas sekolah, tambahkan komentar/README singkat yang menjelaskan cara menjalankan (`buka index.html di browser`).
