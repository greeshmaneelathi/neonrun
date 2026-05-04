import { POWERUP_TYPES } from './PowerUp.js';
import { AIR_COLLECTIBLE_TYPES } from './AirCollectibles.js';

export default class LevelGenerator {
  constructor(scene, themeId = 'neon') {
    this.scene    = scene;
    this.themeId  = themeId;
    this.lastX    = 800;
    this.lastY    = 340;
    this.platforms  = scene.physics.add.staticGroup();
    this.coins      = scene.physics.add.staticGroup();
    this.enemies    = scene.physics.add.group();
    this.obstacles  = scene.physics.add.group();
    this.powerups   = scene.physics.add.staticGroup();
    this.airItems   = scene.physics.add.staticGroup();
    this.groundTiles  = [];
    this.groundBodies = [];
    this.powerupCounter = 0;
    this.airCounter     = 0;
    this._buildGround();
    this._buildStart();
  }

  _platKey()   { return `platform_${this.themeId}`; }
  _floatKey()  { return `platform_float_${this.themeId}`; }
  _groundKey() { return `ground_${this.themeId}`; }
  _coinKey()   { return `coin_${this.themeId}`; }
  _enemyKey()  { return `enemy_${this.themeId}`; }
  _obstKey()   { return `obstacle_${this.themeId}`; }

  _buildGround() {
    for (let x = 0; x < 1600; x += 800) {
      const tile = this.scene.add.tileSprite(x + 400, 440, 800, 20, this._groundKey());
      this.groundTiles.push(tile);
      const body = this.scene.physics.add.staticImage(x + 400, 440, null);
      body.setSize(800, 20).setAlpha(0).refreshBody();
      this.groundBodies.push(body);
      this.platforms.add(body);
    }
  }

  _buildStart() {
    // Safe flat opening: 4 platforms in a row so player has time to settle
    for (let i = 0; i < 4; i++) this._placePlatform(160 + i * 72, 360, false);
    for (let i = 0; i < 3; i++) this._placeCoin(196 + i * 72, 334);
    this.lastX = 480;
    this.lastY = 360;
  }

  _placePlatform(x, y, isFloat = false) {
    const key  = isFloat ? this._floatKey() : this._platKey();
    const plat = this.platforms.create(x, y, key);
    plat.setImmovable(true);
    plat.refreshBody();
    return plat;
  }

  _placeCoin(x, y) {
    const coin = this.coins.create(x, y, this._coinKey());
    coin.setImmovable(true);
    coin.refreshBody();
    this.scene.tweens.add({ targets:coin, y:y - 6, duration:800, yoyo:true, repeat:-1, ease:'Sine.easeInOut' });
  }

  _placeEnemy(x, y) {
    const e = this.enemies.create(x, y, this._enemyKey());
    e.body.setGravityY(400); e.body.allowGravity = true;
    e.patrolStartX = x; e.patrolDir = 1;
    e.patrolSpeed  = 55 + Math.random() * 35;
    return e;
  }

  _placeObstacle(x, y) {
    const obs = this.obstacles.create(x, y, this._obstKey());
    obs.body.allowGravity = false; obs.body.immovable = true;
    if (this.themeId === 'neon' || this.themeId === 'ocean') {
      this.scene.tweens.add({ targets:obs, x:x + 55, duration:1100 + Math.random() * 500,
        yoyo:true, repeat:-1, ease:'Sine.easeInOut',
        onUpdate:()=>{ if (obs.body) obs.body.reset(obs.x, obs.y); }
      });
    } else if (this.themeId === 'lava') {
      obs.isGeyser = true; obs.geyserTimer = Math.random() * 2000; obs.baseY = y;
    } else if (this.themeId === 'space') {
      obs.vxObs = (Math.random() - 0.5) * 1.5; obs.vyObs = 0.5 + Math.random() * 0.8;
    }
    return obs;
  }

  _placePowerup(x, y, type) {
    const pu = this.powerups.create(x, y, type.key);
    pu.setImmovable(true); pu.refreshBody(); pu.powerupType = type;
    this.scene.tweens.add({ targets:pu, y:y - 8, duration:900, yoyo:true, repeat:-1, ease:'Sine.easeInOut' });
  }

  _placeAirItem(x, y) {
    const types = Object.values(AIR_COLLECTIBLE_TYPES);
    const total = types.reduce((s, t) => s + t.weight, 0);
    let rand = Math.random() * total, picked = types[0];
    for (const t of types) { rand -= t.weight; if (rand <= 0) { picked = t; break; } }

    const item = this.airItems.create(x, y, picked.key);
    item.setImmovable(true); item.refreshBody(); item.airType = picked;
    this.scene.tweens.add({ targets:item, y:y - 10, duration:700, yoyo:true, repeat:-1, ease:'Sine.easeInOut' });
    this.scene.tweens.add({ targets:item, angle:360, duration:2200, repeat:-1, ease:'Linear' });

    const ring = this.scene.add.graphics();
    ring.lineStyle(1, picked.color, 0.45);
    ring.strokeCircle(0, 0, 18);
    ring.setDepth(8);
    item._ring = ring;
    this.scene.tweens.add({ targets:ring, alpha:{from:0.45,to:0.05}, scaleX:{from:1,to:1.5},
      scaleY:{from:1,to:1.5}, duration:900, yoyo:true, repeat:-1 });
  }

