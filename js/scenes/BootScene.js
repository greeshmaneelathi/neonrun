import { generateCharacterTextures } from "../characters/CharacterGenerator.js";
import { generateAirCollectibleTextures } from "../objects/AirCollectibles.js";
import { generatePowerUpTextures } from '../objects/PowerUp.js';
import { generateThemeAssets } from '../themes/ThemeAssetGenerator.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create() {
    // ── Shared assets ──────────────────────────────────────────────────────
    this._makeParticleTexture();
    this._makeScanlines();

    // ── Default (neon) assets for backward compat ──────────────────────────
    this._makeDefaultPlayer();
    this._makeDefaultPlatforms();
    this._makeDefaultCoin();
    this._makeDefaultEnemy();
    this._makeDefaultBg();

    // ── All theme assets ───────────────────────────────────────────────────
    generateThemeAssets(this);
    generatePowerUpTextures(this);
    generateAirCollectibleTextures(this);
    generateCharacterTextures(this);

    this.scene.start('MenuScene');
  }

  _makeDefaultPlayer() {
    const pg = this.make.graphics({ x: 0, y: 0, add: false });
    pg.fillStyle(0x00f5ff);
    pg.fillRect(6, 8, 16, 14);
    pg.fillStyle(0x000030);
    pg.fillRect(9, 10, 10, 6);
    pg.fillStyle(0xff0080, 0.8);
    pg.fillRect(10, 11, 8, 4);
    pg.fillStyle(0x00b8cc);
    pg.fillRect(7, 22, 5, 4);
    pg.fillRect(16, 22, 5, 4);
    pg.fillStyle(0xff0080);
    pg.fillRect(22, 10, 4, 8);
    pg.generateTexture('player', 28, 28);
    pg.destroy();

    [0, -2, 0, 2].forEach((off, i) => {
      const fg = this.make.graphics({ x: 0, y: 0, add: false });
      fg.fillStyle(0x00f5ff);
      fg.fillRect(6, 8+off, 16, 14);
      fg.fillStyle(0x000030);
      fg.fillRect(9, 10+off, 10, 6);
      fg.fillStyle(0xff0080, 0.8);
      fg.fillRect(10, 11+off, 8, 4);
      fg.fillStyle(0x00b8cc);
      fg.fillRect(7, 22+(i%2===0?0:2), 5, 4);
      fg.fillRect(16, 22+(i%2===0?2:0), 5, 4);
      fg.fillStyle(0xff0080);
      fg.fillRect(22, 10+off, 4, 8);
      fg.generateTexture(`player_run_${i}`, 28, 28);
      fg.destroy();
    });
  }

  _makeDefaultPlatforms() {
    const platG = this.make.graphics({ x: 0, y: 0, add: false });
    platG.fillStyle(0x1a0a4a);
    platG.fillRect(0, 0, 64, 18);
    platG.lineStyle(2, 0x00f5ff, 1);
    platG.strokeRect(0, 0, 64, 18);
    platG.fillStyle(0x00f5ff, 0.15);
    platG.fillRect(2, 2, 60, 6);
    platG.generateTexture('platform', 64, 18);
    platG.destroy();

    const fpG = this.make.graphics({ x: 0, y: 0, add: false });
    fpG.fillStyle(0x0a1a3a);
    fpG.fillRect(0, 0, 64, 14);
    fpG.lineStyle(2, 0xff0080, 1);
    fpG.strokeRect(0, 0, 64, 14);
    fpG.fillStyle(0xff0080, 0.15);
    fpG.fillRect(2, 2, 60, 5);
    fpG.generateTexture('platform_float', 64, 14);
    fpG.destroy();

    const gg = this.make.graphics({ x: 0, y: 0, add: false });
    gg.fillStyle(0x0d0020);
    gg.fillRect(0, 0, 800, 20);
    gg.lineStyle(3, 0x00f5ff, 1);
    gg.lineBetween(0, 0, 800, 0);
    gg.fillStyle(0x00f5ff, 0.08);
    gg.fillRect(0, 0, 800, 20);
    gg.lineStyle(1, 0x00f5ff, 0.2);
    for (let x = 0; x < 800; x += 40) gg.lineBetween(x, 0, x, 20);
    gg.generateTexture('ground_tile', 800, 20);
    gg.destroy();
  }

  _makeDefaultCoin() {
    const cg = this.make.graphics({ x: 0, y: 0, add: false });
    cg.fillStyle(0xffee00);
    cg.fillCircle(8, 8, 7);
    cg.fillStyle(0xffa500, 0.6);
    cg.fillCircle(8, 8, 4);
    cg.fillStyle(0xffff88);
    cg.fillCircle(5, 5, 2);
    cg.generateTexture('coin', 16, 16);
    cg.destroy();
  }

  _makeDefaultEnemy() {
    const eg = this.make.graphics({ x: 0, y: 0, add: false });
    eg.fillStyle(0xff3300);
    eg.fillRect(4, 8, 20, 14);
    eg.fillStyle(0xff6600);
    eg.fillRect(6, 10, 16, 10);
    for (let s = 0; s < 4; s++) eg.fillTriangle(5+s*6, 8, 8+s*6, 0, 11+s*6, 8);
    eg.fillStyle(0xffee00);
    eg.fillRect(7, 12, 4, 4);
    eg.fillRect(17, 12, 4, 4);
    eg.generateTexture('enemy', 28, 24);
    eg.destroy();
  }

  _makeDefaultBg() {
    const W = 800, H = 450;
    this._makeBgLayer('bg_far', W, H, 0x060614, 0x0a0a2a, 60, 1);
    this._makeBgLayer('bg_mid', W, H, 0x00000000, 0x0d0d2b, 30, 0.6);
    this._makeCityLayer(W, H);
  }

  _makeBgLayer(key, w, h, col1, col2, starCount, alpha) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    if (col1 !== 0x00000000) {
      g.fillGradientStyle(col1, col1, col2, col2, 1);
      g.fillRect(0, 0, w, h);
    }
    g.fillStyle(0xffffff, alpha);
    for (let i = 0; i < starCount; i++) {
      g.fillCircle(Math.random()*w, Math.random()*h*0.7, Math.random()<0.2?2:1);
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }

  _makeCityLayer(W, H) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    [[0,60,120],[70,40,80],[120,70,160],[200,50,100],[260,80,140],[350,45,90],[405,65,170],[480,55,110],[545,75,130],[630,50,95],[690,60,150],[760,40,85]].forEach(([x,w,h]) => {
      g.fillStyle(0x0a0a1e);
      g.fillRect(x, H-h, w, h);
      g.lineStyle(1, 0x00f5ff, 0.3);
      g.strokeRect(x, H-h, w, h);
      g.fillStyle(0x00f5ff, 0.4);
      for (let row = 0; row < Math.floor(h/18); row++) for (let col = 0; col < Math.floor(w/14); col++) {
        if (Math.random()>0.4) g.fillRect(x+4+col*14, H-h+8+row*18, 6, 8);
      }
    });
    g.generateTexture('bg_city', W, H);
    g.destroy();
  }

  _makeParticleTexture() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle', 8, 8);
    g.destroy();
  }

  _makeScanlines() {
    const W = 800, H = 450;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    for (let y = 0; y < H; y += 4) {
      g.fillStyle(0x000000, 0.12);
      g.fillRect(0, y, W, 2);
    }
    g.generateTexture('scanlines', W, H);
    g.destroy();
  }
}
