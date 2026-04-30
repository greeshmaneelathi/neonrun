export default class WorldEffects {
  constructor(scene, themeId) {
    this.scene = scene;
    this.themeId = themeId;
    this.emitters = [];
    this.timers = [];
    this.effects = [];
    this._init();
  }

  _init() {
    switch (this.themeId) {
      case 'neon':   this._initNeon();   break;
      case 'ocean':  this._initOcean();  break;
      case 'lava':   this._initLava();   break;
      case 'space':  this._initSpace();  break;
      case 'jungle': this._initJungle(); break;
    }
  }

  // ── Neon City: electric sparks + neon rain ─────────────────────────────
  _initNeon() {
    const scene = this.scene;
    const W = scene.scale.width, H = scene.scale.height;

    // Neon rain streaks (vertical lines falling)
    const rainG = scene.make.graphics({ x:0, y:0, add:false });
    rainG.fillStyle(0x00f5ff, 1);
    rainG.fillRect(0, 0, 2, 12);
    rainG.generateTexture('fx_rain', 2, 12);
    rainG.destroy();

    this.rainEmitter = scene.add.particles(0, 0, 'fx_rain', {
      x: { min: 0, max: W },
      y: { min: -20, max: 0 },
      speedY: { min: 300, max: 500 },
      speedX: { min: -20, max: 20 },
      lifespan: 800,
      alpha: { start: 0.4, end: 0 },
      tint: [0x00f5ff, 0xff0080, 0xffee00],
      quantity: 2,
      frequency: 60,
      scale: { min: 0.5, max: 1.2 },
    }).setScrollFactor(0).setDepth(2);
    this.emitters.push(this.rainEmitter);

    // Electric spark texture
    const spG = scene.make.graphics({ x:0, y:0, add:false });
    spG.fillStyle(0xffffff); spG.fillCircle(2,2,2);
    spG.generateTexture('fx_spark',4,4); spG.destroy();
  }

  // ── Deep Ocean: bubbles + caustics ────────────────────────────────────
  _initOcean() {
    const scene = this.scene;
    const W = scene.scale.width, H = scene.scale.height;

    // Bubble texture
    const bG = scene.make.graphics({ x:0, y:0, add:false });
    bG.lineStyle(1, 0x00ccff, 0.8);
    bG.strokeCircle(4,4,4);
    bG.fillStyle(0x00ccff, 0.15);
    bG.fillCircle(4,4,4);
    bG.generateTexture('fx_bubble',8,8); bG.destroy();

    this.bubbleEmitter = scene.add.particles(0, 0, 'fx_bubble', {
      x: { min: 0, max: W },
      y: H + 10,
      speedY: { min: -80, max: -160 },
      speedX: { min: -15, max: 15 },
      lifespan: { min: 2000, max: 4000 },
      alpha: { start: 0.7, end: 0 },
      scale: { min: 0.4, max: 1.6 },
      quantity: 1,
      frequency: 120,
    }).setScrollFactor(0).setDepth(2);
    this.emitters.push(this.bubbleEmitter);

    // Caustic light patches (slow-moving light circles)
    const cG = scene.make.graphics({ x:0, y:0, add:false });
    cG.fillStyle(0x0088ff, 0.12);
    cG.fillEllipse(40,20,80,20);
    cG.generateTexture('fx_caustic',80,20); cG.destroy();

    for (let i = 0; i < 5; i++) {
      const caustic = scene.add.image(
        Math.random() * W, 80 + Math.random() * 200, 'fx_caustic'
      ).setScrollFactor(0.1).setAlpha(0.4).setDepth(1);
      scene.tweens.add({
        targets: caustic,
        x: caustic.x + (Math.random()-0.5) * 200,
        alpha: { from: 0.2, to: 0.6 },
        scaleX: { from: 0.8, to: 1.4 },
        duration: 3000 + Math.random() * 2000,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
      this.effects.push(caustic);
    }
  }

  // ── Lava World: embers + heat shimmer ─────────────────────────────────
  _initLava() {
    const scene = this.scene;
    const W = scene.scale.width, H = scene.scale.height;

    // Ember texture
    const eG = scene.make.graphics({ x:0, y:0, add:false });
    eG.fillStyle(0xff6600); eG.fillCircle(3,3,3);
    eG.generateTexture('fx_ember',6,6); eG.destroy();

    this.emberEmitter = scene.add.particles(0, 0, 'fx_ember', {
      x: { min: 0, max: W },
      y: H,
      speedY: { min: -60, max: -180 },
      speedX: { min: -30, max: 30 },
      lifespan: { min: 1000, max: 2500 },
      alpha: { start: 1, end: 0 },
      tint: [0xff2200, 0xff6600, 0xffaa00, 0xffff00],
      scale: { min: 0.3, max: 1.0 },
      quantity: 2,
      frequency: 80,
      gravityY: -20,
    }).setScrollFactor(0).setDepth(2);
    this.emitters.push(this.emberEmitter);

    // Lava glow at bottom
    const glowG = scene.make.graphics({ x:0, y:0, add:false });
    glowG.fillGradientStyle(0xff2200, 0xff2200, 0x00000000, 0x00000000, 0.4, 0.4, 0, 0);
    glowG.fillRect(0, 0, W, 60);
    glowG.generateTexture('fx_lava_glow', W, 60); glowG.destroy();

    const glow = scene.add.image(W/2, H - 10, 'fx_lava_glow')
      .setScrollFactor(0).setDepth(3).setOrigin(0.5, 1);
    scene.tweens.add({
      targets: glow, alpha: { from: 0.4, to: 0.8 },
      duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
    this.effects.push(glow);
  }

  // ── Space: drifting stars + warp trails ───────────────────────────────
  _initSpace() {
    const scene = this.scene;
    const W = scene.scale.width, H = scene.scale.height;

    // Star streak texture
    const ssG = scene.make.graphics({ x:0, y:0, add:false });
    ssG.fillStyle(0xffffff); ssG.fillRect(0,0,8,1);
    ssG.generateTexture('fx_streak',8,1); ssG.destroy();

    this.streakEmitter = scene.add.particles(0, 0, 'fx_streak', {
      x: W + 10,
      y: { min: 20, max: H - 60 },
      speedX: { min: -400, max: -200 },
      speedY: { min: -10, max: 10 },
      lifespan: { min: 300, max: 800 },
      alpha: { start: 0.8, end: 0 },
      tint: [0xffffff, 0xaaaaff, 0x8888ff],
      scale: { min: 0.5, max: 2 },
      quantity: 1,
      frequency: 80,
    }).setScrollFactor(0).setDepth(2);
    this.emitters.push(this.streakEmitter);

    // Nebula pulse
    const nebG = scene.make.graphics({ x:0, y:0, add:false });
    nebG.fillStyle(0x330066, 0.15);
    nebG.fillCircle(50,40,50);
    nebG.generateTexture('fx_nebula',100,80); nebG.destroy();

    const neb = scene.add.image(W*0.7, H*0.3, 'fx_nebula')
      .setScrollFactor(0.02).setAlpha(0.5).setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: neb, scaleX:{from:1,to:1.3}, scaleY:{from:1,to:1.2}, alpha:{from:0.3,to:0.7},
      duration: 4000, yoyo:true, repeat:-1, ease:'Sine.easeInOut'
    });
    this.effects.push(neb);
  }

  // ── Jungle: fireflies + falling leaves ────────────────────────────────
  _initJungle() {
    const scene = this.scene;
    const W = scene.scale.width, H = scene.scale.height;

    // Firefly texture
    const ffG = scene.make.graphics({ x:0, y:0, add:false });
    ffG.fillStyle(0xaaff44); ffG.fillCircle(3,3,3);
    ffG.generateTexture('fx_firefly',6,6); ffG.destroy();

    this.fireflyEmitter = scene.add.particles(0, 0, 'fx_firefly', {
      x: { min: 0, max: W },
      y: { min: 80, max: H - 80 },
      speedX: { min: -20, max: 20 },
      speedY: { min: -15, max: 15 },
      lifespan: { min: 2000, max: 4000 },
      alpha: { start: 0, end: 0, steps: 10 },
      tint: [0xaaff44, 0x88ff00, 0xffff44],
      scale: { min: 0.5, max: 1.2 },
      quantity: 1,
      frequency: 200,
    }).setScrollFactor(0).setDepth(2);

    // Override alpha to pulse
    this.fireflyEmitter.onParticleEmit = (particle) => {
      particle.alpha = 0;
    };
    this.emitters.push(this.fireflyEmitter);

    // Leaf texture
    const lG = scene.make.graphics({ x:0, y:0, add:false });
    lG.fillStyle(0x44cc44, 0.9);
    lG.fillEllipse(6, 3, 12, 6);
    lG.generateTexture('fx_leaf',12,6); lG.destroy();

    this.leafEmitter = scene.add.particles(0, 0, 'fx_leaf', {
      x: { min: 0, max: W },
      y: -10,
      speedY: { min: 40, max: 100 },
      speedX: { min: -30, max: 30 },
      rotate: { min: 0, max: 360 },
      lifespan: { min: 2000, max: 4000 },
      alpha: { start: 0.8, end: 0 },
      tint: [0x44cc44, 0x88ff44, 0x226622, 0xaaff00],
      scale: { min: 0.6, max: 1.4 },
      quantity: 1,
      frequency: 300,
    }).setScrollFactor(0).setDepth(2);
    this.emitters.push(this.leafEmitter);
  }

  // ── Burst effects (called on events) ──────────────────────────────────

  sparkBurst(x, y) {
    if (this.themeId !== 'neon') return;
    const colors = { neon:[0x00f5ff,0xff0080], ocean:[0x00ccff,0x00ffaa], lava:[0xff6600,0xffaa00], space:[0xaaaaff,0xffffff], jungle:[0x44cc44,0xaaff00] };
    const tints = colors[this.themeId] || colors.neon;
    const e = this.scene.add.particles(x, y, 'fx_spark', {
      speed: { min:60, max:200 }, angle:{min:0,max:360},
      scale:{start:1.5,end:0}, tint: tints,
      alpha:{start:1,end:0}, lifespan:300, quantity:16
    });
    this.scene.time.delayedCall(400, () => e.destroy());
  }

  warpEffect(x, y) {
    const e = this.scene.add.particles(x, y, 'particle', {
      speed:{min:30,max:150}, angle:{min:0,max:360},
      scale:{start:0.8,end:0}, tint:[0xaa44ff,0xff44ff,0xffffff],
      alpha:{start:1,end:0}, lifespan:400, quantity:24
    });
    this.scene.time.delayedCall(500, () => e.destroy());
    // Screen flash
    const flash = this.scene.add.graphics().setScrollFactor(0).setDepth(60);
    flash.fillStyle(0xaa44ff, 0.3);
    flash.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
    this.scene.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });
  }

  starBurst(x, y) {
    const e = this.scene.add.particles(x, y, 'particle', {
      speed:{min:50,max:180}, angle:{min:0,max:360},
      scale:{start:1,end:0}, tint:[0xffffff,0xffffaa,0xffee00],
      alpha:{start:1,end:0}, lifespan:500, quantity:20
    });
    this.scene.time.delayedCall(600, () => e.destroy());
    const flash = this.scene.add.graphics().setScrollFactor(0).setDepth(60);
    flash.fillStyle(0xffffff, 0.25);
    flash.fillRect(0,0,this.scene.scale.width,this.scene.scale.height);
    this.scene.tweens.add({ targets:flash, alpha:0, duration:150, onComplete:()=>flash.destroy() });
  }

  gemBurst(x, y) {
    const e = this.scene.add.particles(x, y, 'particle', {
      speed:{min:60,max:200}, angle:{min:0,max:360},
      scale:{start:1.2,end:0}, tint:[0x00ffff,0xaaffff,0xffffff],
      alpha:{start:1,end:0}, lifespan:600, quantity:28
    });
    this.scene.time.delayedCall(700, () => e.destroy());
  }

  // ── Update (called each frame) ─────────────────────────────────────────
  update(playerX, playerY, cameraX) {
    // Fireflies: manually pulse alpha
    if (this.themeId === 'jungle' && this.fireflyEmitter) {
      this.fireflyEmitter.forEachAlive(p => {
        p.alpha = 0.3 + 0.7 * Math.abs(Math.sin(p.lifeT * 0.004));
      });
    }
  }

  destroy() {
    this.emitters.forEach(e => { try { e.destroy(); } catch(err){} });
    this.effects.forEach(e => { try { e.destroy(); } catch(err){} });
    this.timers.forEach(t => { try { t.remove(); } catch(err){} });
  }
}