  generate(cameraX, score) {
    if (this.lastX > cameraX + 1300) return;

    // Difficulty ramps VERY slowly — 0→1 over first 200 score points
    // First 50 points: almost no enemies/obstacles, wide platforms, small gaps
    const difficulty = Math.min(score / 200, 1);
    const earlyGame  = score < 50; // extra easy phase

    // Gaps: start small, grow with difficulty
    const gapMin = earlyGame ? 50 : 60 + difficulty * 60;
    const gapMax = earlyGame ? 80 : 110 + difficulty * 80;
    const gap    = gapMin + Math.random() * (gapMax - gapMin);

    // Platforms: start wide (5 tiles), shrink slowly
    const minTiles = earlyGame ? 4 : Math.max(2, 5 - Math.floor(difficulty * 3));
    const tiles    = minTiles + Math.floor(Math.random() * 2);

    // Y change: small at start, increases with difficulty
    const maxDeltaY = earlyGame ? 40 : 40 + difficulty * 60;
    const deltaY    = (Math.random() - 0.5) * maxDeltaY;
    this.lastY      = Phaser.Math.Clamp(this.lastY + deltaY, 180, 360);

    const isFloat = !earlyGame && Math.random() < difficulty * 0.2;
    const startX  = this.lastX + gap;

    for (let i = 0; i < tiles; i++) this._placePlatform(startX + i * 72, this.lastY, isFloat);

    // Coins on top
    for (let i = 1; i < tiles; i++) {
      if (Math.random() < 0.7) this._placeCoin(startX + i * 72, this.lastY - 26);
    }

    // Obstacles & enemies — NONE in early game, slowly introduced
    if (!earlyGame && tiles >= 3) {
      const enemyChance = difficulty * 0.3;
      const obstChance  = difficulty * 0.25;
      let placed = false;

      if (Math.random() < obstChance) {
        this._placeObstacle(startX + (tiles - 1) * 72, this.lastY - 40);
        placed = true;
      }
      if (!placed && Math.random() < enemyChance) {
        this._placeEnemy(startX + 72, this.lastY - 28);
      }
    }

    // Powerup every 8 platforms
    this.powerupCounter++;
    if (this.powerupCounter >= 8 && tiles >= 3) {
      this.powerupCounter = 0;
      const types = Object.values(POWERUP_TYPES);
      this._placePowerup(startX + 72, this.lastY - 36, types[Math.floor(Math.random() * types.length)]);
    }

    // Air collectible every 5 platforms
    this.airCounter++;
    if (this.airCounter >= 5) {
      this.airCounter = 0;
      const airX = startX - gap * 0.45;
      const airY = this.lastY - 80 - Math.random() * 50;
      this._placeAirItem(airX, airY);
    }

    this.lastX = startX + tiles * 72;
  }

  updateEnemies(delta) {
    this.enemies.getChildren().forEach(e => {
      if (!e.active) return;
      e.setVelocityX(e.patrolDir * e.patrolSpeed);
      if (Math.abs(e.x - e.patrolStartX) > 55) e.patrolDir *= -1;
      e.setFlipX(e.patrolDir < 0);
    });
  }

  updateObstacles(delta) {
    this.obstacles.getChildren().forEach(obs => {
      if (!obs.active) return;
      if (this.themeId === 'space' && obs.vyObs) {
        obs.y += obs.vyObs; obs.x += obs.vxObs;
        if (obs.body) obs.body.reset(obs.x, obs.y);
      }
      if (this.themeId === 'lava' && obs.isGeyser) {
        obs.geyserTimer -= delta;
        if (obs.geyserTimer <= 0) {
          obs.geyserTimer = 2000 + Math.random() * 1500;
          this.scene.tweens.add({ targets:obs, y:obs.baseY - 75, duration:280, yoyo:true, ease:'Power2',
            onUpdate:()=>{ if (obs.body) obs.body.reset(obs.x, obs.y); }
          });
        }
      }
    });
  }

  updateAirItems() {
    this.airItems.getChildren().forEach(item => {
      if (item._ring) { item._ring.x = item.x; item._ring.y = item.y; }
    });
  }

  scrollGround(cameraX) {
    this.groundTiles.forEach((tile, i) => {
      tile.tilePositionX = cameraX;
      tile.x = cameraX + 400;
      if (this.groundBodies[i] && Math.abs(tile.x - this.groundBodies[i].x) > 400) {
        this.groundBodies[i].x = tile.x;
        this.groundBodies[i].refreshBody();
      }
    });
  }

  cleanup(cameraX) {
    const minX = cameraX - 220;
    [this.platforms, this.coins, this.powerups, this.airItems].forEach(group => {
      group.getChildren().forEach(obj => {
        if (obj.x < minX) {
          if (obj._ring) { obj._ring.destroy(); obj._ring = null; }
          group.remove(obj, true, true);
        }
      });
    });
    [this.enemies, this.obstacles].forEach(group => {
      group.getChildren().forEach(obj => { if (obj.x < minX) obj.destroy(); });
    });
  }
}
