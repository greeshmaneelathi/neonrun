import { THEMES } from '../themes/ThemeConfig.js';
import { sound } from '../SoundManager.js';

export default class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene', active: false }); }

  init(data) {
    this.themeId = data.theme || localStorage.getItem('neonrun_theme') || 'neon';
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    const theme = THEMES[this.themeId];
    const hCol  = theme.hudColor;
    const aCol  = theme.accentColor;
    const hInt  = Phaser.Display.Color.HexStringToColor(hCol).color;
    const aInt  = Phaser.Display.Color.HexStringToColor(aCol).color;

    // ── HUD bar ───────────────────────────────────────────────────────
    const bar = this.add.graphics();
    bar.fillStyle(0x000000, 0.62);
    bar.fillRect(0, 0, W, 46);
    bar.lineStyle(1, hInt, 0.3);
    bar.lineBetween(0, 46, W, 46);

    // Subtle inner highlight
    bar.lineStyle(1, hInt, 0.06);
    bar.lineBetween(0, 1, W, 1);

    // ── Score ─────────────────────────────────────────────────────────
    this.add.text(14, 6, 'SCORE', {
      fontFamily:'Orbitron, monospace', fontSize:'8px', color:hCol,
      alpha:0.55, letterSpacing:3
    });
    this.scoreText = this.add.text(14, 17, '0', {
      fontFamily:'Orbitron, monospace', fontSize:'18px', fontStyle:'bold', color:'#ffffff',
      shadow:{ offsetX:0, offsetY:0, color:hCol, blur:10, fill:true }
    });

    // ── Coins ─────────────────────────────────────────────────────────
    this.add.image(130, 23, `coin_${this.themeId}`).setScale(1.3);
    this.coinText = this.add.text(146, 14, '0', {
      fontFamily:'Share Tech Mono, monospace', fontSize:'15px', color:'#ffee00',
      shadow:{ offsetX:0, offsetY:0, color:'#ffee00', blur:6, fill:true }
    });

    // ── Theme name (center) ───────────────────────────────────────────
    this.add.text(W/2, 10, `${THEMES[this.themeId].icon}`, { fontSize:'16px' }).setOrigin(0.5, 0);
    this.add.text(W/2, 28, theme.name, {
      fontFamily:'Orbitron, monospace', fontSize:'8px', color:hCol,
      alpha:0.5, letterSpacing:2
    }).setOrigin(0.5, 0);

    // ── Layout (right side, left to right):
    // [♥] [♥] [♥]       [⏸]  [🔊]
    //  hearts at W-240   pause W-76  sound W-36
    // Clear gap of ~80px between hearts and buttons

    this.livesGroup = this.add.container(W - 240, 13);
    this._drawLives(3);

    // ── Neon-themed icon buttons — PAUSE + SOUND, top right ──────────
    const btnR = 17;
    const pauseX = W - 76, soundX = W - 36;
    const btnY   = 23;

    // Pause button — neon themed
    this._pauseBg  = this.add.graphics();
    this._pauseLbl = this.add.text(pauseX, btnY, '⏸', {
      fontSize: '14px'
    }).setOrigin(0.5);
    this._drawIconBtn(this._pauseBg, pauseX, btnY, btnR, false, hInt);

    const pauseZone = this.add.zone(pauseX - btnR, btnY - btnR, btnR*2, btnR*2)
      .setOrigin(0).setInteractive({ useHandCursor: true });
    pauseZone.on('pointerover', () => {
      this._drawIconBtn(this._pauseBg, pauseX, btnY, btnR, true, hInt);
      this._pauseLbl.setScale(1.2);
      sound.hover();
    });
    pauseZone.on('pointerout', () => {
      this._drawIconBtn(this._pauseBg, pauseX, btnY, btnR, false, hInt);
      this._pauseLbl.setScale(1);
    });
    pauseZone.on('pointerdown', () => {
      this.tweens.add({ targets: this._pauseLbl, scaleX:0.75, scaleY:0.75, duration:60, yoyo:true });
      const gameScene = this.scene.get('GameScene');
      if (!gameScene || gameScene.gameOver) return;
      if (gameScene.paused) gameScene._resumeGame();
      else gameScene._pauseGame();
    });

    // Sound button — accent themed
    this._soundBg  = this.add.graphics();
    this._soundLbl = this.add.text(soundX, btnY, sound.enabled ? '🔊' : '🔇', {
      fontSize: '14px'
    }).setOrigin(0.5);
    this._drawIconBtn(this._soundBg, soundX, btnY, btnR, false, aInt);

    const soundZone = this.add.zone(soundX - btnR, btnY - btnR, btnR*2, btnR*2)
      .setOrigin(0).setInteractive({ useHandCursor: true });
    soundZone.on('pointerover', () => {
      this._drawIconBtn(this._soundBg, soundX, btnY, btnR, true, aInt);
      this._soundLbl.setScale(1.2);
      sound.hover();
    });
    soundZone.on('pointerout', () => {
      this._drawIconBtn(this._soundBg, soundX, btnY, btnR, false, aInt);
      this._soundLbl.setScale(1);
    });
    soundZone.on('pointerdown', () => {
      const on = sound.toggle();
      this._soundLbl.setText(on ? '🔊' : '🔇');
      this.tweens.add({ targets: this._soundLbl, scaleX:0.75, scaleY:0.75, duration:60, yoyo:true });
    });

    // ── Speed indicator (bottom right) ────────────────────────────────
    this.speedText = this.add.text(W - 12, H - 10, 'SPEED 1.0×', {
      fontFamily:'Share Tech Mono, monospace', fontSize:'9px', color:hCol, alpha:0.4
    }).setOrigin(1, 1);

    // ── Powerup bar ───────────────────────────────────────────────────
    this.powerupBg    = this.add.graphics();
    this.powerupBar   = this.add.graphics();
    this.powerupLabel = this.add.text(W/2, 58, '', {
      fontFamily:'Orbitron, monospace', fontSize:'10px', color:'#ffffff',
      shadow:{ offsetX:0, offsetY:0, color:'#ffffff', blur:8, fill:true }
    }).setOrigin(0.5, 0).setAlpha(0);

    this._powerupDuration = 1;
    this._powerupElapsed  = 0;
    this._powerupActive   = false;
    this._powerupColor    = 0x00f5ff;
  }

  _getChar() {
    try {
      const { CHARACTERS } = window._neonrunChars || {};
      if (!CHARACTERS) return null;
      const gs = this.scene.get('GameScene');
      const charId = gs?.charId;
      return CHARACTERS[this.themeId]?.find(c => c.id === charId) || null;
    } catch(e) { return null; }
  }

  _drawPowerBtn(g, x, y, hover) {
    const ready = this._powerCooldown <= 0;
    const col = ready ? 0xffee00 : 0x888800;
    g.clear();
    g.fillStyle(col, hover ? 0.28 : 0.12);
    g.fillRoundedRect(x - 55, y - 16, 110, 32, 16);
    g.lineStyle(hover ? 2 : 1.5, col, ready ? (hover ? 1 : 0.6) : 0.3);
    g.strokeRoundedRect(x - 55, y - 16, 110, 32, 16);
  }

  updatePowerCooldown(remaining, max) {
    this._powerCooldown    = remaining;
    this._powerMaxCooldown = max || 1;
    const ready = remaining <= 0;

    // Redraw button colour
    const W = this.scale.width;
    this._drawPowerBtn(this._pwrBg, W/2 - 60, this.scale.height - 30, false);
    this._pwrLabel.setColor(ready ? '#ffee00' : '#888800');
    this._pwrLabel.setText(ready ? '⚡ POWER' : `⚡ ${Math.ceil(remaining/1000)}s`);

    // Cooldown arc bar
    this._pwrBar.clear();
    if (!ready) {
      const progress = 1 - remaining / max;
      this._pwrBar.lineStyle(3, 0xffee00, 0.6);
      this._pwrBar.beginPath();
      this._pwrBar.arc(W/2 - 60, this.scale.height - 30, 18,
        -Math.PI/2, -Math.PI/2 + Math.PI * 2 * progress, false);
      this._pwrBar.strokePath();
    }
  }

  // ── Icon button draw helper — neon themed ────────────────────────
  _drawIconBtn(g, x, y, r, hover, col) {
    const c = col || 0x00f5ff;
    g.clear();
    // Outer glow ring
    if (hover) {
      g.lineStyle(5, c, 0.15);
      g.strokeCircle(x, y, r + 4);
    }
    // Fill
    g.fillStyle(c, hover ? 0.28 : 0.1);
    g.fillCircle(x, y, r);
    // Border
    g.lineStyle(hover ? 2 : 1.5, c, hover ? 1 : 0.55);
    g.strokeCircle(x, y, r);
    // Inner highlight arc (top-left)
    g.lineStyle(1, 0xffffff, hover ? 0.3 : 0.1);
    g.beginPath();
    g.arc(x, y, r - 3, Math.PI * 1.1, Math.PI * 1.6, false);
    g.strokePath();
  }

  // ── Lives ──────────────────────────────────────────────────────────
  _drawLives(count) {
    this.livesGroup.removeAll(true);
    for (let i = 0; i < 3; i++) {
      const filled = i < count;
      const heart = this.add.text(i * 30, 0, filled ? '♥' : '♡', {
        fontFamily:'Share Tech Mono, monospace', fontSize:'19px',
        color: filled ? THEMES[this.themeId].accentColor : '#333344',
        shadow: filled ? { offsetX:0, offsetY:0, color:THEMES[this.themeId].accentColor, blur:10, fill:true } : undefined
      }).setOrigin(0, 0);
      this.livesGroup.add(heart);
    }
  }

  // ── Public update methods ──────────────────────────────────────────
  updateScore(score) {
    if (this.scoreText) this.scoreText.setText(score);
    const spd = (1 + Math.min(score * 2, 180) / 200).toFixed(1);
    if (this.speedText) this.speedText.setText(`SPEED ${spd}×`);
  }

  updateCoins(count) { if (this.coinText) this.coinText.setText(count); }

  updateLives(lives) {
    const n = Math.max(0, lives);
    this._drawLives(n);
    if (n === 1) {
      this.tweens.add({ targets: this.livesGroup,
        alpha:{ from:1, to:0.35 }, duration:260, yoyo:true, repeat:4 });
    }
  }

  showPowerup(label, duration) {
    this._powerupDuration = duration;
    this._powerupElapsed  = 0;
    this._powerupActive   = true;
    const colors    = { SHIELD:'#00f5ff', MAGNET:'#ff0080', SPEED:'#ffee00' };
    const hexColors = { SHIELD:0x00f5ff,  MAGNET:0xff0080,  SPEED:0xffee00  };
    this._powerupColor = hexColors[label] || 0x00f5ff;
    this.powerupLabel.setText(`${label}`).setColor(colors[label] || '#ffffff').setAlpha(1);
  }

  hidePowerup() {
    this._powerupActive = false;
    this.powerupLabel.setAlpha(0);
    this.powerupBg.clear();
    this.powerupBar.clear();
  }

  update(time, delta) {
    if (!this._powerupActive) return;
    const W = this.scale.width;
    this._powerupElapsed += delta;
    const progress = Math.max(0, 1 - this._powerupElapsed / this._powerupDuration);
    const barW = 150, barH = 5, bx = W/2 - barW/2, by = 74;

    this.powerupBg.clear();
    this.powerupBg.fillStyle(0x000000, 0.45);
    this.powerupBg.fillRoundedRect(bx - 1, by - 1, barW + 2, barH + 2, 3);

    this.powerupBar.clear();
    this.powerupBar.fillStyle(this._powerupColor, 0.9);
    this.powerupBar.fillRoundedRect(bx, by, barW * progress, barH, 3);

    if (progress <= 0) this.hidePowerup();
  }
}
