import Player from '../objects/Player.js';
import { CHARACTERS } from '../characters/CharacterConfig.js';
import LevelGenerator from '../objects/LevelGenerator.js';
import WorldEffects from '../objects/WorldEffects.js';
import { THEMES } from '../themes/ThemeConfig.js';
import { sound } from '../SoundManager.js';
import { POWERUP_TYPES } from '../objects/PowerUp.js';

export default class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.themeId = data.theme || localStorage.getItem('neonrun_theme') || 'neon';
    this.charId  = data.charId || localStorage.getItem(`neonrun_char_${this.themeId}`) || CHARACTERS[this.themeId][0].id;
  }

  create() {
    const W = this.scale.width, H = this.scale.height;
    this.W = W; this.H = H;
    this.theme = THEMES[this.themeId];

    this.score       = 0;
    this.coins       = 0;
    this.lives       = 3;
    this.gameOver    = false;
    this.waiting     = true;
    this.paused      = false;
    this.scrollSpeed = 200;
    this.lastScoreX  = 0;

    this.activePowerup = null;
    this.powerupTimer  = null;
    this.shieldActive  = false;
    this.magnetActive  = false;
    this.speedActive   = false;
    this.shieldRing    = null;

    // ── Backgrounds ────────────────────────────────────────────────────
    const [farKey, midKey, nearKey] = this.theme.bgLayers;
    this.bgFar  = this.add.tileSprite(W/2, H/2, W, H, farKey).setScrollFactor(0).setDepth(0);
    this.bgMid  = this.add.tileSprite(W/2, H/2, W, H, midKey).setScrollFactor(0).setAlpha(0.7).setDepth(0);
    this.bgNear = this.add.tileSprite(W/2, H/2, W, H, nearKey).setScrollFactor(0).setAlpha(0.5).setDepth(0);

    // ── Physics world ──────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, Number.MAX_SAFE_INTEGER, H);

    // ── Level ──────────────────────────────────────────────────────────
    this.level   = new LevelGenerator(this, this.themeId);
    this.worldFX = new WorldEffects(this, this.themeId);

    // ── Player ────────────────────────────────────────────────────────
    this.player = new Player(this, 150, 300, this.themeId, this.charId);
    this.player.setDepth(10);
    this._wireCollisions();

    // ── Camera follows player ─────────────────────────────────────────
    // setBounds only on X axis so camera scrolls right but not off top/bottom
    this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(100, 60);
    this.cameras.main.fadeIn(400);

    this.deathY = H + 60;

    // Scanlines - fixed to camera
    this.add.image(W/2, H/2, 'scanlines').setScrollFactor(0).setAlpha(0.15).setDepth(52);

    // ── Sound ─────────────────────────────────────────────────────────
    sound.setTheme(this.themeId);
    sound.startAmbient(this.themeId);

    // ── Freeze physics until player clicks start ───────────────────────
    this.physics.world.isPaused = true;

    // Pause key (ESC) - always active
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this._showReadyScreen();
  }

  // ── Collision wiring ───────────────────────────────────────────────
  _wireCollisions() {
    this.physics.add.collider(this.player, this.level.platforms);
    this.physics.add.collider(this.level.enemies, this.level.platforms);
    this.physics.add.overlap(this.player, this.level.coins,     (p,c)    => this._collectCoin(c));
    this.physics.add.overlap(this.player, this.level.powerups,  (p,pu)   => this._collectPowerup(pu));
    this.physics.add.overlap(this.player, this.level.airItems,  (p,item) => this._collectAirItem(item));
    this.physics.add.overlap(this.player, this.level.obstacles, (p,obs)  => this._handleObstacleHit(p, obs));
    this.physics.add.overlap(this.player, this.level.enemies,   (p,e)    => this._handleEnemyHit(p, e));
  }

  _handleObstacleHit(p, obs) {
    if (this.gameOver) return;
    if (this.shieldActive) {
      this._deactivatePowerup();
      this._showFloatingText(p.x, p.y-30, 'BLOCKED!', this.theme.hudColor);
      this.cameras.main.shake(150, 0.005);
    } else if (p.hit(this)) {
      this.deathX = this.player.x;
      this.lives--;
      this._safeUpdateUI('updateLives', this.lives);
      sound.hit();
      if (this.lives <= 0) this._triggerGameOver();
      else this._respawnPlayer();
    }
  }

  _handleEnemyHit(p, enemy) {
    if (this.gameOver) return;
    if (p.body.velocity.y > 0 && p.y < enemy.y - 10) {
      enemy.destroy(); p.setVelocityY(-380);
      this._addScore(3);
      this._showFloatingText(enemy.x, enemy.y-20, '+3', this.theme.accentColor);
      sound.stomp();
      this.worldFX.sparkBurst(enemy.x, enemy.y);
    } else if (this.shieldActive) {
      this._deactivatePowerup();
      this._showFloatingText(p.x, p.y-30, 'BLOCKED!', this.theme.hudColor);
      this.cameras.main.shake(150, 0.005);
      enemy.destroy();
    } else if (p.hit(this)) {
      this.deathX = this.player.x;
      this.lives--;
      this._safeUpdateUI('updateLives', this.lives);
      sound.hit();
      if (this.lives <= 0) this._triggerGameOver();
      else this._respawnPlayer();
    }
  }

  // ── Safe UI access ─────────────────────────────────────────────────
  _safeUpdateUI(method, ...args) {
    try { const ui = this.scene.get('UIScene'); if (ui) ui[method](...args); } catch(e){}
  }

  // ── Ready screen ───────────────────────────────────────────────────
  _showReadyScreen() {
    const W = this.W, H = this.H;
    const theme = this.theme;
    const chars = CHARACTERS[this.themeId];

    // Fixed to screen (not world) using a separate camera layer approach:
    // We use setScrollFactor(0) on all children via a container
    if (this.readyContainer) { this.readyContainer.destroy(true); this.readyContainer = null; }
    this.readyContainer = this.add.container(0, 0).setDepth(60);

    const makeFix = (obj) => { obj.setScrollFactor(0); return obj; };

    const bg = makeFix(this.add.graphics());
    bg.fillStyle(0x000000, 0.82);
    bg.fillRect(0, 0, W, H);
    this.readyContainer.add(bg);

    this.readyContainer.add(makeFix(this.add.text(W/2, 20, `${theme.icon}  ${theme.name}`, {
      fontFamily:'Orbitron, monospace', fontSize:'13px', color:theme.hudColor, letterSpacing:4
    }).setOrigin(0.5)));

    this.readyContainer.add(makeFix(this.add.text(W/2, 42, 'SELECT YOUR CHARACTER', {
      fontFamily:'Orbitron, monospace', fontSize:'10px', color:'#888888', letterSpacing:3
    }).setOrigin(0.5)));

    // Character cards
    const cardW=124, cardH=116, gap=8;
    const totalW = chars.length*(cardW+gap)-gap;
    const startCX = W/2 - totalW/2;

    chars.forEach((char, i) => {
      const cx = startCX + i*(cardW+gap), cy=60;
      const isSelected = char.id === this.charId;
      const cInt = char.color;
      const tInt = Phaser.Display.Color.HexStringToColor(theme.hudColor).color;

      const cardG = makeFix(this.add.graphics());
      cardG.fillStyle(isSelected ? 0x080828 : 0x04040e, 1);
      cardG.fillRoundedRect(cx, cy, cardW, cardH, 8);
      cardG.lineStyle(isSelected?2:1, isSelected?cInt:tInt, isSelected?1:0.22);
      cardG.strokeRoundedRect(cx, cy, cardW, cardH, 8);
      this.readyContainer.add(cardG);

      if (isSelected) {
        this.tweens.add({ targets:cardG, alpha:{from:0.75,to:1}, duration:700, yoyo:true, repeat:-1 });
      }

      const sprKey = `char_${this.themeId}_${char.id}`;
      const spr = makeFix(this.add.image(cx+cardW/2, cy+32, sprKey).setScale(2.0));
      this.readyContainer.add(spr);
      if (isSelected) this.tweens.add({ targets:spr, y:spr.y-4, duration:700, yoyo:true, repeat:-1, ease:'Sine.easeInOut' });

      this.readyContainer.add(makeFix(this.add.text(cx+cardW/2, cy+62, char.icon, {fontSize:'13px'}).setOrigin(0.5)));
      this.readyContainer.add(makeFix(this.add.text(cx+cardW/2, cy+78, char.name, {
        fontFamily:'Orbitron, monospace', fontSize:'8px', fontStyle:'bold',
        color:'#'+char.color.toString(16).padStart(6,'0')
      }).setOrigin(0.5)));
      this.readyContainer.add(makeFix(this.add.text(cx+cardW/2, cy+90, char.desc, {
        fontFamily:'Share Tech Mono, monospace', fontSize:'7px', color:'#666'
      }).setOrigin(0.5)));
      if (isSelected) {
        this.readyContainer.add(makeFix(this.add.text(cx+cardW/2, cy+cardH-8, '✓', {
          fontFamily:'Orbitron, monospace', fontSize:'10px',
          color:'#'+char.color.toString(16).padStart(6,'0')
        }).setOrigin(0.5)));
      }

      // Interactive zone — must NOT be in container for input to work correctly
      const zone = this.add.zone(cx, cy, cardW, cardH).setOrigin(0)
        .setScrollFactor(0).setDepth(61).setInteractive({ useHandCursor:true });
      this._readyZones = this._readyZones || [];
      this._readyZones.push(zone);
      zone.on('pointerover', () => { cardG.setAlpha(0.7); sound.hover(); });
      zone.on('pointerout',  () => cardG.setAlpha(1));
      zone.on('pointerdown', () => {
        if (char.id === this.charId) return;
        sound.select();
        this.charId = char.id;
        localStorage.setItem(`neonrun_char_${this.themeId}`, char.id);
        // Update player texture without destroying (avoids re-wiring)
        this.player.setTexture(`char_${this.themeId}_${char.id}`);
        this.player.charId = char.id;
        this._cleanupReadyZones();
        this._showReadyScreen();
      });
    });

    // Divider
    const dg = makeFix(this.add.graphics());
    dg.lineStyle(1, Phaser.Display.Color.HexStringToColor(theme.hudColor).color, 0.12);
    dg.lineBetween(28, 186, W-28, 186);
    this.readyContainer.add(dg);

    this.readyContainer.add(makeFix(this.add.text(W/2, 196, '← →  MOVE     ↑ / SPACE  JUMP     DOUBLE JUMP ✓', {
      fontFamily:'Share Tech Mono, monospace', fontSize:'9px', color:'#555'
    }).setOrigin(0.5)));

    // Air items legend
    const airRow = [
      {icon:'⚡',label:'BOOST',color:'#ffee00'},{icon:'🌀',label:'WARP',color:'#aa44ff'},
      {icon:'★',label:'+5',color:'#ffffff'},{icon:'💎',label:'+10',color:'#00ffff'},{icon:'🔮',label:'???',color:'#ff44ff'},
    ];
    this.readyContainer.add(makeFix(this.add.text(W/2, 212, 'COLLECT IN AIR:', {
      fontFamily:'Share Tech Mono, monospace', fontSize:'8px', color:'#444', letterSpacing:2
    }).setOrigin(0.5)));
    const iW=76, iSX=W/2-(airRow.length*iW)/2+iW/2;
    airRow.forEach((item,i) => {
      const ix=iSX+i*iW;
      this.readyContainer.add(makeFix(this.add.text(ix, 226, item.icon, {fontSize:'13px'}).setOrigin(0.5)));
      this.readyContainer.add(makeFix(this.add.text(ix, 242, item.label, {
        fontFamily:'Orbitron, monospace', fontSize:'7px', color:item.color
      }).setOrigin(0.5)));
    });

    // Start prompt
    const prompt = makeFix(this.add.text(W/2, 278, 'CLICK  OR  PRESS  ENTER  TO  START', {
      fontFamily:'Orbitron, monospace', fontSize:'12px', color:'#ffee00',
      shadow:{offsetX:0,offsetY:0,color:'#ffee00',blur:10,fill:true}
    }).setOrigin(0.5));
    this.readyContainer.add(prompt);
    this.tweens.add({ targets:prompt, alpha:{from:1,to:0.15}, duration:650, yoyo:true, repeat:-1 });

    // Input to start — ENTER or click background only
    this._bindStartInput();
  }

  _cleanupReadyZones() {
    if (this._readyZones) { this._readyZones.forEach(z => z.destroy()); this._readyZones = []; }
  }

  _bindStartInput() {
    const startFn = (src) => {
      this.input.off('pointerdown', pointerFn);
      this.input.keyboard.off('keydown-ENTER', enterFn);
      this.input.keyboard.off('keydown-SPACE', spaceFn);
      sound.playThemeStinger(this.themeId);
      this._dismissReadyScreen();
    };
    const pointerFn = () => startFn('pointer');
    const enterFn   = () => startFn('enter');
    const spaceFn   = () => {
      startFn('space');
      // Consume space so it doesn't become a jump
      this.time.delayedCall(80, () => { if (this.player?.jumpKey) this.player.jumpKey.reset(); });
    };
    this.input.once('pointerdown', pointerFn);
    this.input.keyboard.once('keydown-ENTER', enterFn);
    this.input.keyboard.once('keydown-SPACE', spaceFn);
  }

  _dismissReadyScreen() {
    if (!this.waiting) return;
    this.tweens.add({
      targets: this.readyContainer, alpha:0, duration:260,
      onComplete: () => {
        if (this.readyContainer) { this.readyContainer.destroy(true); this.readyContainer = null; }
        this._cleanupReadyZones();
        this.waiting = false;
        this.physics.world.isPaused = false;
      }
    });
  }

  // ── Pause ──────────────────────────────────────────────────────────
  _pauseGame() {
    if (this.paused || this.gameOver) return;
    this.paused = true;
    // Pause physics but NOT the scene (so UI still works)
    this.physics.world.isPaused = true;
    sound.stopAmbient();

    const W = this.W, H = this.H;

    // Build pause UI directly on scene (not container) with scrollFactor 0
    // so camera movement doesn't affect it
    const makeFix = (obj) => { obj.setScrollFactor(0); return obj; };

    this._pauseObjects = [];

    const bg = makeFix(this.add.graphics().setDepth(70));
    bg.fillStyle(0x000000, 0.78);
    bg.fillRect(0, 0, W, H);
    this._pauseObjects.push(bg);

    const panel = makeFix(this.add.graphics().setDepth(71));
    panel.fillStyle(0x06061a, 0.98);
    panel.fillRoundedRect(W/2-150, H/2-115, 300, 230, 14);
    panel.lineStyle(2, Phaser.Display.Color.HexStringToColor(this.theme.hudColor).color, 0.9);
    panel.strokeRoundedRect(W/2-150, H/2-115, 300, 230, 14);
    this._pauseObjects.push(panel);

    const title = makeFix(this.add.text(W/2, H/2-85, '⏸  PAUSED', {
      fontFamily:'Orbitron, monospace', fontSize:'22px', fontStyle:'bold', color:'#ffffff'
    }).setOrigin(0.5).setDepth(72));
    this._pauseObjects.push(title);

    const btns = [
      { label:'RESUME',    color:'#00f5ff', cb: () => this._resumeGame() },
      { label:'RESTART',   color:'#ffee00', cb: () => { this._destroyPauseUI(); this.paused=false; this.scene.restart({theme:this.themeId, charId:this.charId}); } },
      { label:'MAIN MENU', color:'#ff0080', cb: () => { this._destroyPauseUI(); this._cleanupAndGoMenu(); } },
    ];
    btns.forEach((b, i) => {
      const y = H/2 - 36 + i * 52;
      const col = Phaser.Display.Color.HexStringToColor(b.color).color;

      const btnBg = makeFix(this.add.graphics().setDepth(72));
      btnBg.fillStyle(col, 0.12);
      btnBg.fillRoundedRect(W/2-110, y-18, 220, 36, 18);
      btnBg.lineStyle(1.5, col, 0.6);
      btnBg.strokeRoundedRect(W/2-110, y-18, 220, 36, 18);
      this._pauseObjects.push(btnBg);

      const btn = makeFix(this.add.text(W/2, y, b.label, {
        fontFamily:'Orbitron, monospace', fontSize:'13px', color:b.color
      }).setOrigin(0.5).setDepth(73).setInteractive({ useHandCursor:true }));

      btn.on('pointerover', () => {
        btnBg.clear();
        btnBg.fillStyle(col, 0.28);
        btnBg.fillRoundedRect(W/2-110, y-18, 220, 36, 18);
        btnBg.lineStyle(2, col, 1);
        btnBg.strokeRoundedRect(W/2-110, y-18, 220, 36, 18);
        btn.setScale(1.05);
        sound.hover();
      });
      btn.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(col, 0.12);
        btnBg.fillRoundedRect(W/2-110, y-18, 220, 36, 18);
        btnBg.lineStyle(1.5, col, 0.6);
        btnBg.strokeRoundedRect(W/2-110, y-18, 220, 36, 18);
        btn.setScale(1);
      });
      btn.on('pointerdown', () => { sound.select(); b.cb(); });
      this._pauseObjects.push(btn);
    });
  }

  _destroyPauseUI() {
    if (this._pauseObjects) {
      this._pauseObjects.forEach(o => { try { o.destroy(); } catch(e){} });
      this._pauseObjects = null;
    }
  }

  _resumeGame() {
    if (!this.paused) return;
    this.paused = false;
    this._destroyPauseUI();
    // Only unpause physics if not in respawn wait
    if (!this.waiting) this.physics.world.isPaused = false;
    if (!this.gameOver) sound.startAmbient(this.themeId);
  }

  _cleanupAndGoMenu() {
    sound.stopAmbient();
    if (this.worldFX) { try { this.worldFX.destroy(); } catch(e){} }
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UIScene');
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });
  }

  // ── Respawn ────────────────────────────────────────────────────────
  _findNearestPlatform() {
    // Use recorded death position, fallback to player's current X
    const targetX = this.deathX || this.player.x;
    const platforms = this.level.platforms.getChildren();
    let best = null, bestDist = Infinity;

    platforms.forEach(plat => {
      if (!plat.active || !plat.body) return;
      if (plat.body.width >= 400) return; // skip ground bodies
      // Find platform closest to where player died
      const dist = Math.abs(plat.x - targetX);
      if (dist < bestDist) { bestDist = dist; best = plat; }
    });

    if (best) {
      // Place player standing ON TOP of platform surface.
      // Platform body.top = top surface in world Y.
      // Player sprite is 28px tall, physics body offset 4px from top = body starts at sprite.y - 10
      // So to land sprite center ON platform: sprite.y = body.top - 10
      const surfaceY = best.body.top - 10;
      const platformLeft = best.body.left + 24;
      return { x: platformLeft, y: surfaceY };
    }

    return { x: targetX, y: 400 };
  }

  _respawnPlayer() {
    const pos = this._findNearestPlatform();

    // Step 1: place player ABOVE platform, unpaused so gravity lands them
    this.player.isDead     = false;
    this.player.invincible = true;
    this.player.jumpsLeft  = 2;
    this.player.isGrounded = false;

    // Spawn 60px above the surface — physics will drop them onto it naturally
    this.player.setPosition(pos.x, pos.y - 60);
    this.player.setVelocity(0, 0);
    if (this.player.body) {
      this.player.body.velocity.set(0, 0);
      this.player.body.reset(pos.x, pos.y - 60);
    }

    // Snap camera to respawn location while physics runs
    this.cameras.main.stopFollow();
    this.cameras.main.setScroll(Math.max(0, pos.x - this.W * 0.35), 0);

    // Step 2: let physics run freely for 300ms so player lands on platform
    // During this time: waiting=false so physics runs, but scroll is frozen
    this.waiting = false;
    this.physics.world.isPaused = false;
    this._landingPhase = true; // flag to skip scroll in update()

    // Step 3: after landing, freeze and show "click to continue"
    this.time.delayedCall(300, () => {
      if (!this.player || this.gameOver) return;

      // Freeze player in place
      this.player.setVelocity(0, 0);
      if (this.player.body) this.player.body.velocity.set(0, 0);
      this.player.isGrounded = true;
      this._landingPhase = false;
      this.waiting = true;
      this.physics.world.isPaused = true;

      const W = this.W, H = this.H;
      const makeFix = (o) => { o.setScrollFactor(0); return o; };
      this._respawnObjects = [];

      const panel = makeFix(this.add.graphics().setDepth(65));
      panel.fillStyle(0x000000, 0.72);
      panel.fillRoundedRect(W/2-175, H/2-50, 350, 100, 12);
      panel.lineStyle(2, Phaser.Display.Color.HexStringToColor(this.theme.accentColor).color, 0.9);
      panel.strokeRoundedRect(W/2-175, H/2-50, 350, 100, 12);
      this._respawnObjects.push(panel);

      const hearts = ['','♥','♥  ♥','♥  ♥  ♥'][Math.max(0,this.lives)] || '';
      const lifeT = makeFix(this.add.text(W/2, H/2-22, hearts, {
        fontFamily:'Share Tech Mono, monospace', fontSize:'22px', color:this.theme.accentColor
      }).setOrigin(0.5).setDepth(66));
      this._respawnObjects.push(lifeT);

      const prompt = makeFix(this.add.text(W/2, H/2+18, 'CLICK OR ENTER TO CONTINUE', {
        fontFamily:'Orbitron, monospace', fontSize:'11px', color:'#ffee00'
      }).setOrigin(0.5).setDepth(66));
      this._respawnObjects.push(prompt);
      this.tweens.add({ targets:prompt, alpha:{from:1,to:0.15}, duration:500, yoyo:true, repeat:-1 });

      const resume = () => {
        this._destroyRespawnUI();
        this.waiting = false;
        this.physics.world.isPaused = false;
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setDeadzone(100, 60);
        this.time.delayedCall(1200, () => { if (this.player) this.player.invincible = false; });
      };

      this.input.off('pointerdown', this._respawnResumeFn);
      this.input.keyboard.off('keydown-ENTER', this._respawnResumeEnterFn);
      this.input.keyboard.off('keydown-SPACE', this._respawnResumeSpaceFn);

      this._respawnResumeFn      = resume;
      this._respawnResumeEnterFn = resume;
      this._respawnResumeSpaceFn = () => {
        if (this.player?.jumpKey) this.player.jumpKey.reset();
        if (this.player?.cursors?.up) this.player.cursors.up.reset();
        if (this.player?.wasd?.up) this.player.wasd.up.reset();
        if (this.player) this.player.ignoreNextJump = true;
        resume();
      };

      this.input.once('pointerdown',            this._respawnResumeFn);
      this.input.keyboard.once('keydown-ENTER', this._respawnResumeEnterFn);
      this.input.keyboard.once('keydown-SPACE', this._respawnResumeSpaceFn);
    });
  }

  _destroyRespawnUI() {
    if (this._respawnObjects) {
      this._respawnObjects.forEach(o => { try { o.destroy(); } catch(e){} });
      this._respawnObjects = null;
    }
  }

  // ── Collectibles ──────────────────────────────────────────────────
  _collectCoin(coin) {
    this.coins++; this._addScore(1);
    this._showFloatingText(coin.x, coin.y-16, '+1', '#ffee00');
    const e = this.add.particles(coin.x, coin.y, 'particle', {
      speed:{min:30,max:100}, angle:{min:0,max:360}, scale:{start:0.4,end:0},
      tint:this.theme.particleTints[0], alpha:{start:1,end:0}, lifespan:300, quantity:8
    });
    this.time.delayedCall(400, ()=>e.destroy());
    this.level.coins.remove(coin, true, true);
    sound.coin();
    this._safeUpdateUI('updateCoins', this.coins);
  }

  _collectPowerup(pu) {
    if (!pu.powerupType) return;
    this.level.powerups.remove(pu, true, true);
    this._activatePowerupType(pu.powerupType);
  }

  _collectAirItem(item) {
    const type = item.airType;
    if (!type || item._collected) return;
    item._collected = true;
    if (item._ring) { item._ring.destroy(); item._ring = null; }
    this.level.airItems.remove(item, true, true);
    switch (type.key) {
      case 'air_boost':
        sound.boostPad();
        this.player.setVelocityY(-700);
        this._showFloatingText(item.x, item.y-20, 'BOOST!', '#ffee00');
        this.worldFX.sparkBurst(item.x, item.y);
        break;
      case 'air_warp':
        sound.warpRing();
        this.player.x += 220;
        this._showFloatingText(item.x, item.y-20, 'WARP!', '#aa44ff');
        this.worldFX.warpEffect(item.x, item.y);
        break;
      case 'air_star':
        sound.star(); this._addScore(5);
        this._showFloatingText(item.x, item.y-20, '+5 ★', '#ffffff');
        this.worldFX.starBurst(item.x, item.y);
        break;
      case 'air_gem':
        sound.gem(); this._addScore(10);
        this._showFloatingText(item.x, item.y-20, '+10 💎', '#00ffff');
        this.worldFX.gemBurst(item.x, item.y);
        break;
      case 'air_mystery':
        sound.mystery();
        this._showFloatingText(item.x, item.y-20, '???', '#ff44ff');
        const types = Object.values(POWERUP_TYPES);
        this.time.delayedCall(200, () => this._activatePowerupType(types[Math.floor(Math.random()*types.length)]));
        break;
    }
  }

  _activatePowerupType(type) {
    this._deactivatePowerup();
    this.activePowerup = type.label;
    if (type.label === 'SHIELD') this.shieldActive = true;
    if (type.label === 'MAGNET') this.magnetActive = true;
    if (type.label === 'SPEED')  this.speedActive  = true;
    const hex = '#'+type.color.toString(16).padStart(6,'0');
    this._showFloatingText(this.player.x, this.player.y-40, type.label+'!', hex);
    this._safeUpdateUI('showPowerup', type.label, type.duration);
    this.powerupTimer = this.time.delayedCall(type.duration, ()=>this._deactivatePowerup());
    sound.powerup();
    if (type.label === 'SHIELD') {
      this.shieldRing = this.add.graphics().setDepth(9);
      this.shieldRing.lineStyle(2, type.color, 0.8);
      this.shieldRing.strokeCircle(0, 0, 22);
    }
    const e = this.add.particles(this.player.x, this.player.y, 'particle', {
      speed:{min:50,max:150}, angle:{min:0,max:360}, scale:{start:0.6,end:0},
      tint:type.color, alpha:{start:1,end:0}, lifespan:500, quantity:20
    });
    this.time.delayedCall(600, ()=>e.destroy());
  }

  _deactivatePowerup() {
    this.shieldActive=false; this.magnetActive=false; this.speedActive=false;
    this.activePowerup=null;
    if (this.powerupTimer) { this.powerupTimer.remove(); this.powerupTimer=null; }
    if (this.shieldRing)   { this.shieldRing.destroy(); this.shieldRing=null; }
    this._safeUpdateUI('hidePowerup');
  }

  _addScore(pts) {
    this.score += pts;
    this._safeUpdateUI('updateScore', this.score);
  }

  _showFloatingText(x, y, text, color) {
    const t = this.add.text(x, y, text, {
      fontFamily:'Orbitron, monospace', fontSize:'15px',
      color, stroke:'#000', strokeThickness:3
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets:t, y:y-40, alpha:0, duration:700,
      ease:'Cubic.easeOut', onComplete:()=>t.destroy() });
  }

  // ── Game Over ─────────────────────────────────────────────────────
  _triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    this._deactivatePowerup();
    this.player.die(this);
    sound.death(); sound.stopAmbient();
    const best = Math.max(this.score, parseInt(localStorage.getItem('neonrun_best')||0));
    localStorage.setItem('neonrun_best', best);
    this.time.delayedCall(1000, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (this.worldFX) { try { this.worldFX.destroy(); } catch(e){} }
        this.scene.stop('UIScene');
        this.scene.start('GameOverScene', { score:this.score, coins:this.coins, best, theme:this.themeId });
      });
    });
  }

  // ── Update loop ────────────────────────────────────────────────────
  update(time, delta) {
    if (this.gameOver) return;

    // ESC toggles pause at any time (even during respawn wait)
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      if (this.paused) this._resumeGame();
      else this._pauseGame();
      return;
    }

    // If paused OR (waiting AND paused), do nothing else
    if (this.paused) return;
    // If waiting (ready screen / respawn freeze) skip game logic
    if (this.waiting) return;

    const camX = this.cameras.main.scrollX;

    // During landing phase: physics runs but scroll is frozen — just update player
    if (this._landingPhase) {
      this.player.update(this, delta);
      this.level.scrollGround(camX);
      return;
    }

    // Speed ramps gradually
    const baseSpeed = 200 + Math.min(this.score*2, 180);
    this.scrollSpeed = this.speedActive ? baseSpeed*1.5 : baseSpeed;
    if (!this.player.isDead) this.player.x += (this.scrollSpeed * delta) / 1000;

    // Parallax backgrounds
    this.bgFar.tilePositionX  = camX * 0.05;
    this.bgMid.tilePositionX  = camX * 0.2;
    this.bgNear.tilePositionX = camX * 0.4;

    // Distance score
    const distScore = Math.floor((this.player.x - 150) / 120);
    if (distScore > this.lastScoreX) {
      this.score = distScore + this.coins*2;
      this.lastScoreX = distScore;
      this._safeUpdateUI('updateScore', this.score);
    }

    // Magnet
    if (this.magnetActive) {
      this.level.coins.getChildren().forEach(coin => {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, coin.x, coin.y);
        if (dist < 140) {
          const ang = Phaser.Math.Angle.Between(coin.x, coin.y, this.player.x, this.player.y);
          coin.x += Math.cos(ang)*5; coin.y += Math.sin(ang)*5;
          coin.refreshBody();
        }
      });
    }

    if (this.shieldRing) { this.shieldRing.x = this.player.x; this.shieldRing.y = this.player.y; }

    this.level.generate(camX, this.score);
    this.level.cleanup(camX);
    this.level.scrollGround(camX);
    this.level.updateEnemies(delta);
    this.level.updateObstacles(delta);
    this.level.updateAirItems();
    this.player.update(this, delta);
    this.worldFX.update(this.player.x, this.player.y, camX);

    // Death: fell off bottom
    if (this.player.y > this.deathY && !this.player.isDead) {
      this.deathX = this.player.x; // record where death happened
      this.lives--;
      this._safeUpdateUI('updateLives', this.lives);
      if (this.lives <= 0) this._triggerGameOver();
      else this._respawnPlayer();
    }
    // Death: scrolled off left
    if (this.player.x < camX - 20 && !this.player.isDead) this._triggerGameOver();
  }

  shutdown() {
    sound.stopAmbient();
    this._destroyPauseUI();
    this._destroyRespawnUI();
    this._cleanupReadyZones();
    if (this.worldFX) { try { this.worldFX.destroy(); } catch(e){} }
  }
}
