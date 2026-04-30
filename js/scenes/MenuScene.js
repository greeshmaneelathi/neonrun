import { THEMES, THEME_ORDER } from '../themes/ThemeConfig.js';
import { sound } from '../SoundManager.js';
import { fetchLeaderboard } from '../supabase.js';

export default class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.W = W; this.H = H;
    this.selectedTheme = localStorage.getItem('neonrun_theme') || 'neon';
    this._buildBg();
    this.mainLayer    = this.add.container(0, 0).setDepth(2);
    this.overlayLayer = this.add.container(0, 0).setDepth(3);
    this._buildMain();
    this.cameras.main.fadeIn(500);
  }

  _buildBg() {
    const W = this.W, H = this.H;
    const theme = THEMES[this.selectedTheme];
    const col = Phaser.Display.Color.HexStringToColor(theme.hudColor).color;

    this.add.image(W/2, H/2, 'bg_far').setScrollFactor(0).setDepth(0);
    this.add.image(W/2, H/2, 'bg_city').setScrollFactor(0).setAlpha(0.55).setDepth(0);

    // Ambient drifting particles
    this._menuParticles = this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: W }, y: { min: H + 10, max: H + 10 },
      speedX: { min: -12, max: 12 }, speedY: { min: -60, max: -30 },
      scale: { start: 0.5, end: 0 },
      tint: [col, Phaser.Display.Color.HexStringToColor(theme.accentColor).color],
      alpha: { start: 0.5, end: 0 },
      lifespan: { min: 3000, max: 5000 },
      quantity: 1, frequency: 160,
    }).setScrollFactor(0).setDepth(1);

    this.add.image(W/2, H/2, 'scanlines').setScrollFactor(0).setAlpha(0.15).setDepth(10);
  }

  // ── Button factory — ENTIRE pill is interactive ────────────────────
  // Returns { bg, label } — bg is a Zone that covers the whole pill
  _makeBtn(container, x, y, label, color, callback, w = 220, h = 38) {
    const col = Phaser.Display.Color.HexStringToColor(color).color;
    const r = h / 2;

    // Background graphics
    const bg = this.add.graphics();
    const _draw = (hover) => {
      bg.clear();
      bg.fillStyle(col, hover ? 0.3 : 0.12);
      bg.fillRoundedRect(x - w/2, y - h/2, w, h, r);
      bg.lineStyle(hover ? 2 : 1.5, col, hover ? 1 : 0.55);
      bg.strokeRoundedRect(x - w/2, y - h/2, w, h, r);
    };
    _draw(false);

    const txt = this.add.text(x, y, label, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '13px',
      color,
      letterSpacing: 2,
    }).setOrigin(0.5);

    // Invisible zone covers the FULL pill — this is what receives input
    const zone = this.add.zone(x - w/2, y - h/2, w, h)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerover', () => {
      _draw(true);
      this.tweens.add({ targets: txt, scaleX: 1.06, scaleY: 1.06, duration: 80, ease: 'Power1' });
      sound.hover();
    });
    zone.on('pointerout', () => {
      _draw(false);
      this.tweens.add({ targets: txt, scaleX: 1, scaleY: 1, duration: 80, ease: 'Power1' });
    });
    zone.on('pointerdown', () => {
      this.tweens.add({ targets: txt, scaleX: 0.94, scaleY: 0.94, duration: 60, yoyo: true, ease: 'Power1' });
      sound.select();
      callback();
    });

    container.add([bg, txt, zone]);
    return { bg, txt, zone };
  }

  _clearOverlay() {
    this.overlayLayer.removeAll(true);
    this.mainLayer.setVisible(true);
    this.input.keyboard.removeAllListeners('keydown-SPACE');
    this.input.keyboard.removeAllListeners('keydown-ENTER');
    this.input.keyboard.removeAllListeners('keydown-ESC');
    this.input.keyboard.once('keydown-SPACE', () => this._startGame());
    this.input.keyboard.once('keydown-ENTER', () => this._startGame());
  }

  // ── Main menu ─────────────────────────────────────────────────────
  _buildMain() {
    const W = this.W, H = this.H;
    this.mainLayer.removeAll(true);
    const theme = THEMES[this.selectedTheme];
    const hInt = Phaser.Display.Color.HexStringToColor(theme.hudColor).color;
    const aInt = Phaser.Display.Color.HexStringToColor(theme.accentColor).color;

    // ── Glassmorphism panel ──────────────────────────────────────────
    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.52);
    panel.fillRoundedRect(W/2 - 210, 22, 420, 408, 20);
    panel.lineStyle(1.5, hInt, 0.35);
    panel.strokeRoundedRect(W/2 - 210, 22, 420, 408, 20);
    // Inner glow top
    panel.lineStyle(1, hInt, 0.12);
    panel.strokeRoundedRect(W/2 - 207, 25, 414, 402, 18);
    this.mainLayer.add(panel);

    // ── Animated title ───────────────────────────────────────────────
    const t1 = this.add.text(W/2, 95, 'NEON', {
      fontFamily: 'Orbitron, monospace', fontSize: '76px', fontStyle: 'bold',
      color: theme.hudColor,
      shadow: { offsetX: 0, offsetY: 0, color: theme.hudColor, blur: 50, fill: true }
    }).setOrigin(0.5);
    this.tweens.add({ targets: t1, y: { from: 93, to: 98 }, duration: 2200,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const t2 = this.add.text(W/2, 168, 'RUN', {
      fontFamily: 'Orbitron, monospace', fontSize: '76px', fontStyle: 'bold',
      color: theme.accentColor,
      shadow: { offsetX: 0, offsetY: 0, color: theme.accentColor, blur: 50, fill: true }
    }).setOrigin(0.5);
    this.tweens.add({ targets: t2, y: { from: 170, to: 165 }, duration: 2200,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 300 });

    // Divider line
    const div = this.add.graphics();
    div.lineStyle(1, hInt, 0.2);
    div.lineBetween(W/2 - 140, 222, W/2 + 140, 222);
    this.mainLayer.add(div);

    // Tagline with typing flicker
    const tagline = this.add.text(W/2, 238, 'OUTRUN · OUTLAST · OUTSCORE', {
      fontFamily: 'Share Tech Mono, monospace', fontSize: '11px',
      color: theme.hudColor, letterSpacing: 2, alpha: 0.6
    }).setOrigin(0.5);
    this.tweens.add({ targets: tagline, alpha: { from: 0.4, to: 0.8 },
      duration: 1600, yoyo: true, repeat: -1 });

    // World badge
    const badge = this.add.text(W/2, 258, `${theme.icon}  ${theme.name}`, {
      fontFamily: 'Share Tech Mono, monospace', fontSize: '12px',
      color: theme.accentColor, letterSpacing: 3
    }).setOrigin(0.5);

    this.mainLayer.add([t1, t2, tagline, badge]);

    // ── Buttons ──────────────────────────────────────────────────────
    this._makeBtn(this.mainLayer, W/2, 296, 'PLAY',          '#ffee00', () => this._startGame(), 200, 42);
    this._makeBtn(this.mainLayer, W/2, 346, 'SELECT WORLD',  theme.hudColor,    () => this._showThemeSelect(), 200, 38);
    this._makeBtn(this.mainLayer, W/2, 392, 'HIGH SCORES',   theme.accentColor, () => this._showHighScores(), 200, 38);

    // Best score
    const best = localStorage.getItem('neonrun_best') || 0;
    const bestTxt = this.add.text(W/2, 422, `BEST  ${best}`, {
      fontFamily: 'Share Tech Mono, monospace', fontSize: '11px',
      color: '#ffee00', alpha: 0.55
    }).setOrigin(0.5);
    this.mainLayer.add(bestTxt);

    // ── Sound toggle top-right ────────────────────────────────────────
    const soundBtn = this._makIconBtn(this.mainLayer, W - 28, 28,
      sound.enabled ? '🔊' : '🔇',
      () => { const on = sound.toggle(); soundBtn.label.setText(on ? '🔊' : '🔇'); }
    );

    this.input.keyboard.removeAllListeners('keydown-SPACE');
    this.input.keyboard.removeAllListeners('keydown-ENTER');
    this.input.keyboard.once('keydown-SPACE', () => this._startGame());
    this.input.keyboard.once('keydown-ENTER', () => this._startGame());
  }

  // ── Icon button (circle pill) ─────────────────────────────────────
  _makIconBtn(container, x, y, icon, callback) {
    const r = 18;
    const bg = this.add.graphics();
    const _draw = (hover) => {
      bg.clear();
      bg.fillStyle(0xffffff, hover ? 0.18 : 0.08);
      bg.fillCircle(x, y, r);
      bg.lineStyle(1.5, 0xffffff, hover ? 0.7 : 0.3);
      bg.strokeCircle(x, y, r);
    };
    _draw(false);

    const label = this.add.text(x, y, icon, { fontSize: '16px' }).setOrigin(0.5);
    const zone = this.add.zone(x - r, y - r, r*2, r*2).setOrigin(0).setInteractive({ useHandCursor: true });

    zone.on('pointerover', () => { _draw(true); this.tweens.add({ targets: label, scaleX:1.15, scaleY:1.15, duration:80 }); sound.hover(); });
    zone.on('pointerout',  () => { _draw(false); this.tweens.add({ targets: label, scaleX:1, scaleY:1, duration:80 }); });
    zone.on('pointerdown', () => { sound.select(); callback(); });

    container.add([bg, label, zone]);
    return { bg, label, zone };
  }

  _startGame() {
    localStorage.setItem('neonrun_theme', this.selectedTheme);
    if (this._menuParticles) { try { this._menuParticles.destroy(); } catch(e){} }
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', { theme: this.selectedTheme });
      this.scene.start('UIScene',   { theme: this.selectedTheme });
      this.scene.stop('MenuScene');
    });
  }

  // ── World select overlay ──────────────────────────────────────────
  _showThemeSelect() {
    const W = this.W, H = this.H;
    this.mainLayer.setVisible(false);
    this.overlayLayer.removeAll(true);

    // Backdrop
    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.88);
    dim.fillRect(0, 0, W, H);
    this.overlayLayer.add(dim);

    this.overlayLayer.add(this.add.text(W/2, 30, 'SELECT WORLD', {
      fontFamily: 'Orbitron, monospace', fontSize: '17px', fontStyle: 'bold',
      color: '#ffffff', letterSpacing: 5,
      shadow: { offsetX:0, offsetY:0, color:'#ffffff', blur:12, fill:true }
    }).setOrigin(0.5));

    const cardW = 130, cardH = 178, gap = 10;
    const totalW = THEME_ORDER.length * (cardW + gap) - gap;
    const startX = W/2 - totalW/2;

    THEME_ORDER.forEach((id, i) => {
      const theme = THEMES[id];
      const cx = startX + i * (cardW + gap);
      const cy = 58;
      const isSel = id === this.selectedTheme;
      const tInt = Phaser.Display.Color.HexStringToColor(theme.hudColor).color;

      // Card
      const card = this.add.graphics();
      const _drawCard = (hover) => {
        card.clear();
        card.fillStyle(isSel ? 0x0a0a28 : (hover ? 0x080820 : 0x04040e), 1);
        card.fillRoundedRect(cx, cy, cardW, cardH, 10);
        card.lineStyle(isSel ? 2.5 : (hover ? 1.5 : 1), tInt, isSel ? 1 : (hover ? 0.7 : 0.25));
        card.strokeRoundedRect(cx, cy, cardW, cardH, 10);
        if (isSel) {
          // glow
          card.lineStyle(8, tInt, 0.08);
          card.strokeRoundedRect(cx - 3, cy - 3, cardW + 6, cardH + 6, 13);
        }
      };
      _drawCard(false);
      this.overlayLayer.add(card);

      if (isSel) {
        this.tweens.add({ targets: card, alpha: { from:0.85, to:1 }, duration:900, yoyo:true, repeat:-1 });
      }

      // Icon
      const icon = this.add.text(cx + cardW/2, cy + 28, theme.icon, { fontSize: '34px' }).setOrigin(0.5);
      // Name
      const name = this.add.text(cx + cardW/2, cy + 72, theme.name, {
        fontFamily: 'Orbitron, monospace', fontSize: '8px', fontStyle: 'bold',
        color: theme.hudColor, wordWrap:{ width: cardW-10 }, align:'center'
      }).setOrigin(0.5);
      // Desc
      const desc = this.add.text(cx + cardW/2, cy + 96, theme.description, {
        fontFamily: 'Share Tech Mono, monospace', fontSize: '8px',
        color: '#888888', wordWrap:{ width: cardW-14 }, align:'center'
      }).setOrigin(0.5);
      this.overlayLayer.add([icon, name, desc]);

      if (isSel) {
        const selBadge = this.add.graphics();
        selBadge.fillStyle(tInt, 0.2);
        selBadge.fillRoundedRect(cx + 10, cy + cardH - 28, cardW - 20, 20, 10);
        const selTxt = this.add.text(cx + cardW/2, cy + cardH - 18, '✓ SELECTED', {
          fontFamily: 'Share Tech Mono, monospace', fontSize: '8px', color: theme.hudColor
        }).setOrigin(0.5);
        this.overlayLayer.add([selBadge, selTxt]);
      }

      // Full-card zone
      const zone = this.add.zone(cx, cy, cardW, cardH).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => { if (!isSel) _drawCard(true); sound.hover(); });
      zone.on('pointerout',  () => { if (!isSel) _drawCard(false); });
      zone.on('pointerdown', () => {
        sound.select();
        sound.playThemeStinger(id);
        this.selectedTheme = id;
        localStorage.setItem('neonrun_theme', id);
        this._clearOverlay();
        this._buildMain();
      });
      this.overlayLayer.add(zone);
    });

    // Back button
    this._makeOverlayBtn(W/2, H - 42, 'BACK', '#ff0080', () => { this._clearOverlay(); this._buildMain(); });

    this.input.keyboard.removeAllListeners('keydown-ESC');
    this.input.keyboard.once('keydown-ESC', () => { this._clearOverlay(); this._buildMain(); });
  }

  // ── High scores overlay ───────────────────────────────────────────
  async _showHighScores() {
    const W = this.W, H = this.H;
    this.mainLayer.setVisible(false);
    this.overlayLayer.removeAll(true);

    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.92);
    dim.fillRect(0, 0, W, H);
    this.overlayLayer.add(dim);

    const loading = this.add.text(W/2, H/2, 'LOADING...', {
      fontFamily: 'Orbitron, monospace', fontSize: '14px', color: '#00f5ff'
    }).setOrigin(0.5);
    this.overlayLayer.add(loading);

    const data = await fetchLeaderboard(12);
    loading.destroy();

    const pW = 460, pH = 358, px = W/2 - pW/2, py = H/2 - pH/2;

    const panel = this.add.graphics();
    panel.fillStyle(0x03030f, 0.98);
    panel.fillRoundedRect(px, py, pW, pH, 14);
    panel.lineStyle(2, 0xffee00, 0.75);
    panel.strokeRoundedRect(px, py, pW, pH, 14);
    panel.lineStyle(6, 0xffee00, 0.06);
    panel.strokeRoundedRect(px - 3, py - 3, pW + 6, pH + 6, 17);
    this.overlayLayer.add(panel);

    this.overlayLayer.add(this.add.text(W/2, py + 26, '🏆  HALL OF FAME', {
      fontFamily: 'Orbitron, monospace', fontSize: '17px', fontStyle: 'bold',
      color: '#ffee00',
      shadow: { offsetX:0, offsetY:0, color:'#ffee00', blur:18, fill:true }
    }).setOrigin(0.5));

    const hY = py + 54;
    const cols = { rank: px+26, name: px+68, score: px+pW-108, coins: px+pW-32 };
    const hS = { fontFamily:'Share Tech Mono, monospace', fontSize:'10px', color:'#555555' };
    [this.add.text(cols.rank,hY,'#',hS),
     this.add.text(cols.name,hY,'NAME',hS),
     this.add.text(cols.score,hY,'SCORE',hS).setOrigin(1,0),
     this.add.text(cols.coins,hY,'COINS',hS).setOrigin(1,0),
    ].forEach(t => this.overlayLayer.add(t));

    const divG = this.add.graphics();
    divG.lineStyle(1, 0xffee00, 0.12);
    divG.lineBetween(px+14, hY+16, px+pW-14, hY+16);
    this.overlayLayer.add(divG);

    const medals = ['🥇','🥈','🥉'];
    if (!data || data.length === 0) {
      this.overlayLayer.add(this.add.text(W/2, py+pH/2+14, 'No scores yet.\nBe the first!', {
        fontFamily:'Share Tech Mono, monospace', fontSize:'13px', color:'#444', align:'center'
      }).setOrigin(0.5));
    }

    (data||[]).slice(0,11).forEach((entry, i) => {
      const ry = hY + 22 + i * 22;
      const color = i < 3 ? '#ffffff' : '#666666';
      const rowBg = this.add.graphics();
      if (i % 2 === 0) { rowBg.fillStyle(0xffffff, 0.02); rowBg.fillRect(px+10, ry-3, pW-20, 20); }
      this.overlayLayer.add(rowBg);
      [this.add.text(cols.rank, ry, i<3 ? medals[i] : `${i+1}`, { fontFamily:'Share Tech Mono, monospace', fontSize:'12px', color }),
       this.add.text(cols.name, ry, (entry.name||'ANON').slice(0,12), { fontFamily:'Orbitron, monospace', fontSize:'10px', color }),
       this.add.text(cols.score, ry, `${entry.score}`, { fontFamily:'Share Tech Mono, monospace', fontSize:'12px', color: i<3?'#ffee00':'#888' }).setOrigin(1,0),
       this.add.text(cols.coins, ry, `${entry.coins}`, { fontFamily:'Share Tech Mono, monospace', fontSize:'12px', color:'#88ff44' }).setOrigin(1,0),
      ].forEach(t => this.overlayLayer.add(t));
    });

    this._makeOverlayBtn(W/2, py + pH - 22, 'CLOSE', '#ff0080', () => { this._clearOverlay(); this._buildMain(); });
    this.input.keyboard.removeAllListeners('keydown-ESC');
    this.input.keyboard.once('keydown-ESC', () => { this._clearOverlay(); this._buildMain(); });
  }

  // Pill button directly on overlayLayer (not in container)
  _makeOverlayBtn(x, y, label, color, cb, w = 160, h = 34) {
    const col = Phaser.Display.Color.HexStringToColor(color).color;
    const r = h / 2;
    const bg = this.add.graphics();
    const _draw = (hover) => {
      bg.clear();
      bg.fillStyle(col, hover ? 0.28 : 0.1);
      bg.fillRoundedRect(x - w/2, y - h/2, w, h, r);
      bg.lineStyle(hover ? 2 : 1.5, col, hover ? 1 : 0.5);
      bg.strokeRoundedRect(x - w/2, y - h/2, w, h, r);
    };
    _draw(false);
    const txt = this.add.text(x, y, label, {
      fontFamily:'Orbitron, monospace', fontSize:'12px', color, letterSpacing:2
    }).setOrigin(0.5);
    const zone = this.add.zone(x - w/2, y - h/2, w, h).setOrigin(0).setInteractive({ useHandCursor:true });
    zone.on('pointerover', () => { _draw(true); txt.setScale(1.05); sound.hover(); });
    zone.on('pointerout',  () => { _draw(false); txt.setScale(1); });
    zone.on('pointerdown', () => { sound.select(); cb(); });
    this.overlayLayer.add([bg, txt, zone]);
  }
}
