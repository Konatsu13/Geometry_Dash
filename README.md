# 🔷 Syntax Runner - Geometry Dash Web Clone

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

**Syntax Runner** adalah proyek game 2D berbasis web yang terinspirasi dari mekanisme permainan *Geometry Dash*. Dibuat secara penuh menggunakan teknologi dasar web (Vanilla HTML, CSS, dan JavaScript) tanpa bantuan *framework* atau *engine* eksternal.

Proyek ini dikembangkan sebagai bagian dari tugas mata pelajaran **Pemrograman Website (MK3-B)** di SMK Telkom Purwokerto.

---

## 🚀 Fitur Utama

- **Karakter & Fisika 2D**: Pergerakan kubus dinamis dengan perhitungan gravitasi dan animasi rotasi 90° setiap melompat.
- **Sistem Level**:
  - 🟢 **Easy**: Kecepatan lambat dengan rintangan duri tunggal.
  - 🔴 **Normal**: Kecepatan lebih tinggi dengan variasi duri ganda dan balok pijakan (terkunci hingga level Easy tamat).
- **Indikator Progres Real-Time**: Bar persentase (0% - 100%) dan penghitung percobaaan (*Attempt Counter*).
- **Penyimpanan Lokal (LocalStorage)**:
  - Menyimpan rekor persentase tertinggi tiap level.
  - Menyimpan status pembukaan level (*unlocked levels*).
  - Akumulasi jumlah kematian/percobaan pemain.
- **Efek Audio & Visual**: Efek suara (*Jump* & *Death SFX*), musik latar (*BGM*), serta efek partikel saat kubus melompat atau menabrak rintangan.
- **Deteksi Tabrakan (Collision Detection)**: Logika presisi untuk membedakan mendarat di atas balok atau menabrak rintangan.

---

## 🛠️ Teknologi yang Digunakan

- **HTML5**: Struktur UI dan wadah grafis elemen `<canvas>`.
- **CSS3**: Styling antarmuka (*UI/UX*) bergaya neon/cyberpunk dan responsivitas layar.
- **JavaScript (ES6+)**: Logika game loop (`requestAnimationFrame`), fisika canvas, collision detection, Web Audio API, dan manipulasi LocalStorage.

---

## 📁 Struktur Folder Proyek

```text
syntax-runner/
│
├── index.html          # Halaman utama & struktur UI modal
├── style.css           # Styling tampilan, font, & layout
├── script.js           # Logika utama game engine & LocalStorage
└── assets/             # Folder aset pendukung (gambar/suara)
    ├── jump.mp3        # Efek suara melompat
    ├── hit.mp3         # Efek suara saat game over
    └── bgm.mp3         # Musik latar permainan
