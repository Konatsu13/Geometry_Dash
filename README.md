# 🔷 Syntax Runner - Geometry Dash Web Clone

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

**Syntax Runner** is a 2D web-based rhythm runner game inspired by the classic mechanics of *Geometry Dash*. Built entirely using vanilla web technologies (HTML, CSS, and JavaScript), it runs natively in any modern web browser without external frameworks or game engines.

This project was developed as part of the **Web Programming (MK3-B)** course assignment at SMK Telkom Purwokerto.

---

## 🚀 Key Features

- **2D Physics & Player Mechanics**: Dynamic cube physics with realistic gravity calculations and a smooth 90° rotation animation upon jumping.
- **Level System**:
  - 🟢 **Easy Level**: Slower game speed with single, spaced-out spike obstacles.
  - 🔴 **Normal Level**: Faster pace featuring double spikes and elevated block platforms (Locked until Level 1 is completed).
- **Real-Time Progress Tracking**: Live percentage bar (0% - 100%) and an automatic **Attempt Counter**.
- **Data Persistence (LocalStorage)**:
  - Saves the highest progress percentage achieved per level.
  - Automatically handles level unlocking state.
  - Tracks cumulative death and attempt statistics.
- **Audio & Visual Effects**: Integrated Web Audio SFX (jump & death sounds), looping background music (BGM), and particle effects upon jumping or crashing.
- **Precise Collision Detection**: A bounding-box system distinguishing between landing safely on platform blocks and hitting dangerous spikes.

---

## 🛠️ Tech Stack

- **HTML5**: Markup structure and the core `<canvas>` rendering context.
- **CSS3**: Cyberpunk/neon visual styling, UI modals, and responsive layout scaling.
- **JavaScript (ES6+)**: Game loop state management (`requestAnimationFrame`), physics engine, collision detection, Web Audio API, and LocalStorage management.

---

## 📁 Project Structure

```text
syntax-runner/
│
├── index.html          # Main entry point and UI overlay elements
├── style.css           # Global layout, cyberpunk aesthetics, and typography
├── script.js           # Core game engine, canvas rendering, and local storage logic
└── assets/             # Project media assets
    ├── jump.mp3        # Jump sound effect
    ├── hit.mp3         # Death/Game Over sound effect
    └── bgm.mp3         # Background music loop
