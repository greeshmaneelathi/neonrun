# NeonRun 🎮

A cyberpunk infinite platformer built with **Phaser 3** and vanilla JavaScript.

## Features
- Procedurally generated infinite levels
- Double jump mechanics
- Enemy stomp system
- Coin collection
- Difficulty scaling (speed increases over time)
- Particle effects & camera shake
- High score saved to localStorage
- Cyberpunk neon aesthetic

## Tech Stack
- **Phaser 3** — game engine
- **HTML5 Canvas** — rendering
- **Vanilla JS (ES Modules)** — no build step needed
- **Vercel / GitHub Pages** — free hosting

---

## 🚀 Running Locally

You need a local server (browsers block ES modules from `file://`).

### Option A: VS Code Live Server (easiest)
1. Install the **Live Server** extension in VS Code
2. Right-click `index.html` → **Open with Live Server**
3. Game opens at `http://localhost:5500`

### Option B: Python
```bash
cd neonrun
python3 -m http.server 8080
# Open http://localhost:8080
```

### Option C: Node.js
```bash
npx serve .
# Open the URL it shows
```

---

## 🌐 Deploying to GitHub Pages (free, live URL)

1. Create a GitHub account at https://github.com
2. Create a new repository called `neonrun`
3. Upload all files (drag & drop in GitHub's web UI, or use git):
```bash
git init
git add .
git commit -m "Initial NeonRun game"
git remote add origin https://github.com/YOUR_USERNAME/neonrun.git
git push -u origin main
```
4. Go to **Settings → Pages → Source → main branch → / (root)**
5. Your game is live at: `https://YOUR_USERNAME.github.io/neonrun`

---

## 🌐 Deploying to Vercel (even easier)

1. Go to https://vercel.com and sign up with GitHub
2. Click **New Project → Import** your `neonrun` repo
3. Click **Deploy** — done!
4. You get a URL like: `https://neonrun-yourname.vercel.app`

---

## 📁 Project Structure

```
neonrun/
├── index.html              # Entry point
├── assets/
│   └── css/
│       └── style.css       # Global styles
└── js/
    ├── main.js             # Phaser config & init
    ├── scenes/
    │   ├── BootScene.js    # Asset generation
    │   ├── MenuScene.js    # Title screen
    │   ├── GameScene.js    # Core game loop
    │   ├── UIScene.js      # HUD overlay
    │   └── GameOverScene.js # Death screen
    └── objects/
        ├── Player.js       # Player physics & input
        └── LevelGenerator.js # Procedural level gen
```

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| ← → or A D | Move left/right |
| ↑ or W or Space | Jump |
| Jump again (mid-air) | Double jump |
| Stomp on enemy | +3 points |

---

## 🔮 Next Steps (Phase 2)

- [ ] Add Supabase leaderboard (online high scores)
- [ ] Sound effects & background music
- [ ] Power-ups (shield, magnet, speed boost)
- [ ] Mobile touch controls
- [ ] Multiple themed worlds
- [ ] Share score on social media

---

## Resume Description

> **NeonRun** — Infinite Platformer  
> Built with Phaser 3 and vanilla JavaScript. Features procedural level generation, arcade physics, double-jump mechanics, and a particle system. Deployed to [yoururl.com].  
> *Stack: JavaScript (ES Modules), Phaser 3, HTML5 Canvas, GitHub Pages*
