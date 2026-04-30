import { sound } from "../SoundManager.js";
import { fetchLeaderboard, submitScore } from '../supabase.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.themeId    = data.theme || localStorage.getItem('neonrun_theme') || 'neon';
    this.finalScore = data.score || 0;
    this.finalCoins = data.coins || 0;
    this.finalBest  = data.best  || 0;
    this.playerName = localStorage.getItem('neonrun_name') || '';
    this.submitted  = false;
    this.leaderboard = [];
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.W = W; this.H = H;

    this.add.image(W/2, H/2, 'bg_far');
    this.add.image(W/2, H/2, 'bg_city').setAlpha(0.4);
    this.add.image(W/2, H/2, 'scanlines').setAlpha(0.25);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.68);
    overlay.fillRect(0, 0, W, H);

    fetchLeaderboard(10).then(data => { this.leaderboard = data || []; });

    this._buildEntryPanel();
    this.cameras.main.fadeIn(400);
  }

  // ── Shared pill button helper ─────────────────────────────────────
  _makeBtn(x, y, label, color, callback, w = 160, h = 36) {
    const col = Phaser.Display.Color.HexStringToColor(color).color;
    const r = h / 2;
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
      fontFamily: 'Orbitron, monospace', fontSize: '12px',
      color, letterSpacing: 2
    }).setOrigin(0.5);
    const zone = this.add.zone(x - w/2, y - h/2, w, h)
      .setOrigin(0).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => { _draw(true); txt.setScale(1.05); sound.hover(); });
    zone.on('pointerout',  () => { _draw(false); txt.setScale(1); });
    zone.on('pointerdown', () => {
      this.tweens.add({ targets: txt, scaleX:0.92, scaleY:0.92, duration:60, yoyo:true });
      sound.select(); callback();
    });
    return { bg, txt, zone };
  }

  // ── Entry panel ───────────────────────────────────────────────────
  _buildEntryPanel() {
    const W = this.W, H = this.H;
    const isNewBest = this.finalScore >= this.finalBest && this.finalScore > 0;
    const borderCol = isNewBest ? 0xffee00 : 0xff0080;

    this.entryContainer = this.add.container(0, 0);

    const pW = 380, pH = 310, px = W/2 - pW/2, py = H/2 - pH/2;

    const panel = this.add.graphics();
    panel.fillStyle(0x03030f, 0.97);
    panel.fillRoundedRect(px, py, pW, pH, 14);
    panel.lineStyle(2, borderCol, 0.9);
    panel.strokeRoundedRect(px, py, pW, pH, 14);
    panel.lineStyle(6, borderCol, 0.07);
    panel.strokeRoundedRect(px - 3, py - 3, pW + 6, pH + 6, 17);
    this.entryContainer.add(panel);

    const title = this.add.text(W/2, py + 30, 'GAME OVER', {
      fontFamily: 'Orbitron, monospace', fontSize: '26px', fontStyle: 'bold',
      color: '#ff0080',
      shadow: { offsetX:0, offsetY:0, color:'#ff0080', blur:24, fill:true }
    }).setOrigin(0.5);
    this.entryContainer.add(title);

    if (isNewBest) {
      const nb = this.add.text(W/2, py + 60, '★  NEW BEST  ★', {
        fontFamily: 'Orbitron, monospace', fontSize: '11px', color: '#ffee00',
        shadow: { offsetX:0, offsetY:0, color:'#ffee00', blur:12, fill:true }
      }).setOrigin(0.5);
      this.tweens.add({ targets:nb, alpha:{ from:1, to:0.2 }, duration:500, yoyo:true, repeat:-1 });
      this.entryContainer.add(nb);
    }

    // Stats
    const sy = py + 88;
    [
      { label:'SCORE', value:this.finalScore, color:'#ffffff', x:px+58 },
      { label:'COINS', value:this.finalCoins,  color:'#ffee00', x:W/2 },
      { label:'BEST',  value:this.finalBest,   color:'#00f5ff', x:px+pW-58 },
    ].forEach(s => {
      this.entryContainer.add(this.add.text(s.x, sy, s.label, {
        fontFamily:'Share Tech Mono, monospace', fontSize:'9px', color:'#555555'
      }).setOrigin(0.5, 0));
      this.entryContainer.add(this.add.text(s.x, sy + 14, `${s.value}`, {
        fontFamily:'Orbitron, monospace', fontSize:'22px', fontStyle:'bold', color:s.color,
        shadow:{ offsetX:0, offsetY:0, color:s.color, blur:10, fill:true }
      }).setOrigin(0.5, 0));
    });

    // Name input
    const nameY = py + 172;
    this.entryContainer.add(this.add.text(W/2, nameY, 'ENTER YOUR NAME', {
      fontFamily:'Orbitron, monospace', fontSize:'10px', color:'#00f5ff', letterSpacing:3
    }).setOrigin(0.5));

    this._createNameInput(W/2, nameY + 22, pW - 60);

    // Buttons — proper pills, no brackets
    const { bg:subBg, txt:subTxt, zone:subZone } = this._makeBtn(W/2, nameY + 70, 'SUBMIT SCORE', '#ffee00', () => this._handleSubmit(), 180, 36);
    this.submitBtnTxt = subTxt;
    this.submitBtnBg  = subBg;
    this.entryContainer.add([subBg, subTxt, subZone]);

    const { bg:skBg, txt:skTxt, zone:skZone } = this._makeBtn(W/2 - 80, nameY + 116, 'SKIP', '#666666', () => this._showLeaderboard(), 100, 30);
    this.entryContainer.add([skBg, skTxt, skZone]);

    const { bg:lbBg, txt:lbTxt, zone:lbZone } = this._makeBtn(W/2 + 72, nameY + 116, 'LEADERBOARD', '#00f5ff', () => this._showLeaderboard(), 148, 30);
    this.entryContainer.add([lbBg, lbTxt, lbZone]);
  }

  _createNameInput(cx, cy, width) {
    const canvas = this.sys.game.canvas;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = rect.width  / this.W;
    const scaleY = rect.height / this.H;

    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.maxLength = 12;
    this.nameInput.placeholder = 'YOUR NAME';
    this.nameInput.value = this.playerName;
    this.nameInput.style.cssText = `
      position: fixed;
      left: ${rect.left + (cx - width/2) * scaleX}px;
      top:  ${rect.top  + cy * scaleY}px;
      width: ${width * scaleX}px;
      height: ${28 * scaleY}px;
      background: #07071e;
      border: 1px solid #00f5ff;
      border-radius: 6px;
      color: #ffffff;
      font-family: 'Orbitron', monospace;
      font-size: ${13 * scaleY}px;
      text-align: center;
      outline: none;
      letter-spacing: 3px;
      text-transform: uppercase;
      z-index: 1000;
      padding: 0 8px;
    `;
    document.body.appendChild(this.nameInput);
    this.nameInput.focus();
    this.nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._handleSubmit();
      e.stopPropagation();
    });
  }

  _removeNameInput() {
    if (this.nameInput) {
      this.playerName = this.nameInput.value.toUpperCase().trim();
      document.body.removeChild(this.nameInput);
      this.nameInput = null;
    }
  }

  async _handleSubmit() {
    if (this.submitted) return;
    this._removeNameInput();
    const name = this.playerName || 'ANON';
    localStorage.setItem('neonrun_name', name);

    if (this.submitBtnTxt) {
      this.submitBtnTxt.setText('SUBMITTING...');
      this.submitBtnTxt.setAlpha(0.5);
    }

    const ok = await submitScore(name, this.finalScore, this.finalCoins);
    this.submitted = true;

    if (ok) {
      const fresh = await fetchLeaderboard(10);
      if (fresh && fresh.length) this.leaderboard = fresh;
    }
    this._showLeaderboard();
  }

  // ── Leaderboard view ──────────────────────────────────────────────
  _showLeaderboard() {
    this._removeNameInput();
    if (this.entryContainer) { this.entryContainer.destroy(true); this.entryContainer = null; }

    const W = this.W, H = this.H;
    const pW = 430, pH = 354, px = W/2 - pW/2, py = H/2 - pH/2 - 8;

    const panel = this.add.graphics();
    panel.fillStyle(0x03030f, 0.97);
    panel.fillRoundedRect(px, py, pW, pH, 14);
    panel.lineStyle(2, 0x00f5ff, 0.85);
    panel.strokeRoundedRect(px, py, pW, pH, 14);
    panel.lineStyle(6, 0x00f5ff, 0.06);
    panel.strokeRoundedRect(px - 3, py - 3, pW + 6, pH + 6, 17);

    this.add.text(W/2, py + 24, 'LEADERBOARD', {
      fontFamily:'Orbitron, monospace', fontSize:'17px', fontStyle:'bold',
      color:'#00f5ff',
      shadow:{ offsetX:0, offsetY:0, color:'#00f5ff', blur:18, fill:true }
    }).setOrigin(0.5);

    const hY = py + 52;
    const cols = { rank:px+26, name:px+70, score:px+pW-108, coins:px+pW-34 };
    const hS = { fontFamily:'Share Tech Mono, monospace', fontSize:'10px', color:'#444444' };
    [this.add.text(cols.rank,hY,'#',hS),
     this.add.text(cols.name,hY,'NAME',hS),
     this.add.text(cols.score,hY,'SCORE',hS).setOrigin(1,0),
     this.add.text(cols.coins,hY,'COINS',hS).setOrigin(1,0),
    ].forEach(t => t);

    const dg = this.add.graphics();
    dg.lineStyle(1, 0x00f5ff, 0.15);
    dg.lineBetween(px+12, hY+16, px+pW-12, hY+16);

    const medals = ['🥇','🥈','🥉'];
    const myName = (this.playerName||'').toUpperCase().trim();

    if (!this.leaderboard || this.leaderboard.length === 0) {
      this.add.text(W/2, py+pH/2+10, 'No scores yet — be the first!', {
        fontFamily:'Share Tech Mono, monospace', fontSize:'13px', color:'#333', align:'center'
      }).setOrigin(0.5);
    }

    (this.leaderboard||[]).slice(0,10).forEach((entry, i) => {
      const ry = hY + 22 + i * 22;
      const isMe = entry.name === myName && entry.score === this.finalScore;
      const color = isMe ? '#ffee00' : (i<3 ? '#ffffff' : '#777777');

      if (isMe) {
        const hl = this.add.graphics();
        hl.fillStyle(0xffee00, 0.05);
        hl.fillRect(px+10, ry-3, pW-20, 20);
      }
      if (i % 2 === 0 && !isMe) {
        const rowBg = this.add.graphics();
        rowBg.fillStyle(0xffffff, 0.018);
        rowBg.fillRect(px+10, ry-3, pW-20, 20);
      }

      this.add.text(cols.rank, ry, i<3?medals[i]:`${i+1}`, { fontFamily:'Share Tech Mono, monospace', fontSize:'12px', color });
      this.add.text(cols.name, ry, (entry.name||'ANON').slice(0,12), {
        fontFamily:'Orbitron, monospace', fontSize:'10px', color, fontStyle: isMe?'bold':'normal'
      });
      this.add.text(cols.score, ry, `${entry.score}`, {
        fontFamily:'Share Tech Mono, monospace', fontSize:'12px', color: isMe?'#ffee00':(i<3?'#ffee00':'#999')
      }).setOrigin(1,0);
      this.add.text(cols.coins, ry, `${entry.coins}`, {
        fontFamily:'Share Tech Mono, monospace', fontSize:'12px', color:'#88ff44'
      }).setOrigin(1,0);
    });

    // Bottom buttons — pill style, no brackets
    const btnY = py + pH - 24;
    this._makeBtn(W/2 - 86, btnY, 'PLAY AGAIN', '#00f5ff', () => {
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', { theme:this.themeId });
        this.scene.start('UIScene',   { theme:this.themeId });
        this.scene.stop('GameOverScene');
      });
    }, 150, 34);

    this._makeBtn(W/2 + 86, btnY, 'MENU', '#ff0080', () => {
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
        this.scene.stop('GameOverScene');
      });
    }, 150, 34);

    this.input.keyboard.once('keydown-SPACE', () => {
      this.cameras.main.fadeOut(280,0,0,0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene',{theme:this.themeId});
        this.scene.start('UIScene',{theme:this.themeId});
        this.scene.stop('GameOverScene');
      });
    });
    this.input.keyboard.once('keydown-ESC', () => {
      this.cameras.main.fadeOut(280,0,0,0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
        this.scene.stop('GameOverScene');
      });
    });
  }

  shutdown() { this._removeNameInput(); }
}
