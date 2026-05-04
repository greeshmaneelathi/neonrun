import { sound } from '../SoundManager.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, themeId = 'neon', charId = null) {
    const effectiveChar = charId || 'hacker';
    const key = `char_${themeId}_${effectiveChar}`;
    super(scene, x, y, key);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.themeId = themeId;
    this.charId = effectiveChar;

    this.setCollideWorldBounds(false);
    this.setSize(20, 24);
    this.setOffset(4, 4);

    this.jumpsLeft = 2;
    this.isGrounded = false;
    this.isDead = false;
    this.runFrame = 0;
    this.runTimer = 0;
    this.invincible = false;
    this.wasGrounded = false;

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this.jumpKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  land() {
    if (!this.wasGrounded) sound.land();
    this.jumpsLeft = 2;
    this.isGrounded = true;
    this.wasGrounded = true;
  }

  jump(scene) {
    if (this.jumpsLeft <= 0) return;
    const isDouble = this.jumpsLeft === 1;
    this.setVelocityY(-520);
    this.jumpsLeft--;
    this.isGrounded = false;
    this.wasGrounded = false;

    isDouble ? sound.doubleJump() : sound.jump();

    const color = isDouble ? 0xff0080 : 0x00f5ff;
    const emitter = scene.add.particles(this.x, this.y+14, 'particle', {
      speed:{min:40,max:120}, angle:{min:200,max:340},
      scale:{start:0.5,end:0}, tint: color,
      alpha:{start:1,end:0}, lifespan:300,
      quantity: isDouble ? 14 : 8
    });
    scene.time.delayedCall(400, () => emitter.destroy());
  }

  hit(scene) {
    if (this.invincible || this.isDead) return false;
    // Use hitInvincible flag for the brief post-hit protection
    // so it doesn't overwrite the longer respawn invincibility
    this.invincible = true;
    this._hitInvincibleTimer = scene.time.delayedCall(700, () => {
      // Only turn off if we're not in respawn invincibility
      if (!this._respawnInvincible) {
        this.invincible = false;
        this.setAlpha(1);
      }
    });
    scene.tweens.add({
      targets: this, alpha:{from:1,to:0.2},
      duration: 100, yoyo: true, repeat: 5,
      onComplete: () => { if (!this._respawnInvincible) this.setAlpha(1); }
    });
    this.setVelocityY(-300);
    scene.cameras.main.shake(200, 0.01);
    return true;
  }

  die(scene) {
    if (this.isDead) return;
    this.isDead = true;
    this.setVelocityY(-400);
    this.setVelocityX(-100);
    const emitter = scene.add.particles(this.x, this.y, 'particle', {
      speed:{min:80,max:200}, angle:{min:0,max:360},
      scale:{start:0.8,end:0}, tint:[0x00f5ff,0xff0080,0xffee00],
      alpha:{start:1,end:0}, lifespan:600, quantity:24
    });
    scene.time.delayedCall(700, () => emitter.destroy());
    scene.cameras.main.shake(300, 0.02);
  }

  update(scene, delta) {
    if (this.isDead) return;
    const onGround = this.body.blocked.down;
    if (onGround && !this.isGrounded) this.land();
    if (!onGround) { this.isGrounded = false; this.wasGrounded = false; }

    // Touch state from global (set by main.js touch buttons)
    const touch = window.touchState || {};

    const leftHeld  = this.cursors.left.isDown  || this.wasd.left.isDown  || touch.left;
    const rightHeld = this.cursors.right.isDown || this.wasd.right.isDown || touch.right;

    if (leftHeld)       this.setVelocityX(Math.max(this.body.velocity.x - 30, -180));
    else if (rightHeld) this.setVelocityX(Math.min(this.body.velocity.x + 30, 180));
    else                this.setVelocityX(this.body.velocity.x * 0.85);

    // ignoreNextJump is set when space dismisses the respawn screen
    if (this.ignoreNextJump) {
      this.ignoreNextJump = false;
      if (this.jumpKey) this.jumpKey.reset();
      if (this.cursors?.up) this.cursors.up.reset();
      if (this.wasd?.up) this.wasd.up.reset();
      if (touch) { touch.jumpJustPressed = false; touch.jump = false; }
    } else {
      // Touch jump fires once per tap (jumpJustPressed set on touchstart, cleared here)
      const touchJump = touch.jumpJustPressed;
      if (touchJump) touch.jumpJustPressed = false;

      const jumpPressed =
        Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
        Phaser.Input.Keyboard.JustDown(this.jumpKey) ||
        touchJump;
      if (jumpPressed) this.jump(scene);
    }

    // Animate
    this.runTimer += delta;
    if (this.runTimer > 100) {
      this.runTimer = 0;
      this.runFrame = (this.runFrame + 1) % 4;
      if (onGround) this.setTexture(`char_run_${this.runFrame}_${this.themeId}_${this.charId}`);
    }
    if (!onGround) this.setTexture(`char_${this.themeId}_${this.charId}`);

    if (this.body.velocity.x < -10) this.setFlipX(true);
    else if (this.body.velocity.x > 10) this.setFlipX(false);
  }
}